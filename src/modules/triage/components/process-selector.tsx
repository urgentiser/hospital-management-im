import { ChevronRight, Lock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/security/auth-provider";
import { hasPermission } from "@/security/permissions";
import {
  triageProcessGroups, triageProcesses,
  type TriageProcessDef,
} from "@/modules/triage/workflows/process-registry";

type Props = { onLaunch: (process: TriageProcessDef) => void };

export function TriageProcessSelector({ onLaunch }: Props) {
  const { principal } = useAuth();
  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-lg font-semibold tracking-tight">Triage processes</h2>
        <p className="text-sm text-muted-foreground">
          Launch the guided Triage capture workflow, or open the facility triage list to attend an existing patient.
        </p>
      </header>

      {triageProcessGroups.map((g) => {
        const Icon = g.icon;
        const items = triageProcesses.filter((p) => p.group === g.key);
        if (items.length === 0) return null;
        return (
          <div key={g.key} className="space-y-3">
            <div className={cn("flex items-center gap-3 rounded-xl border bg-gradient-to-r p-3", g.accent)}>
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-background/70 shadow-sm ring-1 ring-border">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold">{g.title}</div>
                <div className="text-[11px] text-muted-foreground">{g.tagline}</div>
              </div>
              <Badge variant="secondary" className="ml-auto">{items.length}</Badge>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {items.map((p) => (
                <ProcessCard key={p.key} process={p} allowed={hasPermission(principal, p.permission)} onLaunch={onLaunch} />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}

function ProcessCard({ process, allowed, onLaunch }: { process: TriageProcessDef; allowed: boolean; onLaunch: (p: TriageProcessDef) => void }) {
  const Icon = process.icon;
  return (
    <button
      type="button"
      onClick={() => allowed && onLaunch(process)}
      disabled={!allowed}
      aria-disabled={!allowed}
      title={allowed ? process.description : "You do not have permission to launch this process."}
      className={cn(
        "group flex w-full items-start gap-3 rounded-xl border bg-card p-4 text-left shadow-sm transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        allowed ? "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md" : "cursor-not-allowed opacity-60",
      )}
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-border">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="truncate text-sm font-medium">{process.label}</div>
          {process.primary && (
            <Badge variant="outline" className="gap-1 border-primary/40 text-[10px] text-primary">
              <Sparkles className="h-2.5 w-2.5" /> Primary
            </Badge>
          )}
          {!allowed && (
            <Badge variant="outline" className="gap-1 border-muted-foreground/30 text-[10px] text-muted-foreground">
              <Lock className="h-2.5 w-2.5" /> No access
            </Badge>
          )}
        </div>
        <div className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{process.description}</div>
      </div>
      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
    </button>
  );
}
