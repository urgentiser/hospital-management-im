/**
 * Admission Funding & Authorisation cluster — Phase E.
 *
 * Typed guided wizards for §7 of the Admissions upgrade spec:
 *  - capture-auth      — record / link an authorisation for an admission
 *  - funding-change    — change funding method, scheme or guarantor details
 *  - auth-enquiry      — read-only authorisation enquiry across facilities
 *
 * All three variants share the premium dialog scaffold used by the creation
 * and management wizards, dispatch through the typed `admissionsService`,
 * and surface RFC-7807 problems without leaking backend contracts.
 */
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, AlertTriangle, Check, CheckCircle2, ShieldAlert,
  Wallet, Search as SearchIcon, X, FileSearch, CalendarClock, Building2,
  BadgeCheck,
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { FACILITIES } from "@/lib/facility-context";
import { admissionsService } from "@/services/modules/admissions.service";
import type {
  AuthorisationStatus, CaptureAuthorisationRequest, ChangeFundingRequest,
  FundingMethod, NoAuthReason,
} from "@/modules/admissions/contracts";

export type FundingVariant = "capture-auth" | "funding-change" | "auth-enquiry";

const META: Record<FundingVariant, { title: string; blurb: string; icon: typeof ShieldAlert; accent: string }> = {
  "capture-auth":   { title: "Capture authorisation", blurb: "Record or link an authorisation for an active admission.", icon: ShieldAlert, accent: "from-amber-500/25 to-transparent" },
  "funding-change": { title: "Change funding",        blurb: "Update funding method, scheme or guarantor details.",      icon: Wallet,      accent: "from-fuchsia-500/25 to-transparent" },
  "auth-enquiry":   { title: "Authorisation enquiry", blurb: "Look up authorisations across facilities and schemes.",    icon: FileSearch,  accent: "from-sky-500/25 to-transparent" },
};

const FUNDING_METHODS: FundingMethod[] = [
  "MedicalScheme", "Insurance", "COID", "SelfPay", "Guarantor", "Other",
];
const AUTH_STATUSES: AuthorisationStatus[] = [
  "NotRequested", "Pending", "Approved", "Rejected", "Expired", "MoreInfo",
];
const NO_AUTH_REASONS: NoAuthReason[] = [
  "NotRequested", "Pending", "Rejected", "ProviderUnavailable", "EmergencyException", "InsufficientInformation",
];

type Draft = {
  admissionId: string;
  facilityId: string;
  // Auth
  authorisationNumber: string;
  status: AuthorisationStatus;
  scheme: string;
  administrator: string;
  requestedFrom: string;
  requestedTo: string;
  approvedFrom: string;
  approvedTo: string;
  requestedTreatment: string;
  approvedTreatment: string;
  expiry: string;
  noAuthReason: NoAuthReason | "";
  followUpOwnerId: string;
  followUpDate: string;
  notes: string;
  // Funding
  method: FundingMethod;
  planOption: string;
  membershipNumber: string;
  dependantCode: string;
  principalMemberName: string;
  effectiveDate: string;
  reason: string;
  // Enquiry
  enquiryQuery: string;
};

const today = () => new Date().toISOString().slice(0, 10);

const EMPTY: Draft = {
  admissionId: "", facilityId: FACILITIES[0] ?? "",
  authorisationNumber: "", status: "Pending", scheme: "", administrator: "",
  requestedFrom: today(), requestedTo: today(), approvedFrom: "", approvedTo: "",
  requestedTreatment: "", approvedTreatment: "", expiry: "", noAuthReason: "",
  followUpOwnerId: "", followUpDate: "", notes: "",
  method: "MedicalScheme", planOption: "", membershipNumber: "", dependantCode: "",
  principalMemberName: "", effectiveDate: today(), reason: "",
  enquiryQuery: "",
};

type StepDef = { key: string; title: string; hint: string };

function stepsFor(variant: FundingVariant): StepDef[] {
  switch (variant) {
    case "capture-auth":
      return [
        { key: "identify", title: "Identify admission", hint: "Which admission are we authorising?" },
        { key: "auth", title: "Authorisation details", hint: "Number, scheme and stay approvals." },
        { key: "outcome", title: "Outcome & follow-up", hint: "Status, expiry and no-auth handling." },
        { key: "review", title: "Review & submit", hint: "Confirm and save the authorisation." },
      ];
    case "funding-change":
      return [
        { key: "identify", title: "Identify admission", hint: "Which admission are we updating?" },
        { key: "funding", title: "New funding", hint: "Method, scheme and membership." },
        { key: "reason", title: "Reason", hint: "Why the funding is changing." },
        { key: "review", title: "Review & submit", hint: "Confirm the funding change." },
      ];
    case "auth-enquiry":
      return [{ key: "enquiry", title: "Search authorisations", hint: "By number, member, scheme or admission." }];
  }
}

type Props = { variant: FundingVariant | null; open: boolean; onOpenChange: (v: boolean) => void; onCompleted?: () => void };

const MOCK_AUTHS = [
  { auth: "AUTH-88213", member: "Discovery · 1129223", patient: "Naledi Mokoena", stay: "2026-07-18 → 2026-07-25", status: "Approved" },
  { auth: "AUTH-88410", member: "Bonitas · 4432109", patient: "Sipho Dlamini", stay: "2026-07-20 → 2026-07-22", status: "PartiallyApproved" },
  { auth: "AUTH-88615", member: "GEMS · 9911872", patient: "Aisha Patel", stay: "2026-07-19 → —", status: "Pending" },
  { auth: "AUTH-88802", member: "Momentum · 5501129", patient: "Jared Coetzee", stay: "2026-07-14 → 2026-07-16", status: "Rejected" },
];

export function AdmissionFundingWizard({ variant, open, onOpenChange, onCompleted }: Props) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [stepIdx, setStepIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const steps = useMemo(() => (variant ? stepsFor(variant) : []), [variant]);
  const meta = variant ? META[variant] : null;

  useEffect(() => { if (open) { setDraft(EMPTY); setStepIdx(0); setProblem(null); } }, [open, variant]);

  if (!variant || !meta) return null;

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const currentStep = steps[stepIdx];
  const isLast = stepIdx === steps.length - 1;

  const enquiryResults = draft.enquiryQuery.trim()
    ? MOCK_AUTHS.filter((r) => `${r.auth} ${r.member} ${r.patient}`.toLowerCase().includes(draft.enquiryQuery.toLowerCase()))
    : MOCK_AUTHS;

  const canAdvance = (() => {
    if (!currentStep) return false;
    switch (currentStep.key) {
      case "identify": return !!draft.admissionId.trim();
      case "auth": return !!draft.status && (draft.status === "NotRequested" ? true : !!draft.scheme.trim());
      case "outcome": return draft.status === "NotRequested" || draft.status === "Rejected" ? !!draft.noAuthReason : true;
      case "funding": return !!draft.method && (draft.method === "SelfPay" ? true : !!draft.scheme.trim() && !!draft.membershipNumber.trim());
      case "reason": return !!draft.reason.trim();
      case "enquiry": return true;
      case "review": return true;
      default: return true;
    }
  })();

  const submit = async () => {
    if (variant === "auth-enquiry") {
      toast.success("Enquiry complete", { description: `${enquiryResults.length} result(s)` });
      onCompleted?.(); onOpenChange(false); return;
    }
    setSubmitting(true); setProblem(null);
    try {
      let r;
      if (variant === "capture-auth") {
        const req: CaptureAuthorisationRequest = {
          admissionId: draft.admissionId,
          authorisationNumber: draft.authorisationNumber || undefined,
          status: draft.status,
          scheme: draft.scheme || undefined,
          administrator: draft.administrator || undefined,
          requestedStay: draft.requestedFrom && draft.requestedTo
            ? { from: draft.requestedFrom, to: draft.requestedTo } : undefined,
          approvedStay: draft.approvedFrom && draft.approvedTo
            ? { from: draft.approvedFrom, to: draft.approvedTo } : undefined,
          requestedTreatment: draft.requestedTreatment || undefined,
          approvedTreatment: draft.approvedTreatment || undefined,
          expiry: draft.expiry || undefined,
          noAuthReason: draft.noAuthReason || undefined,
          followUpOwnerId: draft.followUpOwnerId || undefined,
          followUpDate: draft.followUpDate || undefined,
          notes: draft.notes || undefined,
        };
        r = await admissionsService.captureAuthorisation(req);
      } else {
        const req: ChangeFundingRequest = {
          admissionId: draft.admissionId,
          method: draft.method,
          scheme: draft.scheme || undefined,
          administrator: draft.administrator || undefined,
          planOption: draft.planOption || undefined,
          membershipNumber: draft.membershipNumber || undefined,
          dependantCode: draft.dependantCode || undefined,
          principalMemberName: draft.principalMemberName || undefined,
          effectiveDate: draft.effectiveDate || undefined,
          reason: draft.reason,
        };
        r = await admissionsService.changeFunding(req);
      }
      if (!r.ok) { setProblem(r.problem.detail ?? r.problem.title); return; }
      toast.success(`${meta.title} — submitted`, { description: `Ref ${r.correlationId?.slice(0, 8)}` });
      onCompleted?.(); onOpenChange(false);
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

          {currentStep?.key === "auth" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Authorisation number">
                <Input value={draft.authorisationNumber} onChange={(e) => set("authorisationNumber", e.target.value)} placeholder="AUTH-…" />
              </Field>
              <Field label="Status" required>
                <SelectBox value={draft.status} onChange={(v) => set("status", v as AuthorisationStatus)}
                  options={AUTH_STATUSES.map((s) => ({ value: s, label: s }))} />
              </Field>
              <Field label="Scheme" required={draft.status !== "None"}>
                <Input value={draft.scheme} onChange={(e) => set("scheme", e.target.value)} placeholder="e.g. Discovery Health" />
              </Field>
              <Field label="Administrator">
                <Input value={draft.administrator} onChange={(e) => set("administrator", e.target.value)} placeholder="e.g. Discovery" />
              </Field>
              <Field label="Requested from">
                <Input type="date" value={draft.requestedFrom} onChange={(e) => set("requestedFrom", e.target.value)} />
              </Field>
              <Field label="Requested to">
                <Input type="date" value={draft.requestedTo} onChange={(e) => set("requestedTo", e.target.value)} />
              </Field>
              <Field label="Approved from">
                <Input type="date" value={draft.approvedFrom} onChange={(e) => set("approvedFrom", e.target.value)} />
              </Field>
              <Field label="Approved to">
                <Input type="date" value={draft.approvedTo} onChange={(e) => set("approvedTo", e.target.value)} />
              </Field>
              <Field label="Requested treatment" className="sm:col-span-2">
                <Textarea rows={2} value={draft.requestedTreatment} onChange={(e) => set("requestedTreatment", e.target.value)} placeholder="ICD-10, procedure or narrative." />
              </Field>
              <Field label="Approved treatment" className="sm:col-span-2">
                <Textarea rows={2} value={draft.approvedTreatment} onChange={(e) => set("approvedTreatment", e.target.value)} placeholder="What the funder approved." />
              </Field>
            </div>
          )}

          {currentStep?.key === "outcome" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Expiry">
                <Input type="date" value={draft.expiry} onChange={(e) => set("expiry", e.target.value)} />
              </Field>
              <Field label="No-auth reason" required={draft.status === "NotRequested" || draft.status === "Rejected"}>
                <SelectBox value={draft.noAuthReason || ""} onChange={(v) => set("noAuthReason", v as NoAuthReason)}
                  options={[{ value: "", label: "— none —" }, ...NO_AUTH_REASONS.map((s) => ({ value: s, label: s }))]} />
              </Field>
              <Field label="Follow-up owner">
                <Input value={draft.followUpOwnerId} onChange={(e) => set("followUpOwnerId", e.target.value)} placeholder="User or team" />
              </Field>
              <Field label="Follow-up date">
                <Input type="date" value={draft.followUpDate} onChange={(e) => set("followUpDate", e.target.value)} />
              </Field>
              <Field label="Notes" className="sm:col-span-2">
                <Textarea rows={3} value={draft.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Context for the case management team." />
              </Field>
            </div>
          )}

          {currentStep?.key === "funding" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Funding method" required>
                <SelectBox value={draft.method} onChange={(v) => set("method", v as FundingMethod)}
                  options={FUNDING_METHODS.map((m) => ({ value: m, label: m }))} />
              </Field>
              <Field label="Effective date">
                <Input type="date" value={draft.effectiveDate} onChange={(e) => set("effectiveDate", e.target.value)} />
              </Field>
              <Field label="Scheme" required={draft.method !== "SelfPay"}>
                <Input value={draft.scheme} onChange={(e) => set("scheme", e.target.value)} placeholder="e.g. Discovery Health" />
              </Field>
              <Field label="Plan / option">
                <Input value={draft.planOption} onChange={(e) => set("planOption", e.target.value)} placeholder="e.g. Classic Comprehensive" />
              </Field>
              <Field label="Membership number" required={draft.method !== "SelfPay"}>
                <Input value={draft.membershipNumber} onChange={(e) => set("membershipNumber", e.target.value)} placeholder="e.g. 1129223" />
              </Field>
              <Field label="Dependant code">
                <Input value={draft.dependantCode} onChange={(e) => set("dependantCode", e.target.value)} placeholder="e.g. 01" />
              </Field>
              <Field label="Principal member" className="sm:col-span-2">
                <Input value={draft.principalMemberName} onChange={(e) => set("principalMemberName", e.target.value)} placeholder="Full name of principal member" />
              </Field>
            </div>
          )}

          {currentStep?.key === "reason" && (
            <Field label="Reason for change" required>
              <Textarea rows={4} value={draft.reason} onChange={(e) => set("reason", e.target.value)} placeholder="Why funding is changing (e.g. scheme rejection, patient election)." />
            </Field>
          )}

          {currentStep?.key === "enquiry" && (
            <div className="space-y-3">
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8" value={draft.enquiryQuery} onChange={(e) => set("enquiryQuery", e.target.value)} placeholder="Search by auth #, member, scheme or patient" />
              </div>
              <div className="grid gap-2">
                {enquiryResults.map((r) => (
                  <div key={r.auth} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                        <BadgeCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{r.auth} · {r.patient}</div>
                        <div className="text-muted-foreground">{r.member} · <CalendarClock className="inline h-3 w-3" /> {r.stay}</div>
                      </div>
                    </div>
                    <StatusBadge status={r.status as AuthorisationStatus} />
                  </div>
                ))}
                {enquiryResults.length === 0 && (
                  <div className="rounded-lg border bg-muted/10 p-4 text-center text-xs text-muted-foreground">
                    No authorisations match your search.
                  </div>
                )}
              </div>
              <div className="rounded-lg border bg-muted/20 p-3 text-[11px] text-muted-foreground">
                Enquiry is read-only. Use <span className="font-medium">Capture authorisation</span> from the process selector to record or update.
              </div>
            </div>
          )}

          {currentStep?.key === "review" && <ReviewSummary draft={draft} variant={variant} />}

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
                {submitting ? "Submitting…" : variant === "auth-enquiry" ? "Close" : "Submit"}
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

function StatusBadge({ status }: { status: AuthorisationStatus }) {
  const tone = status === "Approved"
    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    : status === "Rejected" || status === "Expired"
    ? "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300"
    : status === "MoreInfo" || status === "Pending"
    ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
    : "border-border bg-muted text-muted-foreground";
  return <Badge variant="outline" className={cn("text-[10px]", tone)}>{status}</Badge>;
}

function ReviewSummary({ draft, variant }: { draft: Draft; variant: FundingVariant }) {
  const rows: Array<[string, string]> = (() => {
    switch (variant) {
      case "capture-auth":
        return [
          ["Admission", draft.admissionId],
          ["Authorisation", draft.authorisationNumber || "— pending —"],
          ["Status", draft.status],
          ["Scheme / administrator", [draft.scheme, draft.administrator].filter(Boolean).join(" · ") || "—"],
          ["Requested stay", draft.requestedFrom && draft.requestedTo ? `${draft.requestedFrom} → ${draft.requestedTo}` : "—"],
          ["Approved stay", draft.approvedFrom && draft.approvedTo ? `${draft.approvedFrom} → ${draft.approvedTo}` : "—"],
          ["Expiry", draft.expiry || "—"],
          ["No-auth reason", draft.noAuthReason || "—"],
          ["Follow-up", [draft.followUpOwnerId, draft.followUpDate].filter(Boolean).join(" · ") || "—"],
        ];
      case "funding-change":
        return [
          ["Admission", draft.admissionId],
          ["Method", draft.method],
          ["Scheme / plan", [draft.scheme, draft.planOption].filter(Boolean).join(" · ") || "—"],
          ["Membership", [draft.membershipNumber, draft.dependantCode].filter(Boolean).join(" · ") || "—"],
          ["Principal member", draft.principalMemberName || "—"],
          ["Effective", draft.effectiveDate || "—"],
          ["Reason", draft.reason],
        ];
      default: return [];
    }
  })();
  const Icon = variant === "capture-auth" ? ShieldAlert : Wallet;
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
        <CheckCircle2 className="h-3 w-3 text-emerald-500" />Ready to submit — you can return here to amend from the admission workspace.
      </div>
    </div>
  );
}
