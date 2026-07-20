import { loadCurrentStateModule } from "@/current-state/loader";
import { evaluateRuleIds } from "@/rules/engine";
import { getModuleRuleIds } from "@/rules/module-rule-packs";
import type { RuleEvaluationSummary, RuleResult, RuleValues } from "@/rules/types";
import { canAccessFacility } from "@/security/facility-scope";
import { createCorrelationId } from "@/services/correlation";
import { buildFrontendValidationProfile } from "@/validation/business-rule-classifier";
import type {
  FrontendValidationProfile,
  FrontendValidationRule,
  ModuleValidationInput,
  ModuleValidationSummary,
} from "@/validation/types";

function empty(value: unknown): boolean {
  return value === null || value === undefined || String(value).trim() === "" || value === false;
}

function raw(values: RuleValues, field?: string): unknown {
  if (!field) return undefined;
  if (Object.prototype.hasOwnProperty.call(values, field)) return values[field];
  const normal = field.toLowerCase().replace(/[^a-z0-9]/g, "");
  const key = Object.keys(values).find((candidate) => candidate.toLowerCase().replace(/[^a-z0-9]/g, "") === normal);
  return key ? values[key] : undefined;
}

function number(value: unknown): number {
  return typeof value === "number" ? value : Number(String(value ?? "").replace(/[^0-9.-]+/g, ""));
}

function result(rule: FrontendValidationRule, allowed: boolean): RuleResult {
  return {
    ruleId: rule.id,
    allowed,
    severity: allowed ? "info" : "error",
    message: allowed ? "Validation passed." : rule.message,
    field: allowed ? undefined : rule.field,
  };
}

function evaluateFrontendRule(rule: FrontendValidationRule, values: RuleValues): RuleResult {
  const value = raw(values, rule.field);
  const related = raw(values, rule.relatedField);

  switch (rule.kind) {
    case "required":
    case "reason-required":
      return result(rule, !empty(value));
    case "email":
      return result(rule, empty(value) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)));
    case "phone":
      return result(rule, empty(value) || /^[+()0-9\s-]{7,20}$/.test(String(value)));
    case "number":
      return result(rule, empty(value) || Number.isFinite(number(value)));
    case "positive":
      return result(rule, empty(value) || (Number.isFinite(number(value)) && number(value) > 0));
    case "non-negative":
      return result(rule, empty(value) || (Number.isFinite(number(value)) && number(value) >= 0));
    case "date":
      return result(rule, empty(value) || Number.isFinite(new Date(String(value)).getTime()));
    case "not-future":
      return result(rule, empty(value) || new Date(String(value)).getTime() <= Date.now());
    case "date-order": {
      if (empty(value) || empty(related)) return result(rule, true);
      return result(rule, new Date(String(value)).getTime() >= new Date(String(related)).getTime());
    }
    case "adult": {
      if (empty(value)) return result(rule, true);
      const birth = new Date(String(value));
      if (!Number.isFinite(birth.getTime())) return result(rule, false);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const month = today.getMonth() - birth.getMonth();
      if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) age -= 1;
      return result(rule, age >= 18);
    }
    case "maternity-gender": {
      const context = String(related ?? values.visitType ?? values.admissionType ?? values.treatmentType ?? "").toLowerCase();
      const isMaternity = context.includes("maternity") || context.includes("obstetric") || context.includes("birth");
      return result(rule, !isMaternity || !/^m(?:ale)?$/i.test(String(value ?? "")));
    }
    case "json": {
      if (empty(value) || typeof value !== "string") return result(rule, true);
      try { JSON.parse(value); return result(rule, true); } catch { return result(rule, false); }
    }
    case "less-than-or-equal-field": {
      if (empty(value) || empty(related)) return result(rule, true);
      return result(rule, number(value) <= number(related));
    }
    case "one-of-required":
      return result(rule, !empty(value) || !empty(related));
    case "south-african-id-dob": {
      if (empty(value) || empty(related)) return result(rule, true);
      const id = String(value).replace(/\D/g, "");
      const dob = new Date(String(related));
      if (id.length !== 13 || !Number.isFinite(dob.getTime())) return result(rule, true);
      const expected = `${String(dob.getFullYear()).slice(-2)}${String(dob.getMonth() + 1).padStart(2, "0")}${String(dob.getDate()).padStart(2, "0")}`;
      return result(rule, id.slice(0, 6) === expected);
    }
  }
}

function summarise(results: RuleResult[]): RuleEvaluationSummary {
  const errors = results.filter((candidate) => !candidate.allowed && candidate.severity === "error");
  const warnings = results.filter((candidate) => !candidate.allowed && candidate.severity === "warning");
  const fieldErrors: Record<string, string> = {};
  for (const error of errors) if (error.field && !fieldErrors[error.field]) fieldErrors[error.field] = error.message;
  return { allowed: errors.length === 0, results, errors, warnings, fieldErrors };
}

export function evaluateFrontendValidationRules(
  profile: FrontendValidationProfile,
  values: RuleValues,
  stepIndex?: number,
): RuleEvaluationSummary {
  const applicable = profile.rules.filter((rule) => stepIndex === undefined || rule.stepIndex === undefined || rule.stepIndex === stepIndex);
  return summarise(applicable.map((rule) => evaluateFrontendRule(rule, values)));
}

function mergeSummaries(
  left: RuleEvaluationSummary,
  right: RuleEvaluationSummary,
  frontendRuleCount: number,
  serverRuleCount: number,
): ModuleValidationSummary {
  const results = [...left.results, ...right.results];
  const errors = results.filter((candidate) => !candidate.allowed && candidate.severity === "error");
  const warnings = results.filter((candidate) => !candidate.allowed && candidate.severity === "warning");
  return {
    allowed: errors.length === 0,
    results,
    errors,
    warnings,
    fieldErrors: { ...left.fieldErrors, ...right.fieldErrors },
    frontendRuleCount,
    serverRuleCount,
  };
}

export async function validateModuleInput(input: ModuleValidationInput): Promise<ModuleValidationSummary> {
  const specification = await loadCurrentStateModule(input.moduleKey);
  const profile = specification
    ? buildFrontendValidationProfile(specification, input.action, input.fields)
    : { rules: [], serverRuleCount: 0, sourceRuleCount: 0 };

  const values: RuleValues = {
    ...input.values,
    ...(input.facility ? { facility: input.values.facility ?? input.facility } : {}),
    ...(input.patientId ? { patientId: input.values.patientId ?? input.patientId } : {}),
  };

  const frontend = evaluateFrontendValidationRules(profile, values, input.stepIndex);
  const requiredFields = input.fields.filter((field) => field.required && (input.stepIndex === undefined || field.stepIndex === undefined || field.stepIndex === input.stepIndex)).map((field) => ({ name: field.name, label: field.label }));
  const ruleIds = [
    "common.required-fields",
    ...(input.patientRequired ? ["common.patient-context"] : []),
    ...(input.facility ? ["common.facility-access"] : []),
    ...(input.permission ? ["common.permission"] : []),
    ...(input.additionalRuleIds ?? []),
    ...getModuleRuleIds(input.moduleKey, input.action),
  ];

  const standard = await evaluateRuleIds(ruleIds, {
    moduleKey: input.moduleKey,
    action: input.action,
    values,
    user: input.user ?? null,
    facility: input.facility,
    patientRequired: input.patientRequired,
    requiredFields,
    requiredPermission: input.permission,
    reason: input.reason,
    currentState: input.currentState,
    targetState: input.targetState,
    completedSteps: input.completedSteps,
    mandatorySteps: input.mandatorySteps,
    correlationId: createCorrelationId(),
  });

  return mergeSummaries(frontend, standard, profile.rules.length, profile.serverRuleCount);
}

export function validateFacilityContext(
  facility: string | undefined,
  user: import("@/security/types").AppPrincipal | null,
): RuleResult | null {
  if (!facility) return null;
  if (canAccessFacility(user, facility)) return null;
  return { ruleId: "facility.access", allowed: false, severity: "error", message: `You are not authorised to work in ${facility}.`, field: "facility" };
}
