import "@/rules/register-defaults";
import { getRule } from "@/rules/registry";
import type { RuleContext, RuleEvaluationSummary, RuleResult } from "@/rules/types";

function flatten(value: RuleResult | RuleResult[]): RuleResult[] {
  return Array.isArray(value) ? value : [value];
}

export async function evaluateRuleIds(ruleIds: string[], context: RuleContext): Promise<RuleEvaluationSummary> {
  const results: RuleResult[] = [];
  for (const ruleId of [...new Set(ruleIds)]) {
    const rule = getRule(ruleId);
    if (!rule) {
      results.push({
        ruleId,
        allowed: false,
        severity: "error",
        message: `Business rule '${ruleId}' is not registered.`,
      });
      continue;
    }
    try {
      results.push(...flatten(await rule.evaluate(context)));
    } catch (cause) {
      results.push({
        ruleId,
        allowed: false,
        severity: "error",
        message: cause instanceof Error ? cause.message : `Rule '${ruleId}' failed unexpectedly.`,
      });
    }
  }
  const errors = results.filter((result) => !result.allowed && result.severity === "error");
  const warnings = results.filter((result) => !result.allowed && result.severity === "warning");
  const fieldErrors = Object.fromEntries(
    errors.filter((result) => result.field).map((result) => [result.field!, result.message]),
  );
  return { allowed: errors.length === 0, results, errors, warnings, fieldErrors };
}
