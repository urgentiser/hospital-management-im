import type { RuleDefinition } from "@/rules/types";

function number(value: unknown): number {
  if (typeof value === "number") return value;
  return Number(String(value ?? "").replace(/[^0-9.-]+/g, ""));
}

export const revenueRules: RuleDefinition[] = [
  {
    id: "billing.coding-signed",
    description: "Clinical coding must be signed before bill finalisation.",
    evaluate(context) {
      const signed = context.values.codingSigned === true || context.values.codingSigned === "true";
      return signed
        ? { ruleId: "billing.coding-signed", allowed: true, severity: "info", message: "Clinical coding is signed." }
        : { ruleId: "billing.coding-signed", allowed: false, severity: "error", message: "Clinical coding must be signed before finalising the bill." };
    },
  },
  {
    id: "billing.amount-non-negative",
    description: "Normal billing charges cannot be negative.",
    evaluate(context) {
      const amount = number(context.values.amount ?? context.values.Amount);
      const adjustment = context.action.includes("refund") || context.action.includes("reversal") || context.action.includes("credit");
      return Number.isNaN(amount) || amount >= 0 || adjustment
        ? { ruleId: "billing.amount-non-negative", allowed: true, severity: "info", message: "Billing amount is valid." }
        : { ruleId: "billing.amount-non-negative", allowed: false, severity: "error", message: "A negative amount requires an authorised refund, reversal or credit workflow.", field: "amount" };
    },
  },
  {
    id: "accounting.refund-within-payment",
    description: "A refund cannot exceed the unrefunded original payment.",
    evaluate(context) {
      const refund = number(context.values.refundAmount);
      const available = number(context.values.availableRefundAmount ?? context.values.originalPaymentAmount);
      return !refund || !available || refund <= available
        ? { ruleId: "accounting.refund-within-payment", allowed: true, severity: "info", message: "Refund amount is within the available payment." }
        : { ruleId: "accounting.refund-within-payment", allowed: false, severity: "error", message: "The refund exceeds the available original payment.", field: "refundAmount" };
    },
  },
];
