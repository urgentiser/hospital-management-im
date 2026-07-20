import type { CurrentStateModuleSpecification } from "@/current-state/types";
import type { FrontendValidationRule } from "@/validation/types";

export type CompatibilityFieldType = "text" | "number" | "date" | "datetime-local" | "checkbox" | "textarea" | "json";

export type CompatibilityField = {
  path: string;
  name: string;
  label: string;
  contractType: string;
  inputType: CompatibilityFieldType;
  required: boolean;
  placeholder?: string;
  stepIndex: number;
};

export type CompatibilityParameter = {
  name: string;
  contractType: string;
  collection: boolean;
  primitive: boolean;
};

export type ContractConfidence = "confirmed" | "probable" | "unmapped";

export type CompatibilityOperation = {
  id: string;
  moduleKey: string;
  moduleName: string;
  action: string;
  privilege: string | null;
  contextType: string | null;
  navigationType: string | null;
  workflowType: string | null;
  sourcePath: string | null;
  steps: string[];
  serviceInterface: string | null;
  method: string | null;
  parameters: CompatibilityParameter[];
  fields: CompatibilityField[];
  frontendValidationRules: FrontendValidationRule[];
  serverValidationRuleCount: number;
};

export type CompatibilityInvocationContext = {
  moduleKey: string;
  action: string;
  privilege?: string | null;
  contextType?: string | null;
  facilityId?: string | null;
  patientId?: string | null;
  userId?: string | null;
  correlationId: string;
};

export type CompatibilityInvocationResult = {
  reference: string;
  correlationId: string;
  status: "accepted" | "completed";
  mode: "api" | "mock";
};

export type CompatibilityModule = {
  specification: CurrentStateModuleSpecification;
  operations: CompatibilityOperation[];
};
