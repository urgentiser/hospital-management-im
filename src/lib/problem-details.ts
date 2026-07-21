import { useCallback, useState } from "react";
import type { UseFormSetError, FieldValues, Path } from "react-hook-form";
import { toast } from "sonner";
import { ApiProblemError, type ApiProblemDetails } from "@/contracts/common/problem-details";

export type FieldErrors = Record<string, string[]>;

export type NormalisedProblem = {
  title: string;
  detail?: string;
  status: number;
  correlationId?: string;
  fieldErrors: FieldErrors;
};

/** Normalise any thrown value into a Problem Details shape the UI can render. */
export function toProblemDetails(err: unknown): NormalisedProblem {
  if (err instanceof ApiProblemError) return fromProblem(err.problem);
  if (err instanceof Error) return { title: err.name || "Error", detail: err.message, status: 0, fieldErrors: {} };
  return { title: "Unexpected error", detail: String(err), status: 0, fieldErrors: {} };
}

function fromProblem(p: ApiProblemDetails): NormalisedProblem {
  return {
    title: p.title,
    detail: p.detail,
    status: p.status,
    correlationId: p.correlationId,
    fieldErrors: p.errors ?? {},
  };
}

/** Map RFC 7807 `errors` map onto react-hook-form field errors. Returns unmapped ones. */
export function applyFieldErrors<T extends FieldValues>(
  fieldErrors: FieldErrors,
  setError: UseFormSetError<T>,
): FieldErrors {
  const unmapped: FieldErrors = {};
  for (const [rawKey, messages] of Object.entries(fieldErrors)) {
    if (!messages?.length) continue;
    const key = rawKey.replace(/^\$\./, "").replace(/\[(\d+)\]/g, ".$1");
    try {
      setError(key as Path<T>, { type: "server", message: messages.join(" ") });
    } catch {
      unmapped[rawKey] = messages;
    }
  }
  return unmapped;
}

/**
 * Handle a mutation error: map field errors into the form, toast the rest,
 * and expose the normalised problem for inline banners.
 */
export function useProblemHandler<T extends FieldValues>(setError?: UseFormSetError<T>) {
  const [problem, setProblem] = useState<NormalisedProblem | null>(null);

  const handle = useCallback(
    (err: unknown) => {
      const normalised = toProblemDetails(err);
      setProblem(normalised);
      const unmapped = setError ? applyFieldErrors(normalised.fieldErrors, setError) : normalised.fieldErrors;
      const banner = normalised.detail || normalised.title;
      const cid = normalised.correlationId ? ` · ref ${normalised.correlationId}` : "";
      if (Object.keys(unmapped).length && !setError) {
        toast.error(`${banner}${cid}`, {
          description: Object.values(unmapped).flat().join(" "),
        });
      } else if (!setError || Object.keys(normalised.fieldErrors).length === 0) {
        toast.error(`${banner}${cid}`);
      }
      return normalised;
    },
    [setError],
  );

  const reset = useCallback(() => setProblem(null), []);
  return { problem, handle, reset };
}
