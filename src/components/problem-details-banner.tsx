import { AlertTriangle, X } from "lucide-react";
import type { NormalisedProblem } from "@/lib/problem-details";

type Props = {
  problem: NormalisedProblem | null;
  onDismiss?: () => void;
};

export function ProblemDetailsBanner({ problem, onDismiss }: Props) {
  if (!problem) return null;
  const fieldErrorEntries = Object.entries(problem.fieldErrors ?? {});
  return (
    <div
      role="alert"
      className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <div className="flex-1 space-y-1">
          <p className="font-medium leading-tight">{problem.title}</p>
          {problem.detail ? <p className="text-destructive/90">{problem.detail}</p> : null}
          {fieldErrorEntries.length > 0 ? (
            <ul className="mt-2 list-disc space-y-0.5 pl-5 text-destructive/90">
              {fieldErrorEntries.map(([field, messages]) => (
                <li key={field}>
                  <span className="font-medium">{field}:</span> {messages.join(" ")}
                </li>
              ))}
            </ul>
          ) : null}
          {problem.correlationId ? (
            <p className="pt-1 text-xs text-destructive/70">
              Reference&nbsp;<code className="font-mono">{problem.correlationId}</code>
            </p>
          ) : null}
        </div>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss error"
            className="rounded-md p-1 text-destructive/70 hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
