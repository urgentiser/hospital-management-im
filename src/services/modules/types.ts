import type { CommandResult } from "@/contracts/common/command-result";
import type { CompatibilityInvocationContext, CompatibilityInvocationResult, CompatibilityOperation } from "@/compatibility/types";
import type { ModuleKey, WorkflowItem } from "@/lib/workflow-store";

export type CreateRecordInput = Omit<WorkflowItem, "id" | "history" | "createdAt" | "updatedAt">;

export type ModuleService = {
  moduleKey: string;
  basePath: string;
  workflowKey?: ModuleKey;
  listRecords(query?: Record<string, string | number | boolean | undefined>, signal?: AbortSignal): Promise<WorkflowItem[]>;
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
