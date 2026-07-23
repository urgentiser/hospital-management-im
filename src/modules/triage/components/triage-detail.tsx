/**
 * Triage detail — read-only workspace with actions gated by permission and state.
 */
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Activity, AlertTriangle, Building2, ClipboardCheck, ClipboardList, Clock,
  Lock, RefreshCcw, Stethoscope, Unlock, User, X,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/security/auth-provider";
import { hasPermission, Permissions } from "@/security/permissions";
import { triageService } from "@/services/modules/triage.service";
import { TRIAGE_FINDING_LABELS, type TriageFindingFlags, type TriageRecord, type TriageSeverity } from "@/modules/triage/contracts";

type Mode = "view" | "attend" | "reassess" | "complete";

type Props = {
  triageId: string | null;
  mode: Mode;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onChanged?: () => void;
};

export function TriageDetailModal({ triageId, mode, open, onOpenChange, onChanged }: Props) {
  const { principal } = useAuth();
  const canAttend = hasPermission(principal, Permissions.TriageAttend);
  const canUpdate = hasPermission(principal, Permissions.TriageUpdate);
  const canComplete = hasPermission(principal, Permissions.TriageComplete);
  const canOverride = hasPermission(principal, Permissions.TriageOverride);

  const [record, setRecord] = useState<TriageRecord | null>(null);
  const [tab, setTab] = useState("overview");

  // reassess form
  const [rrRate, setRrRate] = useState("");
  const [hrRate, setHrRate] = useState("");
  const [bpSys, setBpSys] = useState("");
  const [temp, setTemp] = useState("");
  const [note, setNote] = useState("");
  const [findings, setFindings] = useState<TriageFindingFlags>({});

  // complete form
  const [outcomeNote, setOutcomeNote] = useState("");

  const currentUser = "Sr N. Mokoena (RN)"; // demo actor

  useEffect(() => {
    if (open && triageId) {
      const r = triageService.getTriage(triageId);
      setRecord(r);
      setTab(mode === "reassess" ? "reassess" : mode === "complete" ? "complete" : "overview");
      // seed reassess form from latest observation
      const last = r?.observations[r.observations.length - 1];
      setRrRate(String(last?.respiratoryRate ?? ""));
      setHrRate(String(last?.heartRate ?? ""));
      setBpSys(String(last?.systolicBp ?? ""));
      setTemp(String(last?.temperature ?? ""));
      setFindings({ ...(last?.findings ?? {}) });
      setNote("");
      setOutcomeNote("");
      // Attend acquires lock
      if (r && mode === "attend" && canAttend && !r.lockedBy) {
        try {
          const locked = triageService.lockTriage(r.id, currentUser);
          if (locked) setRecord({ ...locked });
          onChanged?.();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Could not lock record");
        }
      }
    } else if (!open) {
      setRecord(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, triageId, mode]);

  const refresh = () => {
    if (!triageId) return;
    setRecord(triageService.getTriage(triageId));
    onChanged?.();
  };

  const previewObs = useMemo(() => ({
    respiratoryRate: rrRate ? Number(rrRate) : undefined,
    heartRate: hrRate ? Number(hrRate) : undefined,
    systolicBp: bpSys ? Number(bpSys) : undefined,
    temperature: temp ? Number(temp) : undefined,
    mobility: record?.observations.at(-1)?.mobility,
    avpu: record?.observations.at(-1)?.avpu,
    trauma: record?.observations.at(-1)?.trauma,
    findings,
  }), [rrRate, hrRate, bpSys, temp, findings, record]);

  const previewScore = triageService.calculateScore(previewObs);
  const previewSeverity = triageService.resolveSeverity(previewScore);
  const severityChanged = record ? previewSeverity !== record.currentSeverity : false;

  function reassess() {
    if (!record) return;
    try {
      triageService.reassessTriage({
        triageId: record.id,
        by: currentUser,
        observation: {
          ...previewObs,
          findings,
          score: previewScore,
          severity: previewSeverity,
        },
        note,
      });
      toast.success("Reassessment recorded", { description: `Severity ${previewSeverity} (score ${previewScore})` });
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save reassessment");
    }
  }

  function complete() {
    if (!record) return;
    try {
      triageService.completeTriage({ triageId: record.id, by: currentUser, outcomeNote });
      toast.success("Triage completed");
      refresh();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not complete triage");
    }
  }

  function unlock() {
    if (!record) return;
    const r = triageService.unlockTriage(record.id);
    if (r) { setRecord({ ...r }); onChanged?.(); toast.success("Record released"); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100vh-2rem)] w-[min(1100px,calc(100vw-2rem))] max-w-none flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b bg-gradient-to-r from-primary/10 via-transparent to-transparent px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-background/80 shadow-sm ring-1 ring-border">
              <Stethoscope className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="truncate text-lg">
                {record ? `${record.reference} · ${record.patientName}` : "Triage record"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {record ? `${record.hospitalUnit} · ${record.patientType}` : "Loading…"}
              </DialogDescription>
            </div>
            {record && (
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="gap-1"><Building2 className="h-3 w-3" />{record.facilityId}</Badge>
                <SeverityChip severity={record.currentSeverity} />
                <Badge variant="outline">{record.state}</Badge>
                {record.lockedBy ? (
                  <Badge variant="outline" className="gap-1 border-rose-400/40 text-rose-600 dark:text-rose-400">
                    <Lock className="h-3 w-3" />Locked · {record.lockedBy}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 text-muted-foreground"><Unlock className="h-3 w-3" /> Free</Badge>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!record ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-xs text-muted-foreground">Triage record not found.</div>
          ) : (
            <Tabs value={tab} onValueChange={setTab} className="space-y-3">
              <TabsList className="flex flex-wrap">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="observations">Observations</TabsTrigger>
                <TabsTrigger value="reassess" disabled={!canUpdate || record.state === "Completed" || record.state === "Cancelled"}>Reassess</TabsTrigger>
                <TabsTrigger value="complete" disabled={!canComplete || record.state === "Completed" || record.state === "Cancelled"}>Complete</TabsTrigger>
                <TabsTrigger value="state">State history</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoRow icon={User} label="Patient" value={record.patientType === "Unknown"
                    ? `Unknown patient · ${record.unknown?.distinguishing ?? "—"}`
                    : `${record.patientName} · MRN ${record.patientMrn ?? "—"} · ${record.patientMaskedIdentifier ?? ""}`} />
                  <InfoRow icon={Building2} label="Facility / unit" value={`${record.facilityId} · ${record.hospitalUnit}`} />
                  <InfoRow icon={Clock} label="Arrival" value={`${new Date(record.arrivalAt).toLocaleString("en-ZA")} · ${record.arrivalMode}${record.ambulanceGroup ? ` · ${record.ambulanceGroup}` : ""}`} />
                  <InfoRow icon={ClipboardList} label="Presenting complaint" value={record.presentingComplaint} />
                  <InfoRow icon={Stethoscope} label="Practitioner" value={record.practitioner ?? "—"} />
                  <InfoRow icon={Activity} label="Score / severity" value={<><span className="font-semibold">{record.currentScore}</span> · <SeverityChip severity={record.currentSeverity} />{record.overridden && <Badge variant="outline" className="ml-2 border-amber-500/40 text-[10px] text-amber-700 dark:text-amber-300">Overridden</Badge>}</>} />
                </div>
                {(record.isInjury || record.isPoisoning) && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {record.isInjury && <InfoRow icon={AlertTriangle} label="Injury" value={`${record.injury?.mechanism ?? "—"}${record.injury?.bodyRegion ? ` · ${record.injury.bodyRegion}` : ""}${record.injury?.description ? ` · ${record.injury.description}` : ""}`} />}
                    {record.isPoisoning && <InfoRow icon={AlertTriangle} label="Poisoning" value={`${record.poisoning?.substance ?? "—"} · ${record.poisoning?.route ?? "—"}${record.poisoning?.quantity ? ` · ${record.poisoning.quantity}` : ""}`} />}
                  </div>
                )}
                {record.lockedBy && (
                  <div className="flex flex-wrap items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
                    <Lock className="h-3.5 w-3.5" /> Currently locked by <span className="font-semibold">{record.lockedBy}</span> since {record.lockedAt ?? "—"}.
                    <Button size="sm" variant="outline" className="ml-auto h-7 text-xs" onClick={unlock}>
                      <Unlock className="mr-1 h-3 w-3" /> Release lock
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="observations" className="space-y-2">
                {record.observations.map((o, i) => (
                  <div key={i} className="rounded-lg border p-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Badge variant="outline">#{i + 1}</Badge>
                      <span className="text-muted-foreground">{new Date(o.recordedAt).toLocaleString("en-ZA")}</span>
                      <span className="text-muted-foreground">· {o.recordedBy}</span>
                      <span className="ml-auto inline-flex items-center gap-2">
                        <span className="font-semibold">Score {o.score}</span>
                        <SeverityChip severity={o.severity} />
                        {o.overridden && <Badge variant="outline" className="border-amber-500/40 text-[10px] text-amber-700 dark:text-amber-300">Overridden by {o.overrideBy}</Badge>}
                      </span>
                    </div>
                    <div className="mt-2 grid gap-2 text-xs sm:grid-cols-4">
                      <Kv k="RR" v={o.respiratoryRate} />
                      <Kv k="HR" v={o.heartRate} />
                      <Kv k="Sys BP" v={o.systolicBp} />
                      <Kv k="Temp" v={o.temperature} />
                      <Kv k="Mobility" v={o.mobility} />
                      <Kv k="AVPU" v={o.avpu} />
                      <Kv k="Trauma" v={o.trauma} />
                    </div>
                    {Object.keys(o.findings).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {Object.entries(o.findings).filter(([, v]) => v).map(([k]) => (
                          <Badge key={k} variant="secondary" className="text-[10px]">{TRIAGE_FINDING_LABELS[k as keyof TriageFindingFlags] ?? k}</Badge>
                        ))}
                      </div>
                    )}
                    {o.note && <div className="mt-2 text-xs text-muted-foreground">Note: {o.note}</div>}
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="reassess" className="space-y-3">
                <p className="text-xs text-muted-foreground">Capture a new observation set. Existing observations are retained in history.</p>
                {record.lockedBy && record.lockedBy !== currentUser && (
                  <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
                    <Lock className="mr-1 inline h-3.5 w-3.5" /> Locked by {record.lockedBy}. Ask them to release before reassessing.
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-4">
                  <Field label="Respiratory rate"><Input value={rrRate} onChange={(e) => setRrRate(e.target.value)} type="number" /></Field>
                  <Field label="Heart rate"><Input value={hrRate} onChange={(e) => setHrRate(e.target.value)} type="number" /></Field>
                  <Field label="Systolic BP"><Input value={bpSys} onChange={(e) => setBpSys(e.target.value)} type="number" /></Field>
                  <Field label="Temperature"><Input value={temp} onChange={(e) => setTemp(e.target.value)} type="number" /></Field>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Findings</div>
                  <div className="grid gap-1 sm:grid-cols-3">
                    {(Object.keys(TRIAGE_FINDING_LABELS) as Array<keyof TriageFindingFlags>).map((k) => (
                      <label key={k} className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs hover:bg-muted/40">
                        <input type="checkbox" checked={!!findings[k]} onChange={(e) => setFindings((f) => ({ ...f, [k]: e.target.checked }))} />
                        {TRIAGE_FINDING_LABELS[k]}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-3 text-xs">
                  <span>Preview: <span className="font-semibold">Score {previewScore}</span></span>
                  <SeverityChip severity={previewSeverity} />
                  {severityChanged && <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300">Severity change — note required</Badge>}
                </div>
                <div>
                  <Label className="mb-1 block text-xs">Note {severityChanged && <span className="text-rose-600">*</span>}</Label>
                  <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason for reassessment / clinical update…" />
                </div>
                <div className="flex justify-end">
                  <Button size="sm" onClick={reassess} disabled={!canUpdate || (severityChanged && !note.trim()) || (!!record.lockedBy && record.lockedBy !== currentUser)}>
                    <RefreshCcw className="mr-1 h-4 w-4" /> Save reassessment
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="complete" className="space-y-3">
                <p className="text-xs text-muted-foreground">Complete this triage. End date/time is captured automatically; the record is released and moves to Completed.</p>
                {!record.practitioner && (
                  <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
                    A treating practitioner must be set before completion.
                  </div>
                )}
                <div>
                  <Label className="mb-1 block text-xs">Outcome / disposition note</Label>
                  <Textarea rows={3} value={outcomeNote} onChange={(e) => setOutcomeNote(e.target.value)} placeholder="e.g. Admitted to ward 3B, referred to cardiology…" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button size="sm" onClick={complete} disabled={!canComplete || !record.practitioner}>
                    <ClipboardCheck className="mr-1 h-4 w-4" /> Complete triage
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="state" className="space-y-2">
                {record.stateHistory.map((h, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border p-3 text-xs">
                    <Badge variant="outline" className="shrink-0">{h.from} → {h.to}</Badge>
                    <div className="min-w-0 flex-1">
                      <div className="text-muted-foreground">{h.at} · {h.by}</div>
                      {h.reason && <div className="mt-0.5">{h.reason}</div>}
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="timeline" className="space-y-2">
                {record.timeline.map((t, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border p-3 text-xs">
                    <div className="shrink-0 text-muted-foreground">{t.at}</div>
                    <div className="min-w-0 flex-1">
                      <div>{t.entry}</div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">by {t.by}</div>
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          )}
        </div>

        <div className="shrink-0 border-t bg-background/95 px-6 py-3 backdrop-blur">
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X className="mr-1 h-4 w-4" /> Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-background ring-1 ring-border">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-0.5 text-sm">{value}</div>
      </div>
    </div>
  );
}

function Kv({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="rounded-md border bg-muted/20 px-2 py-1">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
      <div className="text-xs font-medium">{v ?? "—"}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1 block text-xs">{label}</Label>
      {children}
    </div>
  );
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
