import { useMemo, useState } from "react";
import { Search, ChevronRight, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/security/auth-provider";
import { hasPermission } from "@/security/permissions";
import {
  admissionProcessGroups,
  admissionProcesses,
  type AdmissionProcessDef,
  type AdmissionProcessGroupKey,
} from "@/modules/admissions/workflows/process-registry";

type Props = {
  /** Called when a user launches a process. Route the caller into the guided
   * workflow using the returned section + action keys. */
  onLaunch: (process: AdmissionProcessDef) => void;
};

/**
 * Grouped, searchable Admissions Process Selector.
 * Renders the 20+ processes from `process-registry` in seven clusters that
 * map to the operating model in spec §4. Purely presentational — dispatch is
 * delegated to the caller.
 */
export function AdmissionProcessSelector({ onLaunch }: Props) {
  const [query, setQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState<AdmissionProcessGroupKey | "all">("all");
  const { principal } = useAuth();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return admissionProcesses.filter((p) => {
      if (activeGroup !== "all" && p.group !== activeGroup) return false;
      if (!q) return true;
      return (
        p.label.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.key.toLowerCase().includes(q)
      );
    });
  }, [query, activeGroup]);

  const grouped = useMemo(() => {
    const map = new Map<AdmissionProcessGroupKey, AdmissionProcessDef[]>();
    for (const p of filtered) {
      const arr = map.get(p.group) ?? [];
      arr.push(p);
      map.set(p.group, arr);
    }
    return map;
  }, [filtered]);

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Admissions processes</h2>
          <p className="text-sm text-muted-foreground">
            Launch a guided Admissions process. Processes are grouped by operational area.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search admission processes"
            placeholder="Search processes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </header>

      <div className="flex flex-wrap gap-1.5">
        <GroupChip active={activeGroup === "all"} onClick={() => setActiveGroup("all")} label="All" count={admissionProcesses.length} />
        {admissionProcessGroups.map((g) => (
          <GroupChip
            key={g.key}
            active={activeGroup === g.key}
            onClick={() => setActiveGroup(g.key)}
            label={g.title}
            count={admissionProcesses.filter((p) => p.group === g.key).length}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No processes match “{query}”.
        </div>
      ) : (
        <div className="space-y-6">
          {admissionProcessGroups
            .filter((g) => (grouped.get(g.key)?.length ?? 0) > 0)
            .map((g) => {
              const Icon = g.icon;
              const items = grouped.get(g.key) ?? [];
              return (
                <div key={g.key} className="space-y-3">
                  <div className={cn(
                    "flex items-center gap-3 rounded-xl border bg-gradient-to-r p-3",
                    g.accent,
                  )}>
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-background/70 shadow-sm ring-1 ring-border">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">{g.title}</div>
                      <div className="text-[11px] text-muted-foreground">{g.tagline}</div>
                    </div>
                    <Badge variant="secondary" className="ml-auto">{items.length}</Badge>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {items.map((p) => (
                      <ProcessCard key={p.key} process={p} onLaunch={onLaunch} />
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </section>
  );
}

function GroupChip({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-background hover:bg-accent",
      )}
    >
      {label}
      <span className={cn("rounded-full px-1.5 text-[10px]", active ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground")}>
        {count}
      </span>
    </button>
  );
}

function ProcessCard({ process, onLaunch }: { process: AdmissionProcessDef; onLaunch: (p: AdmissionProcessDef) => void }) {
  const Icon = process.icon;
  return (
    <button
      type="button"
      onClick={() => onLaunch(process)}
      className={cn(
        "group flex w-full items-start gap-3 rounded-xl border bg-card p-3 text-left shadow-sm transition",
        "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        process.destructive && "hover:border-rose-400/60",
      )}
    >
      <div className={cn(
        "grid h-10 w-10 shrink-0 place-items-center rounded-lg ring-1 ring-border transition",
        process.destructive
          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:bg-rose-500/15"
          : "bg-primary/10 text-primary group-hover:bg-primary/15",
      )}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="truncate text-sm font-medium">{process.label}</div>
          {process.permission === "elevated" && (
            <Badge variant="outline" className="border-rose-400/50 text-[10px] text-rose-600 dark:text-rose-400">
              Elevated
            </Badge>
          )}
        </div>
        <div className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{process.description}</div>
      </div>
      <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
    </button>
  );
}
