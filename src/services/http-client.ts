import { appConfig } from "@/configuration/app-config";
import { ApiProblemError, type ApiProblemDetails } from "@/contracts/common/problem-details";
import { authClient } from "@/security/auth-client-factory";
import { createCorrelationId } from "@/services/correlation";

export type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  timeoutMs?: number;
  correlationId?: string;
};

function makeUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${appConfig.apiBaseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const callerSignal = options.signal;
  const abortFromCaller = () => controller.abort(callerSignal?.reason);
  if (callerSignal?.aborted) abortFromCaller();
  else callerSignal?.addEventListener("abort", abortFromCaller, { once: true });
  const timeout = window.setTimeout(() => controller.abort(new DOMException("Request timed out", "TimeoutError")), options.timeoutMs ?? 30_000);
  const token = await authClient.getAccessToken();
  const correlationId = options.correlationId ?? createCorrelationId();
  try {
    const response = await fetch(makeUrl(path), {
      ...options,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Correlation-ID": correlationId,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
    if (!response.ok) {
      let problem: ApiProblemDetails;
      try {
        problem = (await response.json()) as ApiProblemDetails;
      } catch {
        problem = { title: response.statusText || "Request failed", status: response.status, correlationId };
      }
      problem.correlationId ??= response.headers.get("x-correlation-id") ?? correlationId;
      throw new ApiProblemError(problem);
    }
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  } finally {
    window.clearTimeout(timeout);
    callerSignal?.removeEventListener("abort", abortFromCaller);
  }
}
