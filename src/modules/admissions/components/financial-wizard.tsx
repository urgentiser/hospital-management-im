/**
 * Admission Financial cluster — Phase F.
 *
 * Typed guided wizards for §8 (Financial & billing) of the Admissions spec:
 *  - misc-charge     — capture a miscellaneous / bill-side charge on the admission
 *  - billing-checks  — work outstanding billing checks (resolve / override / reassign)
 *  - finalise-bill   — close accommodation and finalise the discharge bill
 *
 * Same premium dialog scaffold as the funding wizard; dispatches through the
 * typed `admissionsService` and surfaces RFC-7807 problems.
 */
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, AlertTriangle, Check, CheckCircle2, ClipboardCheck,
  Coins, Receipt, X, Building2, ShieldCheck, Undo2, ListChecks,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { FACILITIES } from "@/lib/facility-context";
import { admissionsService } from "@/services/modules/admissions.service";
import type {
  BillingCheckItem, BillingCheckOverride, FinaliseBillRequest,
  ManageBillingCheckRequest, MiscellaneousChargeRequest,
} from "@/modules/admissions/contracts";
import { Loader2 } from "lucide-react";

export type FinancialVariant = "misc-charge" | "billing-checks" | "finalise-bill";

const META: Record<FinancialVariant, { title: string; blurb: string; icon: typeof Receipt; accent: string }> = {
  "misc-charge":    { title: "Add miscellaneous charge", blurb: "Capture a bill-side miscellaneous charge on the admission.", icon: Receipt,        accent: "from-fuchsia-500/25 to-transparent" },
  "billing-checks": { title: "Manage billing checks",     blurb: "Work outstanding billing and clinical checks before finalise.", icon: ClipboardCheck, accent: "from-amber-500/25 to-transparent" },
  "finalise-bill":  { title: "Finalise bill",             blurb: "Close accommodation and finalise the discharge bill.",      icon: Coins,          accent: "from-emerald-500/25 to-transparent" },
};

const CHARGE_TYPES = [
  "Consumable", "Prosthesis", "Equipment usage", "Take-home medication",
  "Sundry", "Interpreter", "Special investigation", "Other",
];

type OverrideEntry = BillingCheckOverride;

type Draft = {
  admissionId: string;
  facilityId: string;
  // misc-charge
  chargeType: string;
  serviceDate: string;
  description: string;
  quantity: string;
  amountZar: string;
  chargeReason: string;
  // billing-checks / finalise
  checks: BillingCheckItem[];
  checksLoading: boolean;
  selectedCheckId: string;
  resolution: ManageBillingCheckRequest["resolution"];
  resolutionNote: string;
  overrideApproverId: string;
  reassignToUserId: string;
  // finalise-bill
  finalisedAt: string;
  closeAccommodation: boolean;
  clinicalCodingSignedOff: boolean;
  overrides: OverrideEntry[];
  billingNarrative: string;
};

const today = () => new Date().toISOString().slice(0, 10);

const EMPTY: Draft = {
  admissionId: "", facilityId: FACILITIES[0] ?? "",
  chargeType: "Consumable", serviceDate: today(), description: "",
  quantity: "1", amountZar: "0.00", chargeReason: "",
  checks: [], checksLoading: false, selectedCheckId: "", resolution: "Resolve",
  resolutionNote: "", overrideApproverId: "", reassignToUserId: "",
  finalisedAt: today(), closeAccommodation: true, clinicalCodingSignedOff: false,
  overrides: [], billingNarrative: "",
};

type StepDef = { key: string; title: string; hint: string };

function stepsFor(variant: FinancialVariant): StepDef[] {
  switch (variant) {
    case "misc-charge":
      return [
        { key: "identify", title: "Identify admission", hint: "Which admission is being charged?" },
        { key: "charge",   title: "Charge details",     hint: "Type, quantity, amount and description." },
        { key: "review",   title: "Review & submit",    hint: "Confirm the charge before posting." },
      ];
    case "billing-checks":
      return [
        { key: "identify",   title: "Identify admission", hint: "Which admission are we working on?" },
        { key: "select",     title: "Select check",       hint: "Pick a check from the outstanding list." },
        { key: "resolution", title: "Resolution",         hint: "Resolve, override or reassign — with a note." },
        { key: "review",     title: "Review & submit",    hint: "Confirm the resolution." },
      ];
    case "finalise-bill":
      return [
        { key: "identify", title: "Identify admission",     hint: "Which admission are we closing?" },
        { key: "readiness", title: "Readiness checks",       hint: "Confirm blocking items and coding sign-off." },
        { key: "finalise", title: "Finalisation",           hint: "Capture narrative and final date." },
        { key: "review",   title: "Review & submit",        hint: "Confirm and issue the bill." },
      ];
  }
}

type Props = {
  variant: FinancialVariant | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCompleted?: () => void;
  /** Prefill admission id when opened from an Admission Workspace. */
  initialAdmissionId?: string;
  /** Latest server version token; sent as ifMatchVersion for optimistic concurrency. */
  ifMatchVersion?: string;
};

export function AdmissionFinancialWizard({ variant, open, onOpenChange, onCompleted, initialAdmissionId, ifMatchVersion }: Props) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [stepIdx, setStepIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const steps = useMemo(() => (variant ? stepsFor(variant) : []), [variant]);
  const meta = variant ? META[variant] : null;

  useEffect(() => {
    if (open) {
      setDraft({ ...EMPTY, admissionId: initialAdmissionId ?? "" });
      setStepIdx(0);
      setProblem(null);
    }
  }, [open, variant, initialAdmissionId]);

  const overrideMap = useMemo(
    () => new Map(draft.overrides.map((o) => [o.checkId, o])),
    [draft.overrides],
  );

  // Auto-load outstanding checks when relevant steps are reached with an admission id.
  const needsChecks = variant === "billing-checks" || variant === "finalise-bill";
  const currentKey = steps[stepIdx]?.key;
  useEffect(() => {
    if (!open || !needsChecks) return;
    if (!draft.admissionId.trim()) return;
    if (currentKey !== "select" && currentKey !== "readiness") return;
    if (draft.checks.length > 0 || draft.checksLoading) return;
    let cancelled = false;
    (async () => {
      setDraft((d) => ({ ...d, checksLoading: true }));
      const r = await admissionsService.listBillingChecks(draft.admissionId);
      if (cancelled) return;
      setDraft((d) => ({
        ...d,
        checksLoading: false,
        checks: r.ok ? r.data : [],
      }));
      if (!r.ok) setProblem(r.problem.detail ?? r.problem.title);
    })();
    return () => { cancelled = true; };
  }, [open, needsChecks, currentKey, draft.admissionId, draft.checks.length, draft.checksLoading]);

  if (!variant || !meta) return null;

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const currentStep = steps[stepIdx];
  const isLast = stepIdx === steps.length - 1;

  const selectedCheck = draft.checks.find((c) => c.checkId === draft.selectedCheckId);
  const blockingOpen = draft.checks.filter((c) => c.severity === "Blocking" && c.status === "Open");
  const totalCharge = (Number(draft.quantity || "0") * Number(draft.amountZar || "0")) || 0;
  const overrideComplete = (o: OverrideEntry | undefined) => !!o && !!o.reason.trim() && !!o.approverId.trim();

  const canAdvance = (() => {
    if (!currentStep) return false;
    switch (currentStep.key) {
      case "identify": return !!draft.admissionId.trim();
      case "charge":
        return !!draft.chargeType && !!draft.description.trim()
          && Number(draft.quantity) > 0 && Number(draft.amountZar) > 0;
      case "select": return !!draft.selectedCheckId;
      case "resolution":
        if (!draft.resolutionNote.trim()) return false;
        if (draft.resolution === "Override") return !!draft.overrideApproverId.trim();
        if (draft.resolution === "Reassign") return !!draft.reassignToUserId.trim();
        return true;
      case "readiness":
        return draft.clinicalCodingSignedOff
          && blockingOpen.every((c) => overrideComplete(overrideMap.get(c.checkId)));
      case "finalise": return !!draft.finalisedAt;
      case "review": return true;
      default: return true;
    }
  })();

  const submit = async () => {
    setSubmitting(true); setProblem(null);
    try {
      let r;
      if (variant === "misc-charge") {
        const req: MiscellaneousChargeRequest = {
          admissionId: draft.admissionId,
          chargeType: draft.chargeType,
          serviceDate: draft.serviceDate,
          description: draft.description,
          quantity: Number(draft.quantity),
          amountZar: Number(draft.amountZar),
          reason: draft.chargeReason || undefined,
        };
        r = await admissionsService.addMiscellaneousCharge(req);
      } else if (variant === "billing-checks") {
        const req: ManageBillingCheckRequest = {
          admissionId: draft.admissionId,
          checkId: draft.selectedCheckId,
          resolution: draft.resolution,
          resolutionNote: draft.resolutionNote,
          overrideApproverId: draft.overrideApproverId || undefined,
          reassignToUserId: draft.reassignToUserId || undefined,
          ifMatchVersion,
        };
        r = await admissionsService.manageBillingCheck(req);
      } else {
        const req: FinaliseBillRequest = {
          admissionId: draft.admissionId,
          finalisedAt: draft.finalisedAt,
          closeAccommodation: draft.closeAccommodation,
          clinicalCodingSignedOff: draft.clinicalCodingSignedOff,
          overriddenChecks: draft.overrides.filter((o) => blockingOpen.some((c) => c.checkId === o.checkId)),
          billingNarrative: draft.billingNarrative || undefined,
          ifMatchVersion,
        };
        r = await admissionsService.finaliseBill(req);
      }
      if (!r.ok) { setProblem(r.problem.detail ?? r.problem.title); return; }
      const desc = variant === "finalise-bill" && r.ok
        ? `Bill ${(r.data as { billNumber: string }).billNumber} · R${(r.data as { totalAmountZar: number }).totalAmountZar.toFixed(2)}`
        : `Ref ${r.correlationId?.slice(0, 8)}`;
      toast.success(`${meta.title} — submitted`, { description: desc });
      onCompleted?.(); onOpenChange(false);
    } finally { setSubmitting(false); }
  };

  const Icon = meta.icon;

  const toggleOverride = (id: string) => {
    setDraft((d) => {
      const exists = d.overrides.some((o) => o.checkId === id);
      return {
        ...d,
        overrides: exists
          ? d.overrides.filter((o) => o.checkId !== id)
          : [...d.overrides, { checkId: id, reason: "", approverId: "" }],
      };
    });
  };
  const patchOverride = (id: string, patch: Partial<OverrideEntry>) => {
    setDraft((d) => ({
      ...d,
      overrides: d.overrides.map((o) => (o.checkId === id ? { ...o, ...patch } : o)),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0">
        <div className={cn("relative bg-gradient-to-br px-6 py-5", meta.accent)}>
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-background/80 ring-1 ring-border shadow-sm">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg">{meta.title}</DialogTitle>
                <DialogDescription className="text-xs">{meta.blurb}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {steps.length > 1 && (
          <div className="border-b bg-muted/30 px-6 py-3">
            <ol className="flex flex-wrap items-center gap-2">
              {steps.map((s, i) => {
                const done = i < stepIdx, active = i === stepIdx;
                return (
                  <li key={s.key} className="flex items-center gap-2">
                    <button type="button" onClick={() => i <= stepIdx && setStepIdx(i)}
                      className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition",
                        active && "border-primary bg-primary text-primary-foreground shadow-sm",
                        done && "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                        !active && !done && "border-border bg-background text-muted-foreground")}>
                      <span className={cn("grid h-5 w-5 place-items-center rounded-full text-[10px] font-semibold",
                        active ? "bg-primary-foreground/20" : done ? "bg-emerald-500/20" : "bg-muted")}>
                        {done ? <Check className="h-3 w-3" /> : i + 1}
                      </span>
                      <span className="font-medium">{s.title}</span>
                    </button>
                    {i < steps.length - 1 && <span className="h-px w-4 bg-border" />}
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          <div className="mb-4">
            <div className="text-sm font-semibold">{currentStep?.title}</div>
            <div className="text-xs text-muted-foreground">{currentStep?.hint}</div>
          </div>

          {currentStep?.key === "identify" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Admission reference" required>
                <Input value={draft.admissionId} onChange={(e) => set("admissionId", e.target.value)} placeholder="ADM-…" />
              </Field>
              <Field label="Facility">
                <SelectBox value={draft.facilityId} onChange={(v) => set("facilityId", v)}
                  options={FACILITIES.map((f) => ({ value: f, label: f }))} />
              </Field>
            </div>
          )}

          {currentStep?.key === "charge" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Charge type" required>
                <SelectBox value={draft.chargeType} onChange={(v) => set("chargeType", v)}
                  options={CHARGE_TYPES.map((c) => ({ value: c, label: c }))} />
              </Field>
              <Field label="Service date">
                <Input type="date" value={draft.serviceDate} onChange={(e) => set("serviceDate", e.target.value)} />
              </Field>
              <Field label="Quantity" required>
                <Input type="number" min="1" step="1" value={draft.quantity} onChange={(e) => set("quantity", e.target.value)} />
              </Field>
              <Field label="Unit amount (ZAR)" required>
                <Input type="number" min="0" step="0.01" value={draft.amountZar} onChange={(e) => set("amountZar", e.target.value)} />
              </Field>
              <Field label="Description" required className="sm:col-span-2">
                <Input value={draft.description} onChange={(e) => set("description", e.target.value)} placeholder="e.g. Orthopaedic prosthesis — knee, size M" />
              </Field>
              <Field label="Reason / notes" className="sm:col-span-2">
                <Textarea rows={2} value={draft.chargeReason} onChange={(e) => set("chargeReason", e.target.value)} placeholder="Why this charge is being added (optional)." />
              </Field>
              <div className="sm:col-span-2 rounded-lg border bg-muted/20 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Estimated line total</span>
                  <span className="font-semibold">R {totalCharge.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {currentStep?.key === "select" && (
            <div className="space-y-2">
              {draft.checks.map((c) => {
                const selected = draft.selectedCheckId === c.checkId;
                return (
                  <button key={c.checkId} type="button" onClick={() => set("selectedCheckId", c.checkId)}
                    className={cn("w-full rounded-lg border p-3 text-left text-xs transition",
                      selected ? "border-primary bg-primary/5 ring-1 ring-primary/40" : "hover:bg-muted/40")}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <SeverityBadge severity={c.severity} />
                        <span className="font-medium">{c.checkType.replace(/([A-Z])/g, " $1").trim()}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">{c.module} · {c.owner}</span>
                    </div>
                    <div className="mt-1 text-muted-foreground">{c.description}</div>
                  </button>
                );
              })}
            </div>
          )}

          {currentStep?.key === "resolution" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Resolution" required>
                <SelectBox value={draft.resolution} onChange={(v) => set("resolution", v as Draft["resolution"])}
                  options={[
                    { value: "Resolve",  label: "Resolve — check is complete" },
                    { value: "Override", label: "Override — proceed with approval" },
                    { value: "Reassign", label: "Reassign — send to another owner" },
                  ]} />
              </Field>
              {draft.resolution === "Override" && (
                <Field label="Approver" required>
                  <Input value={draft.overrideApproverId} onChange={(e) => set("overrideApproverId", e.target.value)} placeholder="Manager / delegate" />
                </Field>
              )}
              {draft.resolution === "Reassign" && (
                <Field label="Reassign to" required>
                  <Input value={draft.reassignToUserId} onChange={(e) => set("reassignToUserId", e.target.value)} placeholder="User or team" />
                </Field>
              )}
              <Field label="Note" required className="sm:col-span-2">
                <Textarea rows={3} value={draft.resolutionNote} onChange={(e) => set("resolutionNote", e.target.value)} placeholder="What was done to resolve this check." />
              </Field>
              {selectedCheck && (
                <div className="sm:col-span-2 rounded-lg border bg-muted/20 p-3 text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground">{selectedCheck.checkType}:</span> {selectedCheck.description}
                </div>
              )}
            </div>
          )}

          {currentStep?.key === "readiness" && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-lg border p-3 text-xs">
                <Checkbox id="coding" checked={draft.clinicalCodingSignedOff}
                  onCheckedChange={(v) => set("clinicalCodingSignedOff", !!v)} />
                <div>
                  <Label htmlFor="coding" className="text-xs font-medium">Clinical coding signed off</Label>
                  <div className="text-muted-foreground">ICD-10 / CPT codes captured and signed by the clinical coder.</div>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-lg border p-3 text-xs">
                <Checkbox id="accom" checked={draft.closeAccommodation}
                  onCheckedChange={(v) => set("closeAccommodation", !!v)} />
                <div>
                  <Label htmlFor="accom" className="text-xs font-medium">Close accommodation on finalise</Label>
                  <div className="text-muted-foreground">Close any open accommodation period at the finalise date.</div>
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center gap-2 text-xs font-medium">
                  <ListChecks className="h-3.5 w-3.5 text-primary" /> Blocking checks
                </div>
                {blockingOpen.length === 0 ? (
                  <div className="rounded-lg border bg-emerald-500/5 p-3 text-xs text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" /> No blocking checks outstanding.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {blockingOpen.map((c) => {
                      const entry = overrideMap.get(c.checkId);
                      const overridden = !!entry;
                      const complete = overrideComplete(entry);
                      return (
                        <div key={c.checkId} className={cn("space-y-2 rounded-lg border p-3 text-xs",
                          overridden && complete && "border-emerald-500/40 bg-emerald-500/5",
                          overridden && !complete && "border-amber-500/40 bg-amber-500/5")}>
                          <div className="flex items-start gap-2">
                            <Checkbox id={`ov-${c.checkId}`} checked={overridden}
                              onCheckedChange={() => toggleOverride(c.checkId)} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <SeverityBadge severity={c.severity} />
                                <Label htmlFor={`ov-${c.checkId}`} className="text-xs font-medium">
                                  Override — {c.checkType.replace(/([A-Z])/g, " $1").trim()}
                                </Label>
                              </div>
                              <div className="text-muted-foreground">{c.description}</div>
                            </div>
                          </div>
                          {overridden && (
                            <div className="grid gap-2 pl-6 sm:grid-cols-2">
                              <div>
                                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Approver <span className="text-rose-500">*</span></Label>
                                <Input className="h-8 text-xs" value={entry?.approverId ?? ""}
                                  onChange={(e) => patchOverride(c.checkId, { approverId: e.target.value })}
                                  placeholder="Manager / delegate" />
                              </div>
                              <div>
                                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Override reason <span className="text-rose-500">*</span></Label>
                                <Input className="h-8 text-xs" value={entry?.reason ?? ""}
                                  onChange={(e) => patchOverride(c.checkId, { reason: e.target.value })}
                                  placeholder="Why this blocking check is being overridden" />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep?.key === "finalise" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Finalised at" required>
                <Input type="date" value={draft.finalisedAt} onChange={(e) => set("finalisedAt", e.target.value)} />
              </Field>
              <Field label="Billing narrative" className="sm:col-span-2">
                <Textarea rows={4} value={draft.billingNarrative} onChange={(e) => set("billingNarrative", e.target.value)} placeholder="Optional summary that appears on the finalised bill." />
              </Field>
            </div>
          )}

          {currentStep?.key === "review" && <ReviewSummary draft={draft} variant={variant} total={totalCharge} />}

          {problem && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-400/40 bg-rose-500/5 p-3 text-xs text-rose-700 dark:text-rose-300">
              <AlertTriangle className="mt-0.5 h-4 w-4" />
              <div><div className="font-medium">Could not complete request</div><div>{problem}</div></div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t bg-muted/20 px-6 py-3">
          <div className="text-[11px] text-muted-foreground">Step {stepIdx + 1} of {steps.length}</div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}><X className="mr-1 h-3.5 w-3.5" />Cancel</Button>
            <Button variant="outline" size="sm" disabled={stepIdx === 0} onClick={() => setStepIdx((i) => Math.max(0, i - 1))}>
              <ArrowLeft className="mr-1 h-3.5 w-3.5" />Back
            </Button>
            {!isLast ? (
              <Button size="sm" disabled={!canAdvance} onClick={() => setStepIdx((i) => Math.min(steps.length - 1, i + 1))}>
                Continue<ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button size="sm" disabled={!canAdvance || submitting} onClick={submit}>
                {submitting ? "Submitting…" : "Submit"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, required, children, className }: { label: string; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1", className)}>
      <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}{required && <span className="ml-1 text-rose-500">*</span>}
      </Label>
      {children}
    </div>
  );
}

function SelectBox({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
      <SelectContent>{options.map((o) => <SelectItem key={o.value} value={o.value || "__none"}>{o.label}</SelectItem>)}</SelectContent>
    </Select>
  );
}

function SeverityBadge({ severity }: { severity: BillingCheckItem["severity"] }) {
  const tone = severity === "Blocking"
    ? "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300"
    : severity === "Warning"
    ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
    : "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300";
  return <Badge variant="outline" className={cn("text-[10px]", tone)}>{severity}</Badge>;
}

function ReviewSummary({ draft, variant, total }: { draft: Draft; variant: FinancialVariant; total: number }) {
  const rows: Array<[string, string]> = (() => {
    switch (variant) {
      case "misc-charge":
        return [
          ["Admission", draft.admissionId],
          ["Charge type", draft.chargeType],
          ["Description", draft.description],
          ["Quantity × unit", `${draft.quantity} × R${Number(draft.amountZar).toFixed(2)}`],
          ["Line total", `R ${total.toFixed(2)}`],
          ["Service date", draft.serviceDate],
          ["Reason", draft.chargeReason || "—"],
        ];
      case "billing-checks": {
        const c = draft.checks.find((x) => x.checkId === draft.selectedCheckId);
        return [
          ["Admission", draft.admissionId],
          ["Check", c ? `${c.checkType} — ${c.description}` : "—"],
          ["Resolution", draft.resolution],
          ["Approver / assignee",
            draft.resolution === "Override" ? draft.overrideApproverId
            : draft.resolution === "Reassign" ? draft.reassignToUserId
            : "—"],
          ["Note", draft.resolutionNote],
        ];
      }
      case "finalise-bill":
        return [
          ["Admission", draft.admissionId],
          ["Finalised at", draft.finalisedAt],
          ["Close accommodation", draft.closeAccommodation ? "Yes" : "No"],
          ["Coding signed off", draft.clinicalCodingSignedOff ? "Yes" : "No"],
          ["Overridden checks", draft.overrides.length ? draft.overrides.map((o) => `${o.checkId} (${o.approverId || "no approver"})`).join(", ") : "None"],
          ["Narrative", draft.billingNarrative || "—"],
        ];
    }
  })();
  const Icon = variant === "misc-charge" ? Receipt : variant === "billing-checks" ? ClipboardCheck : Coins;
  return (
    <div className="rounded-lg border">
      <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-2">
        <div className="flex items-center gap-2 text-xs font-medium"><Icon className="h-3.5 w-3.5 text-primary" />Summary</div>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Building2 className="h-3 w-3" />{draft.facilityId}
        </div>
      </div>
      <dl className="divide-y">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-3 gap-3 px-3 py-2 text-xs">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="col-span-2 font-medium">{v || "—"}</dd>
          </div>
        ))}
      </dl>
      <div className="flex items-center gap-2 border-t bg-muted/10 px-3 py-2 text-[11px] text-muted-foreground">
        {variant === "finalise-bill"
          ? <><ShieldCheck className="h-3 w-3 text-emerald-500" />Once submitted, the bill number is issued and the admission moves to Finalised.</>
          : variant === "billing-checks" && draft.resolution === "Override"
          ? <><Undo2 className="h-3 w-3 text-amber-500" />Overrides are recorded on the audit trail with the approver.</>
          : <><CheckCircle2 className="h-3 w-3 text-emerald-500" />Ready to submit — you can amend from the admission workspace.</>}
      </div>
    </div>
  );
}
