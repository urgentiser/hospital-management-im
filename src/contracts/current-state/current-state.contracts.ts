import type { CurrentStateCounts, CurrentStateModuleSpecification, CurrentStateModuleSummary, CurrentStateRecord } from "@/current-state/types";

export type LegacyModelDefinition = CurrentStateRecord & { type_name?: string | null; namespace?: string | null; kind?: string | null; };
export type LegacyPropertyDefinition = CurrentStateRecord & { type_name?: string | null; property_name?: string | null; property_type?: string | null; };
export type LegacyServiceMethodDefinition = CurrentStateRecord & { service_interface?: string | null; method?: string | null; parameters?: string | null; };
export type LegacyTableDefinition = CurrentStateRecord & { schema?: string | null; table?: string | null; columns?: string | null; column_count?: string | number | null; };
export type LegacyEventDefinition = CurrentStateRecord & { namespace?: string | null; type_name?: string | null; base_types?: string | null; };
export type LegacyRuleDefinition = CurrentStateRecord & { rule_code?: string | null; description?: string | null; category?: string | null; source_path?: string | null; };
export type LegacyValidationEvidence = CurrentStateRecord & { method?: string | null; conditions?: string | null; failure_pattern?: string | null; };
export type LegacyWorkflowDefinition = CurrentStateRecord & { action?: string | null; privilege?: string | null; reconstructed_steps?: string | null; };

export type CurrentStateSpecificationResponse = { module: CurrentStateModuleSpecification; extractedAt: string; version: string; };
export type CurrentStatePortfolioResponse = { modules: CurrentStateModuleSummary[]; totals: CurrentStateCounts; };
