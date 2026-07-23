/**
 * Triage list — facility-scoped, filterable, with row actions.
 */
import { useMemo, useState } from "react";
import {
  Building2, ClipboardCheck, Eye, Filter, Lock, RefreshCcw, Search as SearchIcon,
  ShieldAlert, Stethoscope, Unlock, User,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "@/security/auth-provider";
import { hasPermission, Permissions } from "@/security/permissions";
import { triageService } from "@/services/modules/triage.service";
import {
  TRIAGE_FACILITIES,
} from "@/modules/triage/mock/triage-mock-data";
import type {
  TriageRecord, TriageSearchQuery, TriageSeverity, TriageState,
} from "@/modules/triage/contracts";

type Props = {
  onView: (id: string) => void;
  onAttend: (id: string) => void;
  onReassess: (id: string) => void;
  onComplete: (id: string) => void;
};

const SAVED_VIEWS: Array<{ key: NonNullable<TriageSearchQuery["savedView"]>; label: string; }> = [
  { key: "waiting",         label: "Waiting" },
  { key: "high-severity",   label: "High severity" },
  { key: "locked",          label: "Locked records" },
  { key: "completed-today", label: "Completed today" },
];

export function TriageList({ onView, onAttend, onReassess, onComplete }: Props) {
  const { principal } = useAuth();
  const canView = hasPermission(principal, Permissions.TriageView);
  const canAttend = hasPermission(principal, Permissions.TriageAttend);
  const canUpdate = hasPermission(principal, Permissions.TriageUpdate);
  const canComplete = hasPermission(principal, Permissions.TriageComplete);

  const [facilityId, setFacilityId] = useState<string>("all");
  const [state, setState] = useState<TriageState | "all">("all");
  const [severity, setSeverity] = useState<TriageSeverity | "all">("all");
  const [locked, setLocked] = useState<"all" | "locked" | "unlocked">("all");
  const [q, setQ] = useState("");
  const [savedView, setSavedView] = useState<NonNullable<TriageSearchQuery["savedView"]> | "">("");

  const rows = useMemo<TriageRecord[]>(() => {
    if (!canView) return [];
    return triageService.listTriage({
      facilityId: facilityId === "all" ? undefined : facilityId,
      state: state === "all" ? "" : state,
      severity: severity === "all" ? "" : severity,
      locked: locked === "all" ? "" : locked,
      q: q.trim() || undefined,
      savedView: savedView || undefined,
    });
  }, [canView, facilityId, state, severity, locked, q, savedView]);

  if (!canView) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        You do not have permission to view the triage list.
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {/* Filters */}
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {SAVED_VIEWS.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => setSavedView((prev) => prev === v.key ? "" : v.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition",
                savedView === v.key
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-background hover:bg-accent",
              )}
            >
              {v.label}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-muted-foreground">
            <Filter className="mr-1 inline h-3 w-3" /> {rows.length} record{rows.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Label className="mb-1 block text-xs">Search</Label>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Reference · patient · MRN · visit #" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="mb-1 block text-xs">Facility</Label>
            <Select value={facilityId} onValueChange={setFacilityId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All facilities</SelectItem>
                {TRIAGE_FACILITIES.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1 block text-xs">State</Label>
            <Select value={state} onValueChange={(v) => setState(v as TriageState | "all")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All states</SelectItem>
                {(["Waiting", "InProgress", "Reassessed", "Completed", "Cancelled"] as TriageState[]).map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1 block text-xs">Severity</Label>
            <Select value={severity} onValueChange={(v) => setSeverity(v as TriageSeverity | "all")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All severities</SelectItem>
                {(["Red", "Orange", "Yellow", "Green", "Blue"] as TriageSeverity[]).map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1 block text-xs">Lock status</Label>
            <Select value={locked} onValueChange={(v) => setLocked(v as "all" | "locked" | "unlocked")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="locked">Locked</SelectItem>
                <SelectItem value="unlocked">Unlocked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <Th>Reference</Th><Th>Patient</Th><Th>MRN</Th>
                <Th>Start</Th><Th>Type</Th><Th>Score</Th><Th>Severity</Th>
                <Th>State</Th><Th>Elapsed</Th><Th>Lock</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.length === 0 ? (
                <tr><td colSpan={11} className="p-8 text-center text-sm text-muted-foreground">No triage records match the filters.</td></tr>
              ) : rows.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <Td className="font-mono text-xs">{r.reference}</Td>
                  <Td>
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                        {r.patientType === "Unknown" ? "?" : (r.patientName.split(" ")[0]?.[0] ?? "P")}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-medium">{r.patientName}</div>
                        <div className="truncate text-[11px] text-muted-foreground">
                          {r.patientType} · {r.hospitalUnit}
                        </div>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-xs">
                    {r.patientType === "Unknown" ? <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300">Unknown</Badge> : (r.patientMrn ?? "—")}
                  </Td>
                  <Td className="text-xs text-muted-foreground">{new Date(r.startedAt).toLocaleString("en-ZA")}</Td>
                  <Td className="text-xs">{r.patientType}</Td>
                  <Td className="text-xs font-semibold">{r.currentScore}</Td>
                  <Td><SeverityChip severity={r.currentSeverity} /></Td>
                  <Td><StateChip state={r.state} /></Td>
                  <Td className="text-xs text-muted-foreground">{elapsed(r)}</Td>
                  <Td>
                    {r.lockedBy ? (
                      <Badge variant="outline" className="gap-1 border-rose-400/40 text-rose-600 dark:text-rose-400">
                        <Lock className="h-3 w-3" /> {r.lockedBy}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-muted-foreground"><Unlock className="h-3 w-3" /> Free</Badge>
                    )}
                  </Td>
                  <Td className="text-right">
                    <div className="inline-flex flex-wrap items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs" onClick={() => onView(r.id)}>
                        <Eye className="h-3.5 w-3.5" /> View
                      </Button>
                      {r.state !== "Completed" && r.state !== "Cancelled" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 px-2 text-xs"
                          disabled={!canAttend}
                          title={!canAttend ? "You do not have permission to attend triage records." : (r.lockedBy ? `Locked by ${r.lockedBy}` : "Attend patient")}
                          onClick={() => onAttend(r.id)}
                        >
                          <Stethoscope className="h-3.5 w-3.5" /> Attend
                        </Button>
                      )}
                      {r.state !== "Completed" && r.state !== "Cancelled" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 px-2 text-xs"
                          disabled={!canUpdate}
                          onClick={() => onReassess(r.id)}
                        >
                          <RefreshCcw className="h-3.5 w-3.5" /> Reassess
                        </Button>
                      )}
                      {r.state !== "Completed" && r.state !== "Cancelled" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 px-2 text-xs"
                          disabled={!canComplete}
                          onClick={() => onComplete(r.id)}
                        >
                          <ClipboardCheck className="h-3.5 w-3.5" /> Complete
                        </Button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Score / severity shown is mock workflow data for interface validation — not a production clinical decision engine.
      </p>
    </section>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn("px-3 py-2 text-left font-medium", className)}>{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-3 py-2 align-middle", className)}>{children}</td>;
}

function SeverityChip({ severity }: { severity: TriageSeverity }) {
  const tone: Record<TriageSeverity, string> = {
    Red: "bg-rose-600 text-white",
    Orange: "bg-orange-500 text-white",
    Yellow: "bg-amber-400 text-black",
    Green: "bg-emerald-500 text-white",
    Blue: "bg-sky-500 text-white",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold", tone[severity])}>{severity}</span>;
}

function StateChip({ state }: { state: TriageState }) {
  const tone: Record<TriageState, string> = {
    Waiting: "bg-amber-500/15 text-amber-800 border-amber-500/30 dark:text-amber-300",
    InProgress: "bg-sky-500/15 text-sky-800 border-sky-500/30 dark:text-sky-300",
    Reassessed: "bg-violet-500/15 text-violet-800 border-violet-500/30 dark:text-violet-300",
    Completed: "bg-emerald-500/15 text-emerald-800 border-emerald-500/30 dark:text-emerald-300",
    Cancelled: "bg-muted text-muted-foreground border-border",
  };
  return <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", tone[state])}>{state}</span>;
}

function elapsed(r: TriageRecord): string {
  const end = r.endedAt ? new Date(r.endedAt).getTime() : Date.now();
  const ms = end - new Date(r.startedAt).getTime();
  const mins = Math.max(0, Math.round(ms / 60000));
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}
