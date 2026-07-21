import { appConfig } from "@/configuration/app-config";
import type { CommandResult } from "@/contracts/common/command-result";
import type { PagedQuery, PagedResult } from "@/contracts/common/paged-result";
import { useWorkflow, type WorkflowItem } from "@/lib/workflow-store";
import { apiRequest } from "@/services/http-client";
import { pageMock } from "@/services/modules/mock-pager";
import type { ModuleService, ModuleServiceConfig, CreateRecordInput } from "@/services/modules/types";
import type { CompatibilityInvocationContext, CompatibilityInvocationResult, CompatibilityOperation } from "@/compatibility/types";
import { createCorrelationId } from "@/services/correlation";

function slug(value: string): string {
  return value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function reference(moduleKey: string): string {
  return `${moduleKey.replace(/[^a-z0-9]/gi, "").slice(0, 5).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
}

function headers(context: CompatibilityInvocationContext): Record<string, string> {
  return {
    "X-Impilo-Module": context.moduleKey,
    "X-Impilo-Operation": context.action,
    ...(context.privilege ? { "X-Impilo-Privilege": context.privilege } : {}),
    ...(context.contextType ? { "X-Impilo-Context-Type": context.contextType } : {}),
    ...(context.facilityId ? { "X-Facility-ID": context.facilityId } : {}),
    ...(context.patientId ? { "X-Patient-ID": context.patientId } : {}),
  };
}

export function createModuleService(config: ModuleServiceConfig): ModuleService {
  const workflowKey = config.workflowKey;

  async function listRecords(query: PagedQuery, signal?: AbortSignal): Promise<PagedResult<WorkflowItem>> {
    if (appConfig.dataMode === "api") {
      const search = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== "" && value !== null) search.set(key, String(value));
      }
      const suffix = search.size ? `?${search.toString()}` : "";
      return apiRequest<PagedResult<WorkflowItem>>(`${config.basePath}${suffix}`, { method: "GET", signal });
    }
    const source = workflowKey ? (useWorkflow.getState().items[workflowKey] ?? []) : [];
    return pageMock(source, query);
  }

  async function getRecord(itemId: string, signal?: AbortSignal): Promise<WorkflowItem | null> {
    if (appConfig.dataMode === "api") {
      return apiRequest<WorkflowItem>(`${config.basePath}/${encodeURIComponent(itemId)}`, { method: "GET", signal });
    }
    if (!workflowKey) return null;
    return useWorkflow.getState().items[workflowKey]?.find((item) => item.id === itemId) ?? null;
  }

  async function executeProcess(
    operation: CompatibilityOperation,
    payload: Record<string, unknown>,
    context: CompatibilityInvocationContext,
    signal?: AbortSignal,
  ): Promise<CompatibilityInvocationResult> {
    if (appConfig.dataMode === "mock") {
      await new Promise((resolve) => window.setTimeout(resolve, 250));
      return { reference: reference(config.moduleKey), correlationId: context.correlationId, status: "completed", mode: "mock" };
    }
    const result = await apiRequest<Partial<CompatibilityInvocationResult>>(
      `${config.basePath}/${slug(operation.action)}`,
      { method: "POST", body: payload, correlationId: context.correlationId, signal, headers: headers(context) },
    );
    return {
      reference: result.reference ?? reference(config.moduleKey),
      correlationId: result.correlationId ?? context.correlationId,
      status: result.status ?? "accepted",
      mode: "api",
    };
  }

  async function createRecord(input: CreateRecordInput): Promise<CommandResult<WorkflowItem>> {
    if (appConfig.dataMode === "api") {
      return apiRequest<CommandResult<WorkflowItem>>(config.basePath, { method: "POST", body: input });
    }
    if (!workflowKey) throw new Error(`Mock record creation is not configured for ${config.moduleKey}.`);
    const record = useWorkflow.getState().create(workflowKey, input);
    return { data: record, correlationId: createCorrelationId(), emittedEvents: [] };
  }

  async function transitionRecord(itemId: string, targetState: string, reason?: string): Promise<CommandResult<WorkflowItem>> {
    if (appConfig.dataMode === "api") {
      return apiRequest<CommandResult<WorkflowItem>>(`${config.basePath}/${encodeURIComponent(itemId)}/${slug(targetState)}`, {
        method: "POST",
        body: { reason },
      });
    }
    if (!workflowKey) throw new Error(`Mock state changes are not configured for ${config.moduleKey}.`);
    useWorkflow.getState().advance(workflowKey, itemId, targetState, reason);
    const record = useWorkflow.getState().items[workflowKey].find((item) => item.id === itemId);
    if (!record) throw new Error("The record could not be reloaded after the state change.");
    return { data: record, correlationId: createCorrelationId(), emittedEvents: [] };
  }

  async function addNote(itemId: string, note: string): Promise<CommandResult<WorkflowItem>> {
    if (appConfig.dataMode === "api") {
      return apiRequest<CommandResult<WorkflowItem>>(`${config.basePath}/${encodeURIComponent(itemId)}/notes`, { method: "POST", body: { note } });
    }
    if (!workflowKey) throw new Error(`Mock notes are not configured for ${config.moduleKey}.`);
    useWorkflow.getState().addNote(workflowKey, itemId, note);
    const record = useWorkflow.getState().items[workflowKey].find((item) => item.id === itemId);
    if (!record) throw new Error("The record could not be reloaded after adding the note.");
    return { data: record, correlationId: createCorrelationId() };
  }

  return { ...config, listRecords, getRecord, executeProcess, createRecord, transitionRecord, addNote };
}
