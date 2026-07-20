import type { RuleDefinition } from "@/rules/types";

function truthy(value: unknown): boolean {
  return value === true || value === "true" || value === "yes" || value === "Y";
}

export const clinicalOperationsRules: RuleDefinition[] = [
  {
    id: "pharmacy.allergy-review-complete",
    description: "Allergy and interaction review is required before dispensing.",
    evaluate(context) {
      return truthy(context.values.allergyReviewComplete)
        ? { ruleId: "pharmacy.allergy-review-complete", allowed: true, severity: "info", message: "Allergy review completed." }
        : { ruleId: "pharmacy.allergy-review-complete", allowed: false, severity: "error", message: "Complete the allergy and interaction review before dispensing.", field: "allergyReviewComplete" };
    },
  },
  {
    id: "theatre.completed-record-locked",
    description: "A completed theatre procedure requires a controlled correction workflow.",
    evaluate(context) {
      const state = String(context.currentState ?? context.values.status ?? "").toLowerCase();
      const correction = context.action.includes("correct") || context.action.includes("reopen");
      return state !== "completed" || correction
        ? { ruleId: "theatre.completed-record-locked", allowed: true, severity: "info", message: "Theatre record may be changed through the selected workflow." }
        : { ruleId: "theatre.completed-record-locked", allowed: false, severity: "error", message: "Completed theatre procedures cannot be edited directly. Start a controlled correction workflow." };
    },
  },
  {
    id: "ward.destination-bed-available",
    description: "The destination bed must be confirmed available before moving a patient.",
    evaluate(context) {
      const destination = context.values.destinationBed ?? context.values.bed;
      if (!destination) return { ruleId: "ward.destination-bed-available", allowed: true, severity: "info", message: "No bed move is requested." };
      return truthy(context.values.bedAvailable)
        ? { ruleId: "ward.destination-bed-available", allowed: true, severity: "info", message: "Destination bed availability confirmed." }
        : { ruleId: "ward.destination-bed-available", allowed: false, severity: "error", message: "Confirm that the destination bed is available.", field: "destinationBed" };
    },
  },
  {
    id: "case.billing-checks-passed",
    description: "All blocking billing checks must pass before case finalisation.",
    evaluate(context) {
      const blocking = Number(context.values.blockingBillingIssues ?? 0);
      return blocking === 0
        ? { ruleId: "case.billing-checks-passed", allowed: true, severity: "info", message: "No blocking billing issues remain." }
        : { ruleId: "case.billing-checks-passed", allowed: false, severity: "error", message: `${blocking} blocking billing issue${blocking === 1 ? " remains" : "s remain"}.` };
    },
  },
];
