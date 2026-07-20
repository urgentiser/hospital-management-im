import type { RuleEvaluationSummary } from "@/rules/types";

export type ValidationFieldType =
  | "text"
  | "number"
  | "date"
  | "datetime-local"
  | "checkbox"
  | "textarea"
  | "json"
  | "select";

export type ValidationFieldDescriptor = {
  name: string;
  label: string;
  type?: ValidationFieldType;
  required?: boolean;
  stepIndex?: number;
};

export type FrontendValidationRuleKind =
  | "required"
  | "email"
  | "phone"
  | "number"
  | "positive"
  | "non-negative"
  | "date"
  | "not-future"
  | "date-order"
  | "adult"
  | "maternity-gender"
  | "reason-required"
  | "json"
  | "less-than-or-equal-field"
  | "one-of-required"
  | "south-african-id-dob";

export type FrontendValidationRule = {
  id: string;
  kind: FrontendValidationRuleKind;
  message: string;
  field?: string;
  relatedField?: string;
  stepIndex?: number;
  sourceRuleCode?: string;
};

export type FrontendValidationProfile = {
  rules: FrontendValidationRule[];
  serverRuleCount: number;
  sourceRuleCount: number;
};

export type ModuleValidationInput = {
  moduleKey: string;
  action: string;
  fields: ValidationFieldDescriptor[];
  values: Record<string, string | number | boolean | null | undefined>;
  user?: import("@/security/types").AppPrincipal | null;
  facility?: string;
  patientId?: string | null;
  permission?: import("@/security/types").Permission;
  reason?: string;
  currentState?: string;
  targetState?: string;
  patientRequired?: boolean;
  completedSteps?: string[];
  mandatorySteps?: string[];
  additionalRuleIds?: string[];
  stepIndex?: number;
};

export type ModuleValidationSummary = RuleEvaluationSummary & {
  frontendRuleCount: number;
  serverRuleCount: number;
};
