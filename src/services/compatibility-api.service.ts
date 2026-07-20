import type {
  CompatibilityInvocationContext,
  CompatibilityInvocationResult,
  CompatibilityOperation,
} from "@/compatibility/types";

const apiBaseUrl = (import.meta.env.VITE_IMPILO_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";
const configuredMode = (import.meta.env.VITE_IMPILO_API_MODE as string | undefined)?.toLowerCase();
const useApi = configuredMode === "api" || (configuredMode !== "mock" && Boolean(apiBaseUrl));

function createReference(moduleKey: string): string {
  return `${moduleKey.slice(0, 4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
}

async function parseError(response: Response): Promise<Error> {
  try {
    const body = await response.json() as { title?: string; detail?: string; errors?: Record<string, string[]> };
    const fieldErrors = body.errors ? Object.values(body.errors).flat().join(" ") : "";
    return new Error(body.detail || fieldErrors || body.title || `Request failed with status ${response.status}.`);
  } catch {
    return new Error(`Request failed with status ${response.status}.`);
  }
}

export const compatibilityApi = {
  mode: useApi ? "api" as const : "mock" as const,

  async invoke(
    operation: CompatibilityOperation,
    payload: Record<string, unknown>,
    context: CompatibilityInvocationContext,
    signal?: AbortSignal,
  ): Promise<CompatibilityInvocationResult> {
    if (!useApi) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      return {
        reference: createReference(operation.moduleKey),
        correlationId: context.correlationId,
        status: "completed",
        mode: "mock",
      };
    }

    const endpoint = `/api/compat/${operation.moduleKey}/${operation.action}`;
    const response = await fetch(`${apiBaseUrl}${endpoint}`, {
      method: "POST",
      credentials: "include",
      signal,
      headers: {
        "Content-Type": "application/json",
        "X-Correlation-ID": context.correlationId,
        "X-Impilo-Module": context.moduleKey,
        "X-Impilo-Operation": context.action,
        ...(context.privilege ? { "X-Impilo-Privilege": context.privilege } : {}),
        ...(context.contextType ? { "X-Impilo-Context-Type": context.contextType } : {}),
        ...(context.facilityId ? { "X-Facility-ID": context.facilityId } : {}),
        ...(context.patientId ? { "X-Patient-ID": context.patientId } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw await parseError(response);
    const result = await response.json().catch(() => ({})) as Partial<CompatibilityInvocationResult>;
    return {
      reference: result.reference ?? createReference(operation.moduleKey),
      correlationId: result.correlationId ?? context.correlationId,
      status: result.status ?? "accepted",
      mode: "api",
    };
  },
};
