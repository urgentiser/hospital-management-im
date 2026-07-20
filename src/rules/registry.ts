import type { RuleDefinition } from "@/rules/types";

const registry = new Map<string, RuleDefinition>();

export function registerRule(rule: RuleDefinition): void {
  if (registry.has(rule.id)) throw new Error(`Business rule '${rule.id}' is already registered.`);
  registry.set(rule.id, rule);
}

export function registerRules(rules: RuleDefinition[]): void {
  rules.forEach(registerRule);
}

export function getRule(ruleId: string): RuleDefinition | undefined {
  return registry.get(ruleId);
}

export function getRegisteredRuleIds(): string[] {
  return [...registry.keys()].sort();
}
