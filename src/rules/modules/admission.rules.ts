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
  },
];
