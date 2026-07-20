import type { RuleDefinition } from "@/rules/types";

export const patientRules: RuleDefinition[] = [
  {
    id: "patient.duplicate-search-completed",
    description: "A duplicate search must run before a new patient can be created.",
    evaluate(context) {
      return context.values.duplicateSearchCompleted === true || context.values.duplicateSearchCompleted === "true"
        ? { ruleId: "patient.duplicate-search-completed", allowed: true, severity: "info", message: "Duplicate search completed." }
        : {
            ruleId: "patient.duplicate-search-completed",
            allowed: false,
            severity: "error",
            message: "Run and review the duplicate patient search before creating the patient.",
          };
    },
  },
];
