import type { RuleDefinition } from "@/rules/types";

function parseDate(value: unknown): number | null {
  if (!value) return null;
  const time = Date.parse(String(value));
  return Number.isNaN(time) ? null : time;
}

export const admissionRules: RuleDefinition[] = [
  {
    id: "admission.discharge-after-admission",
    description: "Discharge date and time cannot be earlier than admission.",
    evaluate(context) {
      const admittedAt = parseDate(context.values.admissionDate ?? context.values.admittedAt);
      const dischargedAt = parseDate(context.values.dischargeDate ?? context.values.dischargedAt);
      if (!admittedAt || !dischargedAt || dischargedAt >= admittedAt) {
        return { ruleId: "admission.discharge-after-admission", allowed: true, severity: "info", message: "Admission chronology is valid." };
      }
      return {
        ruleId: "admission.discharge-after-admission",
        allowed: false,
        severity: "error",
        message: "Discharge date and time cannot be before admission.",
        field: "dischargeDate",
      };
    },
  },
  {
    id: "admission.bed-available",
    description: "The selected bed must be available before allocation or transfer.",
    evaluate(context) {
      if (!context.values.bed && !context.values.destinationBed) {
        return { ruleId: "admission.bed-available", allowed: true, severity: "info", message: "No bed allocation is requested." };
      }
      const available = context.values.bedAvailable;
      return available === true || available === "true"
        ? { ruleId: "admission.bed-available", allowed: true, severity: "info", message: "Bed availability confirmed." }
        : {
            ruleId: "admission.bed-available",
            allowed: false,
            severity: "error",
            message: "The selected bed is not confirmed as available.",
            field: context.values.destinationBed ? "destinationBed" : "bed",
          };
    },
  {
    id: "admission.duplicate-active",
    description: "A patient cannot have two overlapping active admissions unless explicitly authorised.",
    evaluate(context) {
      const override = context.values.duplicateOverrideApproved;
      const hasActive = context.values.patientHasActiveAdmission;
      if (!hasActive || override === true || override === "true") {
        return { ruleId: "admission.duplicate-active", allowed: true, severity: "info", message: "No conflicting active admission." };
      }
      return {
        ruleId: "admission.duplicate-active",
        allowed: false,
        severity: "error",
        message: "This patient already has an active admission. Capture management approval to proceed.",
        field: "patient",
        confirmationRequired: true,
      };
    },
  },
  {
    id: "admission.no-auth-followup",
    description: "No-authorisation admissions must record a follow-up owner and target date.",
    evaluate(context) {
      const noAuth = context.values.noAuth === true || context.values.noAuth === "true";
      if (!noAuth) {
        return { ruleId: "admission.no-auth-followup", allowed: true, severity: "info", message: "Authorisation captured." };
      }
      const hasOwner = Boolean(context.values.followUpOwner);
      const hasDate = Boolean(context.values.followUpDate);
      if (hasOwner && hasDate) {
        return { ruleId: "admission.no-auth-followup", allowed: true, severity: "info", message: "No-auth follow-up scheduled." };
      }
      return {
        ruleId: "admission.no-auth-followup",
        allowed: false,
        severity: "error",
        message: "Capture a follow-up owner and target date for this no-authorisation admission.",
        field: !hasOwner ? "followUpOwner" : "followUpDate",
      };
    },
  },
  {
    id: "admission.elevated-exceptions",
    description: "Cancel, discontinue and undischarge require an explicit reason and elevated approval.",
    evaluate(context) {
      const exception = String(context.values.exception ?? context.action ?? "").toLowerCase();
      const isException = ["cancel admission", "discontinue admission", "undischarge (eu)", "cancel", "discontinue", "undischarge"].some(
        (kind) => exception.includes(kind),
      );
      if (!isException) {
        return { ruleId: "admission.elevated-exceptions", allowed: true, severity: "info", message: "No exception action." };
      }
      const hasReason = Boolean((context.reason ?? context.values.exceptionReason ?? context.values.reason)?.toString().trim());
      if (!hasReason) {
        return {
          ruleId: "admission.elevated-exceptions",
          allowed: false,
          severity: "error",
          message: "This action requires a reason and elevated approval.",
          field: "exceptionReason",
          confirmationRequired: true,
        };
      }
      return {
        ruleId: "admission.elevated-exceptions",
        allowed: true,
        severity: "warning",
        message: "Elevated action recorded — confirm approver identity before submission.",
        confirmationRequired: true,
      };
    },
  },
  {
    id: "admission.discharge-checks-cleared",
    description: "Discharge requires all blocking billing / clinical checks to be resolved or overridden with reason.",
    evaluate(context) {
      const isDischarge = String(context.action ?? "").toLowerCase().includes("discharge");
      if (!isDischarge) {
        return { ruleId: "admission.discharge-checks-cleared", allowed: true, severity: "info", message: "Not a discharge action." };
      }
      const blocking = Number(context.values.blockingChecksCount ?? 0);
      const overrideReason = String(context.values.overrideReason ?? "").trim();
      if (blocking > 0 && !overrideReason) {
        return {
          ruleId: "admission.discharge-checks-cleared",
          allowed: false,
          severity: "error",
          message: `${blocking} blocking check${blocking === 1 ? "" : "s"} must be resolved or overridden with a reason.`,
          field: "overrideReason",
          confirmationRequired: true,
        };
      }
      return { ruleId: "admission.discharge-checks-cleared", allowed: true, severity: "info", message: "Discharge checks are clear." };
    },
  },
];
