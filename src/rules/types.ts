import type { AppPrincipal, Permission } from "@/security/types";

export type RuleSeverity = "info" | "warning" | "error";
export type RuleValues = Record<string, string | number | boolean | null | undefined>;

export type RuleContext = {
  moduleKey: string;
  action: string;
  values: RuleValues;
  user: AppPrincipal | null;
  facility?: string;
  patientRequired?: boolean;
  requiredFields?: Array<{ name: string; label: string }>;
  requiredPermission?: Permission;
  currentState?: string;
  targetState?: string;
  reason?: string;
  completedSteps?: string[];
  mandatorySteps?: string[];
  correlationId: string;
};

export type RuleResult = {
  ruleId: string;
  allowed: boolean;
  severity: RuleSeverity;
  message: string;
  field?: string;
  confirmationRequired?: boolean;
  metadata?: Record<string, unknown>;
};

export type RuleDefinition = {
  id: string;
  description: string;
  evaluate: (context: RuleContext) => RuleResult | RuleResult[] | Promise<RuleResult | RuleResult[]>;
};

export type RuleEvaluationSummary = {
  allowed: boolean;
  results: RuleResult[];
  errors: RuleResult[];
  warnings: RuleResult[];
  fieldErrors: Record<string, string>;
};
