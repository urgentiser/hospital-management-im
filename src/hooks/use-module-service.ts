import { useMutation, useQuery, useQueryClient, type UseMutationOptions, type UseQueryOptions } from "@tanstack/react-query";
import { getModuleService } from "@/services/modules/registry";
import type { CreateRecordInput } from "@/services/modules/types";
import type { WorkflowItem } from "@/lib/workflow-store";
import type { CompatibilityInvocationContext, CompatibilityInvocationResult, CompatibilityOperation } from "@/compatibility/types";
import type { CommandResult } from "@/contracts/common/command-result";

/**
 * Query key factory — stable, per-module, per-query.
 * Callers pass moduleKey + optional filters; queries share a root
 * so mutations can invalidate all lists/details for that module.
 */
export const moduleQueryKeys = {
  all: (moduleKey: string) => ["module", moduleKey] as const,
  list: (moduleKey: string, query?: Record<string, unknown>) =>
    ["module", moduleKey, "list", query ?? {}] as const,
  detail: (moduleKey: string, itemId: string) =>
    ["module", moduleKey, "detail", itemId] as const,
};

export function useModuleList(
  moduleKey: string,
  query: Record<string, string | number | boolean | undefined> = {},
  options?: Omit<UseQueryOptions<WorkflowItem[]>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: moduleQueryKeys.list(moduleKey, query),
    queryFn: ({ signal }) => getModuleService(moduleKey).listRecords(query, signal),
    staleTime: 15_000,
    ...options,
  });
}

export function useModuleRecord(
  moduleKey: string,
  itemId: string | undefined,
  options?: Omit<UseQueryOptions<WorkflowItem | null>, "queryKey" | "queryFn" | "enabled">,
) {
  return useQuery({
    queryKey: moduleQueryKeys.detail(moduleKey, itemId ?? ""),
    queryFn: ({ signal }) => getModuleService(moduleKey).getRecord(itemId!, signal),
    enabled: Boolean(itemId),
    staleTime: 15_000,
    ...options,
  });
}

export function useCreateModuleRecord(
  moduleKey: string,
  options?: UseMutationOptions<CommandResult<WorkflowItem>, Error, CreateRecordInput>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input) => getModuleService(moduleKey).createRecord(input),
    onSuccess: (data, vars, ctx) => {
      qc.invalidateQueries({ queryKey: moduleQueryKeys.all(moduleKey) });
      options?.onSuccess?.(data, vars, ctx);
    },
    ...options,
  });
}

export function useTransitionModuleRecord(
  moduleKey: string,
  options?: UseMutationOptions<CommandResult<WorkflowItem>, Error, { itemId: string; targetState: string; reason?: string }>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, targetState, reason }) =>
      getModuleService(moduleKey).transitionRecord(itemId, targetState, reason),
    onSuccess: (data, vars, ctx) => {
      qc.invalidateQueries({ queryKey: moduleQueryKeys.all(moduleKey) });
      options?.onSuccess?.(data, vars, ctx);
    },
    ...options,
  });
}

export function useExecuteModuleProcess(
  moduleKey: string,
  options?: UseMutationOptions<
    CompatibilityInvocationResult,
    Error,
    { operation: CompatibilityOperation; payload: Record<string, unknown>; context: CompatibilityInvocationContext }
  >,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ operation, payload, context }) =>
      getModuleService(moduleKey).executeProcess(operation, payload, context),
    onSuccess: (data, vars, ctx) => {
      qc.invalidateQueries({ queryKey: moduleQueryKeys.all(moduleKey) });
      options?.onSuccess?.(data, vars, ctx);
    },
    ...options,
  });
}

export function useAddModuleNote(
  moduleKey: string,
  options?: UseMutationOptions<CommandResult<WorkflowItem>, Error, { itemId: string; note: string }>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, note }) => getModuleService(moduleKey).addNote(itemId, note),
    onSuccess: (data, vars, ctx) => {
      qc.invalidateQueries({ queryKey: moduleQueryKeys.detail(moduleKey, vars.itemId) });
      qc.invalidateQueries({ queryKey: moduleQueryKeys.list(moduleKey) });
      options?.onSuccess?.(data, vars, ctx);
    },
    ...options,
  });
}
