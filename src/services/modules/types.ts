import type { CommandResult } from "@/contracts/common/command-result";
import type { PagedQuery, PagedResult } from "@/contracts/common/paged-result";
import type { CompatibilityInvocationContext, CompatibilityInvocationResult, CompatibilityOperation } from "@/compatibility/types";
import type { ModuleKey, WorkflowItem } from "@/lib/workflow-store";

export type CreateRecordInput = Omit<WorkflowItem, "id" | "history" | "createdAt" | "updatedAt">;

export type ModuleService = {
  moduleKey: string;
  basePath: string;
  workflowKey?: ModuleKey;
  /**
   * Returns a page of records. In API mode the backend performs paging,
   * sorting, filtering, facility scope and permission scope authoritatively
   * and the client must not re-slice. In mock mode a local pager provides
   * equivalent behaviour.
   */
  listRecords(query: PagedQuery, signal?: AbortSignal): Promise<PagedResult<WorkflowItem>>;
  getRecord(itemId: string, signal?: AbortSignal): Promise<WorkflowItem | null>;
  executeProcess(
    operation: CompatibilityOperation,
    payload: Record<string, unknown>,
    context: CompatibilityInvocationContext,
    signal?: AbortSignal,
  ): Promise<CompatibilityInvocationResult>;
  createRecord(input: CreateRecordInput): Promise<CommandResult<WorkflowItem>>;
  transitionRecord(itemId: string, targetState: string, reason?: string): Promise<CommandResult<WorkflowItem>>;
  addNote(itemId: string, note: string): Promise<CommandResult<WorkflowItem>>;
};

export type ModuleServiceConfig = {
  moduleKey: string;
  basePath: string;
  workflowKey?: ModuleKey;
};
