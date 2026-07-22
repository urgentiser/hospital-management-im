/**
 * Admission Departure & Corrections cluster — Phase G.
 *
 * Typed guided wizards for §9–§10 of the Admissions spec:
 *  - discharge       — guided discharge with disposition, checks and documents
 *  - predischarge    — pre-discharge review of outstanding tasks
 *  - undischarge     — reverse a discharge for an EU patient (elevated)
 *  - cancel-admission — cancel with reason (elevated)
 *  - discontinue     — stop an in-progress admission (elevated)
 *  - amend-admission — correct captured details with audit trail (elevated)
 *  - notes-documents — add notes or attach supporting documents
 *
 * Mirrors the funding/financial wizard scaffold so the whole Admissions
 * suite renders identically.
 */
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, AlertTriangle, Check, CheckCircle2, ClipboardList,
  LogOut, Undo2, Ban, StopCircle, Pencil, FileText, X, Building2, ShieldCheck,
  ShieldAlert, Loader2, MessageSquare, Paperclip,
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
  AddAdmissionNoteRequest, AmendAdmissionRequest, AttachAdmissionDocumentRequest,
  CancelAdmissionRequest, DischargeAdmissionRequest, DischargeOverride,
  DiscontinueAdmissionRequest, Disposition, PreDischargeReviewItem,
  PreDischargeReviewResult, UndischargeAdmissionRequest,
} from "@/modules/admissions/contracts";

export type DepartureVariant =
  | "discharge" | "predischarge" | "undischarge"
  | "cancel-admission" | "discontinue" | "amend-admission" | "notes-documents";

const META: Record<DepartureVariant, { title: string; blurb: string; icon: typeof LogOut; accent: string; destructive?: boolean; elevated?: boolean }> = {
  "discharge":        { title: "Discharge patient",      blurb: "Complete discharge with disposition, checks and documents.",  icon: LogOut,        accent: "from-slate-500/25 to-transparent" },
  "predischarge":     { title: "Pre-discharge review",   blurb: "Review outstanding clinical, billing and case tasks.",         icon: ClipboardList, accent: "from-sky-500/25 to-transparent" },
  "undischarge":      { title: "Undischarge (EU)",        blurb: "Reverse a discharge for an EU patient with elevated approval.", icon: Undo2,       accent: "from-amber-500/25 to-transparent", destructive: true, elevated: true },
  "cancel-admission": { title: "Cancel admission",       blurb: "Cancel a pending or active admission with reason.",             icon: Ban,           accent: "from-rose-500/25 to-transparent", destructive: true, elevated: true },
  "discontinue":      { title: "Discontinue admission",  blurb: "Stop an in-progress admission before completion.",              icon: StopCircle,    accent: "from-rose-500/25 to-transparent", destructive: true, elevated: true },
  "amend-admission":  { title: "Amend admission",        blurb: "Correct captured admission details with audit trail.",          icon: Pencil,        accent: "from-violet-500/25 to-transparent", elevated: true },
  "notes-documents":  { title: "Notes and documents",    blurb: "Add notes or attach supporting documents to the admission.",   icon: FileText,      accent: "from-primary/25 to-transparent" },
};

const DISPOSITIONS: Disposition[] = ["Home", "Step-down facility", "Transfer out", "Deceased", "Self-discharge", "Other"];
const DOC_KINDS = ["Discharge summary", "Consent", "Referral letter", "Investigation result", "Script", "Sick note", "Other"];
const NOTE_CATEGORIES = ["Clinical", "Administrative", "Billing", "CaseManagement", "Other"] as const;

type OverrideEntry = { itemId: string; reason: string; approverId: string };

type Draft = {
  admissionId: string;
  facilityId: string;

  // discharge
  dischargeAt: string;
  disposition: Disposition;
  destination: string;
  dischargeReason: string;
  responsiblePractitionerId: string;
  clinicalSummary: string;
  overrideChecks: OverrideEntry[];
  transferToFacility: string;
  transferToWard: string;
  deathDateOfDeath: string;
  deathCauseOfDeath: string;
  deathCertifiedBy: string;

  // predischarge (review)
  review: PreDischargeReviewResult | null;
  reviewLoading: boolean;

  // undischarge
  approverId: string;
  correctionAt: string;
  receivingWardId: string;
  receivingBedId: string;

  // cancel / discontinue
  effectiveAt: string;

  // amend
  amend: {
    admissionType: string;
    admissionSource: string;
    admissionDate: string;
    expectedDeparture: string;
    reasonForAdmission: string;
    admittingPractitionerId: string;
    responsiblePractitionerId: string;
    admissionDiagnosis: string;
  };

  // notes / documents
  nd: "note" | "document";
  noteCategory: (typeof NOTE_CATEGORIES)[number];
  noteBody: string;
  notePatientVisible: boolean;
  docKind: string;
  docFilename: string;
  docDescription: string;

  // shared
  reason: string;
};

const today = () => new Date().toISOString().slice(0, 16);
const todayDate = () => new Date().toISOString().slice(0, 10);

const EMPTY: Draft = {
  admissionId: "", facilityId: FACILITIES[0] ?? "",
  dischargeAt: today(), disposition: "Home", destination: "", dischargeReason: "",
  responsiblePractitionerId: "", clinicalSummary: "", overrideChecks: [],
  transferToFacility: "", transferToWard: "",
  deathDateOfDeath: today(), deathCauseOfDeath: "", deathCertifiedBy: "",
  review: null, reviewLoading: false,
  approverId: "", correctionAt: today(), receivingWardId: "", receivingBedId: "",
  effectiveAt: today(),
  amend: {
    admissionType: "", admissionSource: "", admissionDate: "", expectedDeparture: "",
    reasonForAdmission: "", admittingPractitionerId: "", responsiblePractitionerId: "",
    admissionDiagnosis: "",
  },
  nd: "note", noteCategory: "Clinical", noteBody: "", notePatientVisible: false,
  docKind: DOC_KINDS[0], docFilename: "", docDescription: "",
  reason: "",
};

type StepDef = { key: string; title: string; hint: string };

function stepsFor(variant: DepartureVariant): StepDef[] {
  switch (variant) {
    case "discharge":
      return [
        { key: "identify",  title: "Identify admission",  hint: "Which admission is being discharged?" },
        { key: "readiness", title: "Readiness",           hint: "Confirm outstanding checks are addressed." },
        { key: "capture",   title: "Discharge details",   hint: "Date, disposition, destination and reason." },
        { key: "review",    title: "Review & submit",     hint: "Confirm and complete discharge." },
      ];
    case "predischarge":
      return [
        { key: "identify", title: "Identify admission", hint: "Which admission are we reviewing?" },
        { key: "run",      title: "Review outcome",     hint: "Blocking, warning and informational items." },
      ];
    case "undischarge":
      return [
        { key: "identify", title: "Identify admission", hint: "Reversal is for Emergency Unit only." },
        { key: "approval", title: "Approval & reason",  hint: "Elevated approver and reason required." },
        { key: "location", title: "Receiving location", hint: "Where does the patient return to?" },
        { key: "review",   title: "Review & submit",    hint: "Confirm reversal." },
      ];
    case "cancel-admission":
    case "discontinue":
      return [
        { key: "identify", title: "Identify admission", hint: "Which admission are we stopping?" },
        { key: "reason",   title: "Reason & approver",  hint: "Elevated permission required." },
        { key: "review",   title: "Review & submit",    hint: "Confirm action — this is destructive." },
      ];
    case "amend-admission":
      return [
        { key: "identify", title: "Identify admission", hint: "Which admission needs correction?" },
        { key: "changes",  title: "Field changes",      hint: "Only fill fields you are correcting." },
        { key: "reason",   title: "Reason & approver",  hint: "Amendments are audited." },
        { key: "review",   title: "Review & submit",    hint: "Confirm changes to be applied." },
      ];
    case "notes-documents":
      return [
        { key: "identify", title: "Identify admission", hint: "Where does this note or document belong?" },
        { key: "kind",     title: "Note or document",   hint: "Pick the kind of item to attach." },
        { key: "details",  title: "Details",            hint: "Capture the note body or document metadata." },
        { key: "review",   title: "Review & submit",    hint: "Confirm before attaching." },
      ];
  }
}

type Props = {
  variant: DepartureVariant | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCompleted?: () => void;
  /** When opened from an Admission Workspace, prefill the admission id. */
  initialAdmissionId?: string;
  /** Latest server version token; sent as ifMatchVersion for optimistic concurrency. */
  ifMatchVersion?: string;
};

export function AdmissionDepartureWizard({ variant, open, onOpenChange, onCompleted, initialAdmissionId, ifMatchVersion }: Props) {
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

  if (!variant || !meta) return null;

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const currentStep = steps[stepIdx];
  const isLast = stepIdx === steps.length - 1;

  const overrideMap = new Map(draft.overrideChecks.map((o) => [o.itemId, o]));
  const blockingOpen = draft.review?.items.filter((i) => i.severity === "Blocking" && i.status === "Open") ?? [];
  const overrideComplete = (o: OverrideEntry | undefined) => !!o && !!o.reason.trim() && !!o.approverId.trim();
  const readyForDischarge = blockingOpen.length === 0
    || blockingOpen.every((i) => overrideComplete(overrideMap.get(i.itemId)));

  const runReview = async () => {
    if (!draft.admissionId.trim()) return;
    setDraft((d) => ({ ...d, reviewLoading: true }));
    const r = await admissionsService.preDischargeReview(draft.admissionId);
    setDraft((d) => ({ ...d, reviewLoading: false, review: r.ok ? r.data : null }));
    if (!r.ok) setProblem(r.problem.detail ?? r.problem.title);
  };

  // Auto-run pre-discharge review whenever the user reaches the readiness/run step.
  useEffect(() => {
    if (!currentStep) return;
    if ((currentStep.key === "readiness" || currentStep.key === "run")
        && draft.admissionId && !draft.review && !draft.reviewLoading) {
      void runReview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep?.key, draft.admissionId]);

  const dispositionValid = (() => {
    if (draft.disposition === "Transfer out" || draft.disposition === "Step-down facility") {
      return !!draft.transferToFacility.trim();
    }
    if (draft.disposition === "Deceased") {
      return !!draft.deathDateOfDeath && !!draft.deathCauseOfDeath.trim() && !!draft.deathCertifiedBy.trim();
    }
    return true;
  })();

  const canAdvance = (() => {
    if (!currentStep) return false;
    switch (currentStep.key) {
      case "identify": return !!draft.admissionId.trim();
      case "readiness": return readyForDischarge;
      case "capture":
        return !!draft.dischargeAt && !!draft.disposition && !!draft.dischargeReason.trim()
          && !!draft.responsiblePractitionerId.trim() && dispositionValid;
      case "run": return !!draft.review;
      case "approval":
        return !!draft.approverId.trim() && !!draft.reason.trim() && !!draft.correctionAt;
      case "location": return !!draft.receivingWardId.trim();
      case "reason":
        return !!draft.reason.trim() && (variant === "amend-admission" || !!draft.approverId.trim() || variant === "discontinue" || variant === "cancel-admission");
      case "changes":
        return Object.values(draft.amend).some((v) => (v ?? "").toString().trim() !== "");
      case "kind": return draft.nd === "note" || draft.nd === "document";
      case "details":
        return draft.nd === "note"
          ? !!draft.noteBody.trim()
          : !!draft.docKind && !!draft.docFilename.trim();
      case "review": return true;
      default: return true;
    }
  })();

  const setOverride = (itemId: string, patch: Partial<OverrideEntry>) =>
    setDraft((d) => {
      const idx = d.overrideChecks.findIndex((o) => o.itemId === itemId);
      const existing = idx >= 0 ? d.overrideChecks[idx] : { itemId, reason: "", approverId: "" };
      const next = { ...existing, ...patch };
      const list = idx >= 0
        ? d.overrideChecks.map((o, i) => (i === idx ? next : o))
        : [...d.overrideChecks, next];
      return { ...d, overrideChecks: list };
    });
  const toggleOverride = (itemId: string) =>
    setDraft((d) => {
      const exists = d.overrideChecks.some((o) => o.itemId === itemId);
      return {
        ...d,
        overrideChecks: exists
          ? d.overrideChecks.filter((o) => o.itemId !== itemId)
          : [...d.overrideChecks, { itemId, reason: "", approverId: "" }],
      };
    });

  const submit = async () => {
    setSubmitting(true); setProblem(null);
    try {
      let ok = false; let correlationId: string | undefined;
      if (variant === "discharge") {
        const req: DischargeAdmissionRequest = {
          admissionId: draft.admissionId,
          dischargeAt: draft.dischargeAt,
          disposition: draft.disposition,
          destination: draft.destination || undefined,
          dischargeReason: draft.dischargeReason,
          responsiblePractitionerId: draft.responsiblePractitionerId,
          clinicalSummary: draft.clinicalSummary || undefined,
          overrideChecks: draft.overrideChecks.length ? draft.overrideChecks : undefined,
        };
        const r = await admissionsService.dischargeAdmission(req);
        ok = r.ok; correlationId = r.correlationId;
        if (!r.ok) setProblem(r.problem.detail ?? r.problem.title);
      } else if (variant === "predischarge") {
        // Review is read-only; treat submit as acknowledgement.
        ok = true;
      } else if (variant === "undischarge") {
        const req: UndischargeAdmissionRequest = {
          admissionId: draft.admissionId,
          reason: draft.reason,
          approverId: draft.approverId,
          correctionAt: draft.correctionAt,
          receivingWardId: draft.receivingWardId || undefined,
          receivingBedId: draft.receivingBedId || undefined,
        };
        const r = await admissionsService.undischargeAdmission(req);
        ok = r.ok; correlationId = r.correlationId;
        if (!r.ok) setProblem(r.problem.detail ?? r.problem.title);
      } else if (variant === "cancel-admission") {
        const req: CancelAdmissionRequest = {
          admissionId: draft.admissionId,
          reason: draft.reason,
          approverId: draft.approverId || undefined,
        };
        const r = await admissionsService.cancelAdmission(req);
        ok = r.ok; correlationId = r.correlationId;
        if (!r.ok) setProblem(r.problem.detail ?? r.problem.title);
      } else if (variant === "discontinue") {
        const req: DiscontinueAdmissionRequest = {
          admissionId: draft.admissionId,
          reason: draft.reason,
          approverId: draft.approverId || undefined,
          effectiveAt: draft.effectiveAt,
        };
        const r = await admissionsService.discontinueAdmission(req);
        ok = r.ok; correlationId = r.correlationId;
        if (!r.ok) setProblem(r.problem.detail ?? r.problem.title);
      } else if (variant === "amend-admission") {
        const changes: AmendAdmissionRequest["changes"] = {};
        const a = draft.amend;
        if (a.admissionType) changes.admissionType = a.admissionType as AmendAdmissionRequest["changes"]["admissionType"];
        if (a.admissionSource) changes.admissionSource = a.admissionSource as AmendAdmissionRequest["changes"]["admissionSource"];
        if (a.admissionDate) changes.admissionDate = a.admissionDate;
        if (a.expectedDeparture) changes.expectedDeparture = a.expectedDeparture;
        if (a.reasonForAdmission) changes.reasonForAdmission = a.reasonForAdmission;
        if (a.admittingPractitionerId) changes.admittingPractitionerId = a.admittingPractitionerId;
        if (a.responsiblePractitionerId) changes.responsiblePractitionerId = a.responsiblePractitionerId;
        if (a.admissionDiagnosis) changes.admissionDiagnosis = a.admissionDiagnosis;
        const req: AmendAdmissionRequest = {
          admissionId: draft.admissionId,
          reason: draft.reason,
          approverId: draft.approverId || undefined,
          changes,
        };
        const r = await admissionsService.amendAdmission(req);
        ok = r.ok; correlationId = r.correlationId;
        if (!r.ok) setProblem(r.problem.detail ?? r.problem.title);
      } else if (variant === "notes-documents") {
        if (draft.nd === "note") {
          const req: AddAdmissionNoteRequest = {
            admissionId: draft.admissionId,
            category: draft.noteCategory,
            body: draft.noteBody,
            visibility: draft.notePatientVisible ? "PatientVisible" : "Internal",
          };
          const r = await admissionsService.addAdmissionNote(req);
          ok = r.ok; correlationId = r.correlationId;
          if (!r.ok) setProblem(r.problem.detail ?? r.problem.title);
        } else {
          const req: AttachAdmissionDocumentRequest = {
            admissionId: draft.admissionId,
            kind: draft.docKind,
            filename: draft.docFilename,
            description: draft.docDescription || undefined,
          };
          const r = await admissionsService.attachAdmissionDocument(req);
          ok = r.ok; correlationId = r.correlationId;
          if (!r.ok) setProblem(r.problem.detail ?? r.problem.title);
        }
      }
      if (ok) {
        toast.success(`${meta.title} — submitted`, {
          description: correlationId ? `Ref ${correlationId.slice(0, 8)}` : undefined,
        });
        onCompleted?.(); onOpenChange(false);
      }
    } finally { setSubmitting(false); }
  };

  const Icon = meta.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0">
        <div className={cn("relative bg-gradient-to-br px-6 py-5", meta.accent)}>
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-background/80 ring-1 ring-border shadow-sm">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-lg">{meta.title}</DialogTitle>
                <DialogDescription className="text-xs">{meta.blurb}</DialogDescription>
              </div>
              {meta.elevated && (
                <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-[10px] text-amber-700 dark:text-amber-300">
                  <ShieldAlert className="mr-1 h-3 w-3" />Elevated
                </Badge>
              )}
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

          {currentStep?.key === "readiness" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Run the pre-discharge review to see outstanding items.
                </div>
                <Button size="sm" variant="outline" onClick={runReview} disabled={draft.reviewLoading || !draft.admissionId}>
                  {draft.reviewLoading ? <><Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />Loading…</> : "Run review"}
                </Button>
              </div>
              {draft.review && <ReviewList review={draft.review} overrides={draft.overrideChecks} onToggleOverride={toggleOverride} />}
              {!draft.review && !draft.reviewLoading && (
                <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                  No review data yet — click <b>Run review</b>.
                </div>
              )}
            </div>
          )}

          {currentStep?.key === "capture" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Discharge date/time" required>
                <Input type="datetime-local" value={draft.dischargeAt} onChange={(e) => set("dischargeAt", e.target.value)} />
              </Field>
              <Field label="Disposition" required>
                <SelectBox value={draft.disposition} onChange={(v) => set("disposition", v as Disposition)}
                  options={DISPOSITIONS.map((d) => ({ value: d, label: d }))} />
              </Field>
              <Field label="Destination">
                <Input value={draft.destination} onChange={(e) => set("destination", e.target.value)} placeholder="Home / Step-down / Facility name" />
              </Field>
              <Field label="Responsible practitioner" required>
                <Input value={draft.responsiblePractitionerId} onChange={(e) => set("responsiblePractitionerId", e.target.value)} placeholder="Dr Naidoo" />
              </Field>
              <Field label="Discharge reason" required className="sm:col-span-2">
                <Textarea rows={2} value={draft.dischargeReason} onChange={(e) => set("dischargeReason", e.target.value)} placeholder="Clinical reason for discharge." />
              </Field>
              <Field label="Clinical summary" className="sm:col-span-2">
                <Textarea rows={3} value={draft.clinicalSummary} onChange={(e) => set("clinicalSummary", e.target.value)} placeholder="Optional summary that supports the discharge." />
              </Field>
            </div>
          )}

          {currentStep?.key === "run" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">Read-only review of pre-discharge readiness.</div>
                <Button size="sm" variant="outline" onClick={runReview} disabled={draft.reviewLoading || !draft.admissionId}>
                  {draft.reviewLoading ? <><Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />Loading…</> : draft.review ? "Refresh" : "Run review"}
                </Button>
              </div>
              {draft.review
                ? <ReviewList review={draft.review} />
                : !draft.reviewLoading && (
                  <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                    Click <b>Run review</b> to load outstanding items.
                  </div>
                )}
            </div>
          )}

          {currentStep?.key === "approval" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Approver" required>
                <Input value={draft.approverId} onChange={(e) => set("approverId", e.target.value)} placeholder="Manager / delegate" />
              </Field>
              <Field label="Correction date/time" required>
                <Input type="datetime-local" value={draft.correctionAt} onChange={(e) => set("correctionAt", e.target.value)} />
              </Field>
              <Field label="Reason" required className="sm:col-span-2">
                <Textarea rows={3} value={draft.reason} onChange={(e) => set("reason", e.target.value)} placeholder="Why the discharge is being reversed." />
              </Field>
            </div>
          )}

          {currentStep?.key === "location" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Receiving ward" required>
                <Input value={draft.receivingWardId} onChange={(e) => set("receivingWardId", e.target.value)} placeholder="e.g. EU Observation" />
              </Field>
              <Field label="Receiving bed">
                <Input value={draft.receivingBedId} onChange={(e) => set("receivingBedId", e.target.value)} placeholder="e.g. OB-04" />
              </Field>
            </div>
          )}

          {currentStep?.key === "reason" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Approver" required={variant !== "amend-admission"}>
                <Input value={draft.approverId} onChange={(e) => set("approverId", e.target.value)} placeholder="Manager / delegate" />
              </Field>
              {variant === "discontinue" && (
                <Field label="Effective at" required>
                  <Input type="datetime-local" value={draft.effectiveAt} onChange={(e) => set("effectiveAt", e.target.value)} />
                </Field>
              )}
              <Field label="Reason" required className="sm:col-span-2">
                <Textarea rows={3} value={draft.reason} onChange={(e) => set("reason", e.target.value)}
                  placeholder={variant === "amend-admission" ? "Why this correction is being made." : "Why this admission is being stopped."} />
              </Field>
            </div>
          )}

          {currentStep?.key === "changes" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Admission type">
                <Input value={draft.amend.admissionType} onChange={(e) => set("amend", { ...draft.amend, admissionType: e.target.value })} placeholder="e.g. Inpatient" />
              </Field>
              <Field label="Admission source">
                <Input value={draft.amend.admissionSource} onChange={(e) => set("amend", { ...draft.amend, admissionSource: e.target.value })} placeholder="e.g. Preadmission" />
              </Field>
              <Field label="Admission date">
                <Input type="date" value={draft.amend.admissionDate} onChange={(e) => set("amend", { ...draft.amend, admissionDate: e.target.value })} />
              </Field>
              <Field label="Expected departure">
                <Input type="date" value={draft.amend.expectedDeparture} onChange={(e) => set("amend", { ...draft.amend, expectedDeparture: e.target.value })} />
              </Field>
              <Field label="Reason for admission" className="sm:col-span-2">
                <Textarea rows={2} value={draft.amend.reasonForAdmission} onChange={(e) => set("amend", { ...draft.amend, reasonForAdmission: e.target.value })} />
              </Field>
              <Field label="Admitting practitioner">
                <Input value={draft.amend.admittingPractitionerId} onChange={(e) => set("amend", { ...draft.amend, admittingPractitionerId: e.target.value })} />
              </Field>
              <Field label="Responsible practitioner">
                <Input value={draft.amend.responsiblePractitionerId} onChange={(e) => set("amend", { ...draft.amend, responsiblePractitionerId: e.target.value })} />
              </Field>
              <Field label="Admission diagnosis" className="sm:col-span-2">
                <Input value={draft.amend.admissionDiagnosis} onChange={(e) => set("amend", { ...draft.amend, admissionDiagnosis: e.target.value })} placeholder="Primary diagnosis text" />
              </Field>
            </div>
          )}

          {currentStep?.key === "kind" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => set("nd", "note")}
                className={cn("rounded-lg border p-4 text-left transition",
                  draft.nd === "note" ? "border-primary bg-primary/5 ring-1 ring-primary/40" : "hover:bg-muted/40")}>
                <MessageSquare className="mb-2 h-5 w-5 text-primary" />
                <div className="text-sm font-medium">Add a note</div>
                <div className="text-xs text-muted-foreground">Clinical, administrative, billing or case-management note.</div>
              </button>
              <button type="button" onClick={() => set("nd", "document")}
                className={cn("rounded-lg border p-4 text-left transition",
                  draft.nd === "document" ? "border-primary bg-primary/5 ring-1 ring-primary/40" : "hover:bg-muted/40")}>
                <Paperclip className="mb-2 h-5 w-5 text-primary" />
                <div className="text-sm font-medium">Attach a document</div>
                <div className="text-xs text-muted-foreground">Discharge summary, consent, referral, script and more.</div>
              </button>
            </div>
          )}

          {currentStep?.key === "details" && draft.nd === "note" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Category">
                <SelectBox value={draft.noteCategory} onChange={(v) => set("noteCategory", v as Draft["noteCategory"])}
                  options={NOTE_CATEGORIES.map((c) => ({ value: c, label: c }))} />
              </Field>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-xs">
                  <Checkbox checked={draft.notePatientVisible} onCheckedChange={(v) => set("notePatientVisible", !!v)} />
                  Visible to patient portal
                </label>
              </div>
              <Field label="Note body" required className="sm:col-span-2">
                <Textarea rows={5} value={draft.noteBody} onChange={(e) => set("noteBody", e.target.value)} placeholder="Enter the note content." />
              </Field>
            </div>
          )}

          {currentStep?.key === "details" && draft.nd === "document" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Kind" required>
                <SelectBox value={draft.docKind} onChange={(v) => set("docKind", v)}
                  options={DOC_KINDS.map((k) => ({ value: k, label: k }))} />
              </Field>
              <Field label="Filename" required>
                <Input value={draft.docFilename} onChange={(e) => set("docFilename", e.target.value)} placeholder="discharge-summary.pdf" />
              </Field>
              <Field label="Description" className="sm:col-span-2">
                <Textarea rows={3} value={draft.docDescription} onChange={(e) => set("docDescription", e.target.value)} placeholder="Optional context for this document." />
              </Field>
              <div className="sm:col-span-2 rounded-lg border border-dashed bg-muted/20 p-3 text-[11px] text-muted-foreground">
                In this preview build the file itself is not uploaded — only its metadata is recorded against the admission audit trail.
              </div>
            </div>
          )}

          {currentStep?.key === "review" && (
            <ReviewSummary draft={draft} variant={variant} today={todayDate()} />
          )}

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
              <Button
                size="sm"
                variant={meta.destructive ? "destructive" : "default"}
                disabled={!canAdvance || submitting}
                onClick={submit}
              >
                {submitting ? "Submitting…" : variant === "predischarge" ? "Acknowledge" : "Submit"}
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

function SeverityBadge({ severity }: { severity: PreDischargeReviewItem["severity"] }) {
  const tone = severity === "Blocking"
    ? "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300"
    : severity === "Warning"
    ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
    : "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300";
  return <Badge variant="outline" className={cn("text-[10px]", tone)}>{severity}</Badge>;
}

function ReviewList({
  review, overrides, onToggleOverride,
}: {
  review: PreDischargeReviewResult;
  overrides?: string[];
  onToggleOverride?: (id: string) => void;
}) {
  const toneForReadiness =
    review.readiness === "Ready" ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
    : review.readiness === "Blocked" ? "border-rose-500/40 bg-rose-500/5 text-rose-700 dark:text-rose-300"
    : "border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-300";
  return (
    <div className="space-y-3">
      <div className={cn("flex items-center justify-between rounded-lg border p-3 text-xs", toneForReadiness)}>
        <div className="flex items-center gap-2 font-medium">
          <ClipboardList className="h-3.5 w-3.5" />
          Readiness: {review.readiness}
        </div>
        <div>Score {review.readinessScore}/100</div>
      </div>
      <div className="space-y-2">
        {review.items.map((it) => {
          const isOverridable = it.severity === "Blocking" && !!onToggleOverride;
          const overridden = overrides?.includes(it.itemId) ?? false;
          return (
            <div key={it.itemId} className={cn("flex items-start gap-3 rounded-lg border p-3 text-xs",
              overridden && "border-emerald-500/40 bg-emerald-500/5")}>
              {isOverridable && (
                <Checkbox checked={overridden} onCheckedChange={() => onToggleOverride?.(it.itemId)} />
              )}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityBadge severity={it.severity} />
                  <Badge variant="outline" className="text-[10px]">{it.category}</Badge>
                  <span className="font-medium">{it.title}</span>
                </div>
                <div className="text-muted-foreground">{it.description}</div>
                {it.owner && <div className="mt-0.5 text-[10px] text-muted-foreground">Owner: {it.owner}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewSummary({ draft, variant, today }: { draft: Draft; variant: DepartureVariant; today: string }) {
  const rows: Array<[string, string]> = (() => {
    switch (variant) {
      case "discharge":
        return [
          ["Admission", draft.admissionId],
          ["Discharge at", draft.dischargeAt],
          ["Disposition", draft.disposition],
          ["Destination", draft.destination || "—"],
          ["Responsible practitioner", draft.responsiblePractitionerId],
          ["Overrides", draft.overrideChecks.length ? draft.overrideChecks.join(", ") : "None"],
          ["Reason", draft.dischargeReason],
        ];
      case "predischarge":
        return [
          ["Admission", draft.admissionId],
          ["Reviewed at", draft.review?.reviewedAt ?? today],
          ["Readiness", draft.review?.readiness ?? "—"],
          ["Open items", String(draft.review?.items.filter((i) => i.status === "Open").length ?? 0)],
        ];
      case "undischarge":
        return [
          ["Admission", draft.admissionId],
          ["Correction at", draft.correctionAt],
          ["Approver", draft.approverId],
          ["Receiving location", [draft.receivingWardId, draft.receivingBedId].filter(Boolean).join(" · ") || "—"],
          ["Reason", draft.reason],
        ];
      case "cancel-admission":
        return [
          ["Admission", draft.admissionId],
          ["Approver", draft.approverId || "—"],
          ["Reason", draft.reason],
        ];
      case "discontinue":
        return [
          ["Admission", draft.admissionId],
          ["Effective at", draft.effectiveAt],
          ["Approver", draft.approverId || "—"],
          ["Reason", draft.reason],
        ];
      case "amend-admission": {
        const filled = Object.entries(draft.amend).filter(([, v]) => (v ?? "").toString().trim() !== "");
        return [
          ["Admission", draft.admissionId],
          ["Approver", draft.approverId || "—"],
          ["Reason", draft.reason],
          ["Fields changed", filled.length ? filled.map(([k]) => k).join(", ") : "None"],
        ];
      }
      case "notes-documents":
        return draft.nd === "note"
          ? [
              ["Admission", draft.admissionId],
              ["Kind", "Note"],
              ["Category", draft.noteCategory],
              ["Visibility", draft.notePatientVisible ? "Patient-visible" : "Internal"],
              ["Body", draft.noteBody],
            ]
          : [
              ["Admission", draft.admissionId],
              ["Kind", "Document"],
              ["Document type", draft.docKind],
              ["Filename", draft.docFilename],
              ["Description", draft.docDescription || "—"],
            ];
    }
  })();
  const Icon = META[variant].icon;
  const meta = META[variant];
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
            <dd className="col-span-2 font-medium whitespace-pre-wrap">{v || "—"}</dd>
          </div>
        ))}
      </dl>
      <div className="flex items-center gap-2 border-t bg-muted/10 px-3 py-2 text-[11px] text-muted-foreground">
        {meta.destructive
          ? <><ShieldAlert className="h-3 w-3 text-rose-500" />This is a destructive action. It is recorded on the audit trail with the approver.</>
          : variant === "predischarge"
          ? <><CheckCircle2 className="h-3 w-3 text-emerald-500" />Acknowledgement is logged against the admission timeline.</>
          : <><ShieldCheck className="h-3 w-3 text-emerald-500" />Ready to submit — you can amend from the admission workspace.</>}
      </div>
    </div>
  );
}
