import type { RuleDefinition } from "@/rules/types";

export const integrationRules: RuleDefinition[] = [
  {
    id: "integration.replay-eligible",
    description: "Only failed or dead-lettered messages may be replayed.",
    evaluate(context) {
      const status = String(context.currentState ?? context.values.status ?? "").toLowerCase();
      const eligible = ["failed", "deadletter", "dead-lettered", "dead letter"].includes(status);
      return eligible
        ? { ruleId: "integration.replay-eligible", allowed: true, severity: "info", message: "Message is eligible for replay." }
        : {
            ruleId: "integration.replay-eligible",
            allowed: false,
            severity: "error",
            message: "Only failed or dead-lettered messages can be replayed.",
          };
    },
  },
  {
    id: "integration.retry-limit",
    description: "Messages exceeding the configured delivery count require escalation.",
    evaluate(context) {
      const attempts = Number(context.values.deliveryCount ?? context.values.attempts ?? 0);
      return attempts < 10
        ? { ruleId: "integration.retry-limit", allowed: true, severity: "info", message: "Retry count is within policy." }
        : {
            ruleId: "integration.retry-limit",
            allowed: false,
            severity: "error",
            message: "Retry limit reached. Escalate the message instead of replaying it.",
          };
    },
  },
];
