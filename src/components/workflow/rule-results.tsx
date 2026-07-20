import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type { RuleResult } from "@/rules/types";

export function RuleResults({ results }: { results: RuleResult[] }) {
  const relevant = results.filter((result) => !result.allowed || result.severity !== "info");
  if (!relevant.length) return null;
  return (
    <div className="space-y-2" aria-live="polite">
      {relevant.map((result, index) => {
        const Icon = result.allowed ? CheckCircle2 : result.severity === "warning" ? AlertTriangle : XCircle;
        return (
          <div
            key={`${result.ruleId}-${result.field ?? index}`}
            className={
              "flex items-start gap-2 rounded-lg border px-3 py-2 text-xs " +
              (result.severity === "error"
                ? "border-destructive/30 bg-destructive/5 text-destructive"
                : "border-warning/30 bg-warning/5 text-warning")
            }
          >
            <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{result.message}</span>
          </div>
        );
      })}
    </div>
  );
}
