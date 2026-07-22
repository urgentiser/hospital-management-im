/**
 * Admission Creation Cluster — typed guided wizards.
 *
 * Covers the five §4 creation processes with dedicated typed forms that call
 * the corresponding `admissionsService` methods and surface an RFC-7807
 * result banner. Each variant reuses a shared 5-step scaffold (Patient →
 * Encounter → Practitioner → Funding & Auth → Consent & Review) and
 * overrides fields per business flow.
 */
import { useEffect, useMemo, useState } from "react";
import {
  Ambulance, ArrowLeft, ArrowRight, Baby, Check, CheckCircle2, PhoneCall,
  Repeat, ShieldOff, UserPlus, X, Search as SearchIcon, AlertTriangle,
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
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { FACILITIES } from "@/lib/facility-context";
import { availablePatients } from "@/lib/patient-context";
import { admissionsService } from "@/services/modules/admissions.service";
import type {
  AdmissionType, AdmissionSource, FundingMethod, NoAuthReason,
  CreateAdmissionRequest, ConvertPreadmissionRequest, DirectAdmissionRequest,
  EmergencyAdmissionRequest, NoAuthorisationAdmissionRequest,
} from "@/modules/admissions/contracts";

export type CreationVariant =
  | "admit" | "convert-pre" | "direct-admit" | "emergency-admit" | "no-auth-admit";

const VARIANT_META: Record<CreationVariant, {
  title: string; blurb: string; icon: typeof UserPlus; accent: string;
}> = {
  "admit":            { title: "Admit a patient",            blurb: "Full guided admission for a scheduled or preadmitted patient.", icon: UserPlus,  accent: "from-emerald-500/25 to-transparent" },
  "convert-pre":      { title: "Convert preadmission",       blurb: "Promote a ready preadmission into an active admission.",         icon: Repeat,    accent: "from-teal-500/25 to-transparent" },
  "direct-admit":     { title: "Direct admission",           blurb: "Admit without a preadmission — walk-in or scheduled direct.",     icon: PhoneCall, accent: "from-sky-500/25 to-transparent" },
  "emergency-admit":  { title: "Emergency admission",        blurb: "Admit from the Emergency Unit with a temporary identity if needed.", icon: Ambulance, accent: "from-amber-500/25 to-transparent" },
  "no-auth-admit":    { title: "No-authorisation admission", blurb: "Admit and flag as no-auth, capturing follow-up ownership.",       icon: ShieldOff, accent: "from-rose-500/25 to-transparent" },
};

const ADMISSION_TYPES: AdmissionType[] = ["Inpatient", "Day case", "Emergency", "Obstetric", "Neonate", "Observation", "Transfer in", "Theatre direct"];
const ADMISSION_SOURCES: AdmissionSource[] = ["Preadmission", "Direct", "Emergency Unit", "Transfer in", "Theatre", "Practitioner referral", "Other"];
const FUNDING_METHODS: FundingMethod[] = ["MedicalScheme", "Insurance", "COID", "SelfPay", "Guarantor", "Other"];
const NO_AUTH_REASONS: NoAuthReason[] = ["NotRequested", "Pending", "Rejected", "ProviderUnavailable", "EmergencyException", "InsufficientInformation"];

type Draft = {
  // Patient
  patientId: string;
  patientName: string;
  mrn: string;
  temporaryPatient: boolean;
  preadmissionId: string;
  emergencyVisitId: string;
  // Encounter
  facilityId: string;
  admissionType: AdmissionType;
  admissionSource: AdmissionSource;
  admissionDate: string;
  expectedDeparture: string;
  reasonForAdmission: string;
  directAdmissionReason: string;
  triageSummary: string;
  // Practitioner
  admittingPractitionerId: string;
  responsiblePractitionerId: string;
  referringPractitionerId: string;
  // Funding
  fundingMethod: FundingMethod;
  scheme: string;
  membershipNumber: string;
  authorisationNumber: string;
  noAuthReason: NoAuthReason | "";
  followUpOwnerId: string;
  followUpDate: string;
  approverId: string;
  noAuthComments: string;
  // Consent
  consentCaptured: boolean;
};

const EMPTY_DRAFT: Draft = {
  patientId: "", patientName: "", mrn: "", temporaryPatient: false,
  preadmissionId: "", emergencyVisitId: "",
  facilityId: FACILITIES[0]?.id ?? "", admissionType: "Inpatient",
  admissionSource: "Direct", admissionDate: new Date().toISOString().slice(0, 16),
  expectedDeparture: "", reasonForAdmission: "", directAdmissionReason: "", triageSummary: "",
  admittingPractitionerId: "", responsiblePractitionerId: "", referringPractitionerId: "",
  fundingMethod: "MedicalScheme", scheme: "", membershipNumber: "",
  authorisationNumber: "", noAuthReason: "", followUpOwnerId: "", followUpDate: "",
  approverId: "", noAuthComments: "", consentCaptured: false,
};

type StepDef = { key: string; title: string; hint: string };

function stepsFor(variant: CreationVariant): StepDef[] {
  const base: StepDef[] = [
    { key: "patient",      title: "Patient",       hint: "Identify the person being admitted." },
    { key: "encounter",    title: "Encounter",     hint: "Facility, type and admission source." },
    { key: "practitioner", title: "Practitioner",  hint: "Admitting and responsible clinicians." },
    { key: "funding",      title: "Funding & auth", hint: "Method, scheme and authorisation." },
    { key: "review",       title: "Consent & review", hint: "Confirm consent and submit." },
  ];
  if (variant === "no-auth-admit") {
    return [
      { key: "patient",    title: "Patient",       hint: "Identify the person being admitted." },
      { key: "no-auth",    title: "No-auth reason", hint: "Why authorisation is not in place." },
      { key: "follow-up",  title: "Follow-up",     hint: "Owner, date and approver." },
      { key: "review",     title: "Review",        hint: "Confirm and submit." },
    ];
  }
  if (variant === "convert-pre") return [{ key: "preadmission", title: "Preadmission", hint: "Pick a ready preadmission to promote." }, ...base];
  if (variant === "emergency-admit") return [{ key: "eu-visit", title: "EU visit", hint: "Link the emergency visit." }, ...base];
  return base;
}

type Props = { variant: CreationVariant | null; open: boolean; onOpenChange: (v: boolean) => void; onCompleted?: () => void };

export function AdmissionCreationWizard({ variant, open, onOpenChange, onCompleted }: Props) {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [stepIdx, setStepIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [patientQuery, setPatientQuery] = useState("");

  const steps = useMemo(() => (variant ? stepsFor(variant) : []), [variant]);
  const meta = variant ? VARIANT_META[variant] : null;

  useEffect(() => { if (open) { setDraft(EMPTY_DRAFT); setStepIdx(0); setProblem(null); setPatientQuery(""); } }, [open, variant]);

  if (!variant || !meta) return null;

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const patientResults = patientQuery.trim()
    ? availablePatients.filter((p) => `${p.name} ${p.mrn} ${p.id}`.toLowerCase().includes(patientQuery.toLowerCase())).slice(0, 6)
    : availablePatients.slice(0, 5);

  const currentStep = steps[stepIdx];
  const isLast = stepIdx === steps.length - 1;

  const canAdvance = (() => {
    if (!currentStep) return false;
    switch (currentStep.key) {
      case "preadmission": return !!draft.preadmissionId.trim();
      case "eu-visit": return !!draft.emergencyVisitId.trim();
      case "patient": return draft.temporaryPatient || !!draft.patientId;
      case "encounter": return !!draft.facilityId && !!draft.admissionType && !!draft.reasonForAdmission.trim();
      case "practitioner": return !!draft.admittingPractitionerId.trim();
      case "funding": return !!draft.fundingMethod && (draft.fundingMethod !== "MedicalScheme" || !!draft.scheme.trim());
      case "no-auth": return !!draft.noAuthReason && !!draft.noAuthComments.trim();
      case "follow-up": return !!draft.followUpOwnerId.trim() && !!draft.followUpDate.trim();
      case "review": return variant === "no-auth-admit" ? true : draft.consentCaptured;
      default: return true;
    }
  })();

  const submit = async () => {
    setSubmitting(true); setProblem(null);
    try {
      if (variant === "no-auth-admit") {
        const req: NoAuthorisationAdmissionRequest = {
          patientId: draft.patientId, noAuthReason: draft.noAuthReason as NoAuthReason,
          followUpOwnerId: draft.followUpOwnerId, followUpDate: draft.followUpDate,
          managementApproverId: draft.approverId || undefined,
          reason: draft.noAuthComments, comments: draft.noAuthComments,
        };
        const r = await admissionsService.flagNoAuthorisation(req);
        if (!r.ok) { setProblem(r.problem.detail ?? r.problem.title); return; }
        toast.success("No-authorisation admission flagged", { description: `Ref ${r.correlationId?.slice(0, 8)}` });
      } else if (variant === "emergency-admit") {
        const req: EmergencyAdmissionRequest = {
          facilityId: draft.facilityId, emergencyVisitId: draft.emergencyVisitId,
          temporaryPatient: draft.temporaryPatient, patientId: draft.temporaryPatient ? undefined : draft.patientId,
          triageSummary: draft.triageSummary || undefined,
          admissionType: draft.admissionType, reasonForAdmission: draft.reasonForAdmission,
          noAuthReason: draft.noAuthReason || undefined,
        };
        const r = await admissionsService.emergencyAdmission(req);
        if (!r.ok) { setProblem(r.problem.detail ?? r.problem.title); return; }
        toast.success("Emergency admission created", { description: `${draft.patientName || "Temporary patient"} · ${draft.facilityId}` });
      } else {
        const baseReq: CreateAdmissionRequest = {
          facilityId: draft.facilityId, patientId: draft.patientId,
          admissionType: draft.admissionType,
          admissionSource: variant === "direct-admit" ? "Direct" : variant === "convert-pre" ? "Preadmission" : draft.admissionSource,
          admissionDate: draft.admissionDate, expectedDeparture: draft.expectedDeparture || undefined,
          reasonForAdmission: draft.reasonForAdmission,
          admittingPractitionerId: draft.admittingPractitionerId,
          responsiblePractitionerId: draft.responsiblePractitionerId || undefined,
          referringPractitionerId: draft.referringPractitionerId || undefined,
          funding: {
            method: draft.fundingMethod,
            scheme: draft.scheme || undefined,
            membershipNumber: draft.membershipNumber || undefined,
          },
          authorisation: draft.authorisationNumber
            ? { authorisationNumber: draft.authorisationNumber }
            : (draft.noAuthReason ? { noAuthReason: draft.noAuthReason as NoAuthReason } : undefined),
          consentCaptured: draft.consentCaptured,
        };
        let r;
        if (variant === "convert-pre") {
          const conv: ConvertPreadmissionRequest = {
            preadmissionId: draft.preadmissionId, facilityId: draft.facilityId,
            actualAdmissionDate: draft.admissionDate, admissionType: draft.admissionType,
            admittingPractitionerId: draft.admittingPractitionerId,
            correctedFields: { ...baseReq },
          };
          r = await admissionsService.convertPreadmission(conv);
        } else if (variant === "direct-admit") {
          const direct: DirectAdmissionRequest = { ...baseReq, directAdmissionReason: draft.directAdmissionReason || "Direct walk-in" };
          r = await admissionsService.directAdmission(direct);
        } else {
          r = await admissionsService.createAdmission(baseReq);
        }
        if (!r.ok) { setProblem(r.problem.detail ?? r.problem.title); return; }
        toast.success("Admission created", { description: `${draft.patientName} · ${draft.facilityId}` });
      }
      onCompleted?.();
      onOpenChange(false);
    } finally { setSubmitting(false); }
  };

  const Icon = meta.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0">
        {/* Header */}
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

        {/* Stepper */}
        <div className="border-b bg-muted/30 px-6 py-3">
          <ol className="flex flex-wrap items-center gap-2">
            {steps.map((s, i) => {
              const done = i < stepIdx, active = i === stepIdx;
              return (
                <li key={s.key} className="flex items-center gap-2">
                  <button
                    type="button" onClick={() => i <= stepIdx && setStepIdx(i)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition",
                      active && "border-primary bg-primary text-primary-foreground shadow-sm",
                      done && "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                      !active && !done && "border-border bg-background text-muted-foreground",
                    )}
                  >
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

        {/* Body */}
        <div className="max-h-[55vh] overflow-y-auto px-6 py-5">
          <div className="mb-4">
            <div className="text-sm font-semibold">{currentStep?.title}</div>
            <div className="text-xs text-muted-foreground">{currentStep?.hint}</div>
          </div>

          {currentStep?.key === "preadmission" && (
            <Field label="Preadmission reference" required>
              <Input value={draft.preadmissionId} onChange={(e) => set("preadmissionId", e.target.value)} placeholder="PRE-…" />
            </Field>
          )}

          {currentStep?.key === "eu-visit" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Emergency visit reference" required>
                <Input value={draft.emergencyVisitId} onChange={(e) => set("emergencyVisitId", e.target.value)} placeholder="EU-…" />
              </Field>
              <Field label="Triage summary">
                <Input value={draft.triageSummary} onChange={(e) => set("triageSummary", e.target.value)} placeholder="ESI · presenting complaint" />
              </Field>
              <label className="col-span-full flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs">
                <input type="checkbox" checked={draft.temporaryPatient} onChange={(e) => set("temporaryPatient", e.target.checked)} />
                Temporary patient identity (unregistered)
              </label>
            </div>
          )}

          {currentStep?.key === "patient" && (
            <div className="space-y-3">
              {variant === "emergency-admit" && draft.temporaryPatient ? (
                <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-xs text-muted-foreground">
                  Using a temporary identity for this emergency admission. The patient record will be reconciled after triage.
                </div>
              ) : (
                <>
                  <div className="relative">
                    <SearchIcon className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-8" value={patientQuery} onChange={(e) => setPatientQuery(e.target.value)} placeholder="Search by name, MRN or ID" />
                  </div>
                  <div className="grid gap-2">
                    {patientResults.map((p) => {
                      const selected = draft.patientId === p.id;
                      return (
                        <button key={p.id} type="button"
                          onClick={() => { set("patientId", p.id); set("patientName", p.name); set("mrn", p.mrn); }}
                          className={cn(
                            "flex items-center justify-between rounded-lg border p-3 text-left text-xs transition hover:border-primary/40 hover:bg-accent",
                            selected && "border-primary bg-primary/5 ring-1 ring-primary/30",
                          )}>
                          <div>
                            <div className="text-sm font-medium">{p.name}</div>
                            <div className="text-muted-foreground">MRN {p.mrn} · {p.dob} · {p.gender} · {p.scheme}</div>
                          </div>
                          {selected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                        </button>
                      );
                    })}
                    {patientResults.length === 0 && (
                      <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">No matches. Refine the search or register a new patient first.</div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {currentStep?.key === "encounter" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Facility" required>
                <SelectBox value={draft.facilityId} onChange={(v) => set("facilityId", v)} options={FACILITIES.map((f) => ({ value: f.id, label: f.name }))} />
              </Field>
              <Field label="Admission type" required>
                <SelectBox value={draft.admissionType} onChange={(v) => set("admissionType", v as AdmissionType)} options={ADMISSION_TYPES.map((t) => ({ value: t, label: t }))} />
              </Field>
              {variant === "admit" && (
                <Field label="Admission source">
                  <SelectBox value={draft.admissionSource} onChange={(v) => set("admissionSource", v as AdmissionSource)} options={ADMISSION_SOURCES.map((s) => ({ value: s, label: s }))} />
                </Field>
              )}
              <Field label="Admission date & time" required>
                <Input type="datetime-local" value={draft.admissionDate} onChange={(e) => set("admissionDate", e.target.value)} />
              </Field>
              <Field label="Expected departure">
                <Input type="datetime-local" value={draft.expectedDeparture} onChange={(e) => set("expectedDeparture", e.target.value)} />
              </Field>
              {variant === "direct-admit" && (
                <Field label="Direct admission reason" required>
                  <Input value={draft.directAdmissionReason} onChange={(e) => set("directAdmissionReason", e.target.value)} placeholder="Walk-in / scheduled direct" />
                </Field>
              )}
              <Field label="Reason for admission" required className="sm:col-span-2">
                <Textarea rows={2} value={draft.reasonForAdmission} onChange={(e) => set("reasonForAdmission", e.target.value)} placeholder="Presenting complaint / procedure" />
              </Field>
            </div>
          )}

          {currentStep?.key === "practitioner" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Admitting practitioner" required>
                <Input value={draft.admittingPractitionerId} onChange={(e) => set("admittingPractitionerId", e.target.value)} placeholder="Dr. surname or practice number" />
              </Field>
              <Field label="Responsible practitioner">
                <Input value={draft.responsiblePractitionerId} onChange={(e) => set("responsiblePractitionerId", e.target.value)} placeholder="Optional" />
              </Field>
              <Field label="Referring practitioner" className="sm:col-span-2">
                <Input value={draft.referringPractitionerId} onChange={(e) => set("referringPractitionerId", e.target.value)} placeholder="Optional" />
              </Field>
            </div>
          )}

          {currentStep?.key === "funding" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Funding method" required>
                <SelectBox value={draft.fundingMethod} onChange={(v) => set("fundingMethod", v as FundingMethod)} options={FUNDING_METHODS.map((f) => ({ value: f, label: f }))} />
              </Field>
              <Field label={draft.fundingMethod === "MedicalScheme" ? "Scheme" : "Funder / Payer"} required={draft.fundingMethod === "MedicalScheme"}>
                <Input value={draft.scheme} onChange={(e) => set("scheme", e.target.value)} placeholder="e.g. Discovery Health" />
              </Field>
              <Field label="Membership number">
                <Input value={draft.membershipNumber} onChange={(e) => set("membershipNumber", e.target.value)} placeholder="Member #" />
              </Field>
              <Field label="Authorisation number">
                <Input value={draft.authorisationNumber} onChange={(e) => set("authorisationNumber", e.target.value)} placeholder="AUTH-…" />
              </Field>
              <Field label="No-auth reason (if applicable)" className="sm:col-span-2">
                <SelectBox
                  value={draft.noAuthReason || "none"}
                  onChange={(v) => set("noAuthReason", (v === "none" ? "" : v) as Draft["noAuthReason"])}
                  options={[{ value: "none", label: "— none —" }, ...NO_AUTH_REASONS.map((r) => ({ value: r, label: r }))]}
                />
              </Field>
            </div>
          )}

          {currentStep?.key === "no-auth" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="No-auth reason" required>
                <SelectBox value={draft.noAuthReason || ""} onChange={(v) => set("noAuthReason", v as NoAuthReason)}
                  options={NO_AUTH_REASONS.map((r) => ({ value: r, label: r }))} />
              </Field>
              <Field label="Rejected authorisation reference">
                <Input value={draft.authorisationNumber} onChange={(e) => set("authorisationNumber", e.target.value)} placeholder="AUTH-… (if rejected)" />
              </Field>
              <Field label="Comments" required className="sm:col-span-2">
                <Textarea rows={3} value={draft.noAuthComments} onChange={(e) => set("noAuthComments", e.target.value)} placeholder="Explain why authorisation is not in place." />
              </Field>
            </div>
          )}

          {currentStep?.key === "follow-up" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Follow-up owner" required>
                <Input value={draft.followUpOwnerId} onChange={(e) => set("followUpOwnerId", e.target.value)} placeholder="Case manager" />
              </Field>
              <Field label="Follow-up date" required>
                <Input type="date" value={draft.followUpDate} onChange={(e) => set("followUpDate", e.target.value)} />
              </Field>
              <Field label="Management approver" className="sm:col-span-2">
                <Input value={draft.approverId} onChange={(e) => set("approverId", e.target.value)} placeholder="Approving manager (elevated)" />
              </Field>
            </div>
          )}

          {currentStep?.key === "review" && (
            <ReviewPanel draft={draft} variant={variant} onToggleConsent={(v) => set("consentCaptured", v)} />
          )}

          {problem && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-400/40 bg-rose-500/5 p-3 text-xs text-rose-700 dark:text-rose-300">
              <AlertTriangle className="mt-0.5 h-4 w-4" />
              <div><div className="font-medium">Could not complete admission</div><div>{problem}</div></div>
            </div>
          )}
        </div>

        {/* Footer */}
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
                {submitting ? "Submitting…" : "Submit admission"}
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
      <SelectContent>
        {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function ReviewPanel({ draft, variant, onToggleConsent }: { draft: Draft; variant: CreationVariant; onToggleConsent: (v: boolean) => void }) {
  const rows: Array<[string, string]> = variant === "no-auth-admit"
    ? [
        ["Patient", draft.patientName || draft.patientId || "—"],
        ["No-auth reason", draft.noAuthReason || "—"],
        ["Rejected auth", draft.authorisationNumber || "—"],
        ["Follow-up owner", draft.followUpOwnerId || "—"],
        ["Follow-up date", draft.followUpDate || "—"],
        ["Approver", draft.approverId || "—"],
      ]
    : [
        ["Patient", draft.temporaryPatient ? "Temporary identity" : (draft.patientName || draft.patientId || "—")],
        ["Facility", draft.facilityId],
        ["Type / source", `${draft.admissionType} · ${variant === "direct-admit" ? "Direct" : variant === "convert-pre" ? "Preadmission" : draft.admissionSource}`],
        ["Admitted at", draft.admissionDate.replace("T", " ")],
        ["Expected departure", draft.expectedDeparture || "—"],
        ["Practitioner", draft.admittingPractitionerId || "—"],
        ["Funding", `${draft.fundingMethod}${draft.scheme ? ` · ${draft.scheme}` : ""}`],
        ["Authorisation", draft.authorisationNumber || (draft.noAuthReason ? `No-auth · ${draft.noAuthReason}` : "—")],
        ["Reason", draft.reasonForAdmission || "—"],
      ];
  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <div className="border-b bg-muted/30 px-3 py-2 text-xs font-medium">Summary</div>
        <dl className="divide-y">
          {rows.map(([k, v]) => (
            <div key={k} className="grid grid-cols-3 gap-3 px-3 py-2 text-xs">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="col-span-2 font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      {variant !== "no-auth-admit" && (
        <label className="flex items-start gap-2 rounded-lg border bg-muted/20 p-3 text-xs">
          <input type="checkbox" className="mt-0.5" checked={draft.consentCaptured} onChange={(e) => onToggleConsent(e.target.checked)} />
          <span>
            <span className="font-medium">Consent captured.</span>{" "}
            The patient (or guardian) has consented to admission, treatment and information sharing with the funder.
          </span>
        </label>
      )}
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <Badge variant="outline">Audit</Badge>
        A correlation ID is generated and attached to every event for traceability.
        <Separator className="mx-1 h-3" orientation="vertical" />
        <Badge variant="outline">Idempotent</Badge>
        Duplicate submissions within the same session are deduped by the backend.
      </div>
    </div>
  );
}

/** Icon lookup helper for the callers who already know the variant key. */
export const CreationVariantIcons = { UserPlus, Repeat, PhoneCall, Ambulance, ShieldOff, Baby };
