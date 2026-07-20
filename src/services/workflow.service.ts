import { appConfig } from "@/configuration/app-config";
import type { CommandResult } from "@/contracts/common/command-result";
import { useWorkflow, type ModuleKey, type WorkflowItem } from "@/lib/workflow-store";
import { apiRequest } from "@/services/http-client";
import { createCorrelationId } from "@/services/correlation";

export type CreateWorkflowInput = Omit<WorkflowItem, "id" | "history" | "createdAt" | "updatedAt">;

export const workflowService = {
  async create(moduleKey: ModuleKey, input: CreateWorkflowInput): Promise<CommandResult<WorkflowItem>> {
    if (appConfig.dataMode === "api") {
      return apiRequest<CommandResult<WorkflowItem>>(`workflows/${moduleKey}`, { method: "POST", body: input });
    }
    const record = useWorkflow.getState().create(moduleKey, input);
    return { data: record, correlationId: createCorrelationId(), emittedEvents: [] };
  },
  async transition(moduleKey: ModuleKey, itemId: string, targetState: string, reason?: string): Promise<CommandResult<WorkflowItem>> {
    if (appConfig.dataMode === "api") {
      return apiRequest<CommandResult<WorkflowItem>>(`workflows/${moduleKey}/${encodeURIComponent(itemId)}/transition`, {
        method: "POST",
        body: { targetState, reason },
      });
    }
    useWorkflow.getState().advance(moduleKey, itemId, targetState, reason);
    const record = useWorkflow.getState().items[moduleKey].find((item) => item.id === itemId);
    if (!record) throw new Error("The workflow record could not be reloaded after transition.");
    return { data: record, correlationId: createCorrelationId(), emittedEvents: [] };
  },
  async addNote(moduleKey: ModuleKey, itemId: string, note: string): Promise<CommandResult<WorkflowItem>> {
    if (appConfig.dataMode === "api") {
      return apiRequest<CommandResult<WorkflowItem>>(`workflows/${moduleKey}/${encodeURIComponent(itemId)}/notes`, {
        method: "POST",
        body: { note },
      });
    }
    useWorkflow.getState().addNote(moduleKey, itemId, note);
    const record = useWorkflow.getState().items[moduleKey].find((item) => item.id === itemId);
    if (!record) throw new Error("The workflow record could not be reloaded after adding the note.");
    return { data: record, correlationId: createCorrelationId() };
  },
};
