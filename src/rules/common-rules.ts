import { canAccessFacility } from "@/security/facility-scope";
import { hasPermission } from "@/security/permissions";
import type { RuleDefinition, RuleResult } from "@/rules/types";

function pass(ruleId: string, message: string): RuleResult {
  return { ruleId, allowed: true, severity: "info", message };
}

export const commonRules: RuleDefinition[] = [
  {
    id: "common.required-fields",
    description: "All required fields must contain a value.",
    evaluate(context) {
      const missing = (context.requiredFields ?? []).filter(({ name }) => {
        const value = context.values[name];
        return value === null || value === undefined || String(value).trim() === "";
      });
      if (!missing.length) return pass("common.required-fields", "Required fields are complete.");
      return missing.map(({ name, label }) => ({
        ruleId: "common.required-fields",
        allowed: false,
        severity: "error" as const,
        message: `${label} is required.`,
        field: name,
      }));
    },
  },
  {
    id: "common.patient-context",
    description: "Patient workflows require an explicitly selected patient.",
    evaluate(context) {
      if (!context.patientRequired) return pass("common.patient-context", "Patient context is not required.");
      const selected = Boolean(context.values.patient || context.values.patientId || context.values.name);
      return selected
        ? pass("common.patient-context", "Patient context is selected.")
        : {
            ruleId: "common.patient-context",
            allowed: false,
            severity: "error",
            message: "Select a patient before continuing.",
            field: "patient",
          };
    },
  },
  {
    id: "common.permission",
    description: "The current user must have the required permission.",
    evaluate(context) {
      return hasPermission(context.user, context.requiredPermission)
        ? pass("common.permission", "Permission granted.")
        : {
            ruleId: "common.permission",
            allowed: false,
            severity: "error",
            message: `You do not have permission to perform this action${context.requiredPermission ? ` (${context.requiredPermission})` : ""}.`,
          };
    },
  },
  {
    id: "common.facility-access",
    description: "The user must have access to the selected facility.",
    evaluate(context) {
      const facility = context.facility || String(context.values.facility ?? "");
      if (!facility) {
        return {
          ruleId: "common.facility-access",
          allowed: false,
          severity: "error",
          message: "A facility must be selected.",
          field: "facility",
        };
      }
      return canAccessFacility(context.user, facility)
        ? pass("common.facility-access", "Facility access confirmed.")
        : {
            ruleId: "common.facility-access",
            allowed: false,
            severity: "error",
            message: `You are not authorised to work in ${facility}.`,
            field: "facility",
          };
    },
  },
  {
    id: "common.reason-required",
    description: "A reason is mandatory for controlled and terminal actions.",
    evaluate(context) {
      return context.reason?.trim()
        ? pass("common.reason-required", "Reason supplied.")
        : {
            ruleId: "common.reason-required",
            allowed: false,
            severity: "error",
            message: "Provide a reason before continuing.",
            field: "reason",
          };
    },
  },
  {
    id: "common.all-steps-complete",
    description: "Every mandatory workflow step must be complete.",
    evaluate(context) {
      const completed = new Set(context.completedSteps ?? []);
      const missing = (context.mandatorySteps ?? []).filter((step) => !completed.has(step));
      return missing.length
        ? {
            ruleId: "common.all-steps-complete",
            allowed: false,
            severity: "error",
            message: `Complete the following steps: ${missing.join(", ")}.`,
          }
        : pass("common.all-steps-complete", "All mandatory steps are complete.");
    },
  },
];
