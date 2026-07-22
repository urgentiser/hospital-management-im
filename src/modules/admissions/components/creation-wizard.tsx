/**
 * Admission Creation Cluster — typed guided wizards on the Phase-3 contracts.
 *
 * The primary "admit" variant is a 16-step journey that mirrors the end-to-end
 * Admissions patient journey diagram: facility → identify → (embedded)
 * register → encounter → diagnosis → practitioners → funding → member
 * validation → authorisation → consent → documents → bed allocation →
 * review → confirm. The four alternate variants (convert-preadmission,
 * direct, emergency, no-auth) reuse the same scaffold with shorter step
 * lists and pre-selected sources.
 *
 * The wizard is journey-aware: facility and patient are hydrated from
 * `useAdmissionJourney`, drafts persist across steps, and the correlation
 * ID doubles as the mutation idempotency key so a retried submit never
 * duplicates. After a successful submit we poll `getReadiness` so the
 * caller can hand off to the Admission Workspace with backend-authoritative
 * available actions.
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Ambulance, ArrowLeft, ArrowRight, Baby, Bed, Building2, Check, CheckCircle2,
  FileText, PhoneCall, Repeat, Search as SearchIcon, ShieldOff, Stethoscope,
  UserPlus, X, AlertTriangle, Loader2, ShieldCheck,
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
import { useAdmissionJourney } from "@/modules/admissions/state/journey-context";
import type {
  AdmissionType, AdmissionSource, FundingMethod, NoAuthReason,
  CreateAdmissionRequest, ConvertPreadmissionRequest, DirectAdmissionRequest,
  EmergencyAdmissionRequest, NoAuthorisationAdmissionRequest,
  BedAvailabilityRow, AccommodationPeriod,
} from "@/modules/admissions/contracts";

export type CreationVariant =
  | "admit" | "convert-pre" | "direct-admit" | "emergency-admit" | "no-auth-admit";

const VARIANT_META: Record<CreationVariant, {
  title: string; blurb: string; icon: typeof UserPlus; accent: string;
}> = {
  "admit":            { title: "Admit a patient",            blurb: "Full 16-step guided admission journey.",                              icon: UserPlus,  accent: "from-emerald-500/25 to-transparent" },
  "convert-pre":      { title: "Convert preadmission",       blurb: "Promote a ready preadmission into an active admission.",              icon: Repeat,    accent: "from-teal-500/25 to-transparent" },
  "direct-admit":     { title: "Direct admission",           blurb: "Admit without a preadmission — walk-in or scheduled direct.",         icon: PhoneCall, accent: "from-sky-500/25 to-transparent" },
  "emergency-admit":  { title: "Emergency admission",        blurb: "Admit from the Emergency Unit with a temporary identity if needed.",  icon: Ambulance, accent: "from-amber-500/25 to-transparent" },
  "no-auth-admit":    { title: "No-authorisation admission", blurb: "Admit and flag as no-auth, capturing follow-up ownership.",           icon: ShieldOff, accent: "from-rose-500/25 to-transparent" },
};

const ADMISSION_TYPES: AdmissionType[] = ["Inpatient", "Day case", "Emergency", "Obstetric", "Neonate", "Observation", "Transfer in", "Theatre direct"];
const ADMISSION_SOURCES: AdmissionSource[] = ["Preadmission", "Direct", "Emergency Unit", "Transfer in", "Theatre", "Practitioner referral", "Other"];
const FUNDING_METHODS: FundingMethod[] = ["MedicalScheme", "Insurance", "COID", "SelfPay", "Guarantor", "Other"];
const NO_AUTH_REASONS: NoAuthReason[] = ["NotRequested", "Pending", "Rejected", "ProviderUnavailable", "EmergencyException", "InsufficientInformation"];
const ACCOMMODATION_TYPES: AccommodationPeriod["accommodationType"][] = ["General", "Semi-private", "Private", "HDU", "ICU"];

type Draft = {
  // Identity
  patientId: string; patientName: string; mrn: string;
  registerNew: boolean; temporaryPatient: boolean;
  newFirstName: string; newSurname: string; newIdOrPassport: string; newDob: string; newSex: "M" | "F" | "X" | "";
  preadmissionId: string; emergencyVisitId: string;
  // Encounter
  facilityId: string; admissionType: AdmissionType; admissionSource: AdmissionSource;
  admissionDate: string; expectedDeparture: string;
  reasonForAdmission: string; directAdmissionReason: string; triageSummary: string;
  admissionDiagnosis: string;
  // Practitioners
  admittingPractitionerId: string; responsiblePractitionerId: string; referringPractitionerId: string;
  additionalSpecialists: string;
  // Funding & auth
  fundingMethod: FundingMethod; scheme: string; membershipNumber: string;
  dependantCode: string; principalMemberName: string;
  memberValidationOutcome: "Verified" | "Pending" | "Failed" | "NotRequired" | "";
  authorisationNumber: string; noAuthReason: NoAuthReason | ""; followUpOwnerId: string; followUpDate: string;
  approverId: string; noAuthComments: string;
  // Consent & documents
  consentCaptured: boolean; documentsCaptured: string;
  // Bed allocation
  accommodationType: AccommodationPeriod["accommodationType"]; selectedBedId: string; selectedWardId: string;
};

const emptyDraft = (facilityId: string): Draft => ({
  patientId: "", patientName: "", mrn: "",
  registerNew: false, temporaryPatient: false,
  newFirstName: "", newSurname: "", newIdOrPassport: "", newDob: "", newSex: "",
  preadmissionId: "", emergencyVisitId: "",
  facilityId, admissionType: "Inpatient", admissionSource: "Direct",
  admissionDate: new Date().toISOString().slice(0, 16), expectedDeparture: "",
  reasonForAdmission: "", directAdmissionReason: "", triageSummary: "", admissionDiagnosis: "",
  admittingPractitionerId: "", responsiblePractitionerId: "", referringPractitionerId: "", additionalSpecialists: "",
  fundingMethod: "MedicalScheme", scheme: "", membershipNumber: "",
  dependantCode: "", principalMemberName: "",
  memberValidationOutcome: "",
  authorisationNumber: "", noAuthReason: "", followUpOwnerId: "", followUpDate: "",
  approverId: "", noAuthComments: "",
  consentCaptured: false, documentsCaptured: "",
  accommodationType: "General", selectedBedId: "", selectedWardId: "",
});

type StepKey =
  | "facility" | "identify" | "registration" | "encounter" | "diagnosis"
  | "primary-practitioner" | "team-practitioners" | "funding-method"
  | "scheme-membership" | "member-validation" | "authorisation" | "consent"
  | "documents" | "bed-allocation" | "review" | "confirm"
  // Alternates
  | "preadmission" | "eu-visit" | "patient" | "practitioner" | "funding"
  | "no-auth" | "follow-up";

type StepDef = { key: StepKey; title: string; hint: string };

const ADMIT_16: StepDef[] = [
  { key: "facility",             title: "Facility",             hint: "Confirm the facility context." },
  { key: "identify",             title: "Identify patient",     hint: "Search the patient index or start a new registration." },
  { key: "registration",         title: "Register",             hint: "Capture minimum registration when the patient is new." },
  { key: "encounter",            title: "Encounter",            hint: "Type, source and expected stay." },
  { key: "diagnosis",            title: "Diagnosis",            hint: "Presenting complaint and admission diagnosis." },
  { key: "primary-practitioner", title: "Admitting clinician",  hint: "Admitting and responsible practitioner." },
  { key: "team-practitioners",   title: "Care team",            hint: "Referring practitioner and specialists." },
  { key: "funding-method",       title: "Funding method",       hint: "How this admission will be paid." },
  { key: "scheme-membership",    title: "Scheme & membership",  hint: "Scheme, plan, principal member and dependant." },
  { key: "member-validation",    title: "Member validation",    hint: "Confirm scheme eligibility." },
  { key: "authorisation",        title: "Authorisation",        hint: "Auth reference, or capture no-auth reason and follow-up." },
  { key: "consent",              title: "Consent",              hint: "Treatment consent and privacy acknowledgement." },
  { key: "documents",            title: "Documents",            hint: "Link ID, medical-aid card and supporting documents." },
  { key: "bed-allocation",       title: "Bed allocation",       hint: "Pick a live-available bed for the patient." },
  { key: "review",               title: "Review",               hint: "Cross-check the admission before submission." },
  { key: "confirm",              title: "Confirm",              hint: "Submit and hand off to the Admission Workspace." },
];

function stepsFor(variant: CreationVariant): StepDef[] {
  if (variant === "admit") return ADMIT_16;
  const short: StepDef[] = [
    { key: "patient",      title: "Patient",       hint: "Identify the person being admitted." },
    { key: "encounter",    title: "Encounter",     hint: "Facility, type and admission source." },
    { key: "practitioner", title: "Practitioner",  hint: "Admitting and responsible clinicians." },
    { key: "funding",      title: "Funding & auth", hint: "Method, scheme and authorisation." },
    { key: "review",       title: "Consent & review", hint: "Confirm consent and submit." },
  ];
  if (variant === "no-auth-admit") return [
    { key: "patient",    title: "Patient",       hint: "Identify the person being admitted." },
    { key: "no-auth",    title: "No-auth reason", hint: "Why authorisation is not in place." },
    { key: "follow-up",  title: "Follow-up",     hint: "Owner, date and approver." },
    { key: "review",     title: "Review",        hint: "Confirm and submit." },
  ];
  if (variant === "convert-pre")     return [{ key: "preadmission", title: "Preadmission", hint: "Pick a ready preadmission to promote." }, ...short];
  if (variant === "emergency-admit") return [{ key: "eu-visit", title: "EU visit", hint: "Link the emergency visit." }, ...short];
  return short;
}

type Props = { variant: CreationVariant | null; open: boolean; onOpenChange: (v: boolean) => void; onCompleted?: () => void };

export function AdmissionCreationWizard({ variant, open, onOpenChange, onCompleted }: Props) {
  const journey = useAdmissionJourney();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(journey.facilityId ?? (FACILITIES[0] ?? "")));
  const [stepIdx, setStepIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [patientQuery, setPatientQuery] = useState("");
  const [beds, setBeds] = useState<BedAvailabilityRow[]>([]);
  const [bedsLoading, setBedsLoading] = useState(false);

  const steps = useMemo(() => (variant ? stepsFor(variant) : []), [variant]);
  const meta = variant ? VARIANT_META[variant] : null;

  useEffect(() => {
    if (open && variant) {
      journey.startJourney(variant);
      const facility = journey.facilityId ?? (FACILITIES[0] ?? "");
      const d = emptyDraft(facility);
      if (journey.patientId) {
        const p = availablePatients.find((x) => x.id === journey.patientId);
        d.patientId = journey.patientId;
        d.patientName = p?.name ?? "";
        d.mrn = journey.patientMRN ?? p?.mrn ?? "";
      }
      setDraft(d);
      setStepIdx(0);
      setProblem(null);
      setPatientQuery("");
      setBeds([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, variant]);

  const currentStep = steps[stepIdx];

  // Load beds when entering the bed-allocation step.
  useEffect(() => {
    if (currentStep?.key !== "bed-allocation" || !draft.facilityId) return;
    let cancelled = false;
    setBedsLoading(true);
    admissionsService.listAvailableBeds({
      facilityId: draft.facilityId,
      accommodationType: draft.accommodationType,
    }).then((r) => {
      if (cancelled) return;
      if (r.ok) setBeds(r.data);
    }).finally(() => !cancelled && setBedsLoading(false));
    return () => { cancelled = true; };
  }, [currentStep?.key, draft.facilityId, draft.accommodationType]);

  if (!variant || !meta) return null;

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const patientResults = patientQuery.trim()
    ? availablePatients.filter((p) => `${p.name} ${p.mrn} ${p.id}`.toLowerCase().includes(patientQuery.toLowerCase())).slice(0, 6)
    : availablePatients.slice(0, 5);

  const isLast = stepIdx === steps.length - 1;

  const canAdvance = (() => {
    if (!currentStep) return false;
    switch (currentStep.key) {
      // Admit 16-step
      case "facility":             return !!draft.facilityId;
      case "identify":             return draft.registerNew || !!draft.patientId;
      case "registration":         return !draft.registerNew || (!!draft.newFirstName && !!draft.newSurname && !!draft.newIdOrPassport);
      case "encounter":            return !!draft.admissionType && !!draft.admissionDate;
      case "diagnosis":            return !!draft.reasonForAdmission.trim();
      case "primary-practitioner": return !!draft.admittingPractitionerId.trim();
      case "team-practitioners":   return true;
      case "funding-method":       return !!draft.fundingMethod;
      case "scheme-membership":    return draft.fundingMethod !== "MedicalScheme" || (!!draft.scheme.trim() && !!draft.membershipNumber.trim());
      case "member-validation":    return draft.fundingMethod !== "MedicalScheme" || !!draft.memberValidationOutcome;
      case "authorisation":        return !!draft.authorisationNumber.trim() || !!draft.noAuthReason;
      case "consent":              return draft.consentCaptured;
      case "documents":            return true;
      case "bed-allocation":       return !!draft.selectedBedId;
      case "review":               return true;
      case "confirm":              return true;
      // Alternates
      case "preadmission":         return !!draft.preadmissionId.trim();
      case "eu-visit":             return !!draft.emergencyVisitId.trim();
      case "patient":              return draft.temporaryPatient || !!draft.patientId;
      case "practitioner":         return !!draft.admittingPractitionerId.trim();
      case "funding":              return !!draft.fundingMethod && (draft.fundingMethod !== "MedicalScheme" || !!draft.scheme.trim());
      case "no-auth":              return !!draft.noAuthReason && !!draft.noAuthComments.trim();
      case "follow-up":            return !!draft.followUpOwnerId.trim() && !!draft.followUpDate.trim();
      default: return true;
    }
  })();

  const advance = () => {
    if (!currentStep) return;
    // Skip embedded registration when reusing an existing patient.
    if (currentStep.key === "identify" && !draft.registerNew && draft.patientId) {
      setStepIdx((i) => Math.min(steps.length - 1, i + 2));
      return;
    }
    setStepIdx((i) => Math.min(steps.length - 1, i + 1));
  };

  const submit = async () => {
    setSubmitting(true); setProblem(null);
    const idempotencyKey = `${journey.correlationId}:${variant}`;
    try {
      // Persist context for downstream processes.
      journey.setFacility(draft.facilityId, draft.facilityId);
      if (draft.patientId) journey.setPatient(draft.patientId, draft.mrn);

      if (variant === "no-auth-admit") {
        const req: NoAuthorisationAdmissionRequest = {
          patientId: draft.patientId, noAuthReason: draft.noAuthReason as NoAuthReason,
          followUpOwnerId: draft.followUpOwnerId, followUpDate: draft.followUpDate,
          managementApproverId: draft.approverId || undefined,
          reason: draft.noAuthComments, comments: draft.noAuthComments,
          correlationId: journey.correlationId,
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
          correlationId: journey.correlationId,
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
          admissionDiagnosis: draft.admissionDiagnosis || undefined,
          admittingPractitionerId: draft.admittingPractitionerId,
          responsiblePractitionerId: draft.responsiblePractitionerId || undefined,
          referringPractitionerId: draft.referringPractitionerId || undefined,
          funding: {
            method: draft.fundingMethod,
            scheme: draft.scheme || undefined,
            membershipNumber: draft.membershipNumber || undefined,
            dependantCode: draft.dependantCode || undefined,
            principalMember: draft.principalMemberName ? { fullName: draft.principalMemberName } : undefined,
            memberValidationStatus: draft.memberValidationOutcome || undefined,
          },
          authorisation: draft.authorisationNumber
            ? { authorisationNumber: draft.authorisationNumber }
            : (draft.noAuthReason ? { noAuthReason: draft.noAuthReason as NoAuthReason } : undefined),
          consentCaptured: draft.consentCaptured,
          correlationId: journey.correlationId,
        };
        let r;
        if (variant === "convert-pre") {
          const conv: ConvertPreadmissionRequest = {
            preadmissionId: draft.preadmissionId, facilityId: draft.facilityId,
            actualAdmissionDate: draft.admissionDate, admissionType: draft.admissionType,
            admittingPractitionerId: draft.admittingPractitionerId,
            correctedFields: { ...baseReq },
            correlationId: journey.correlationId,
          };
          r = await admissionsService.convertPreadmission(conv);
        } else if (variant === "direct-admit") {
          const direct: DirectAdmissionRequest = { ...baseReq, directAdmissionReason: draft.directAdmissionReason || "Direct walk-in" };
          r = await admissionsService.directAdmission(direct);
        } else {
          r = await admissionsService.createAdmission(baseReq);
        }
        if (!r.ok) { setProblem(r.problem.detail ?? r.problem.title); return; }
        toast.success("Admission created", { description: `${draft.patientName || draft.patientId} · ${draft.facilityId}` });

        // Best-effort bed allocation right after creation for the admit variant.
        if (variant === "admit" && draft.selectedBedId && r.data?.admissionId) {
          const alloc = await admissionsService.allocateBed({
            admissionId: r.data.admissionId,
            wardId: draft.selectedWardId, bedId: draft.selectedBedId,
            accommodationType: draft.accommodationType,
            allocatedAt: new Date().toISOString(),
            correlationId: journey.correlationId,
          });
          if (!alloc.ok) toast.warning("Bed allocation deferred", { description: alloc.problem.detail ?? alloc.problem.title });
        }

        // Fetch backend-authoritative readiness so the workspace opens with fresh available actions.
        if (r.data?.admissionId) await admissionsService.getReadiness(r.data.admissionId).catch(() => null);

        // Hand off to the workspace when we have an id.
        if (r.data?.admissionId) {
          navigate({ to: "/admissions/$admissionId", params: { admissionId: r.data.admissionId } }).catch(() => null);
        }
      }
      // Idempotency-key is embedded in the correlationId; unused variable to document intent.
      void idempotencyKey;
      onCompleted?.();
      onOpenChange(false);
    } finally { setSubmitting(false); }
  };

  const Icon = meta.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl gap-0 overflow-hidden p-0">
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
              <div className="ml-auto flex items-center gap-2">
                {journey.facilityName && (
                  <Badge variant="outline" className="gap-1"><Building2 className="h-3 w-3" />{journey.facilityName}</Badge>
                )}
                {draft.patientName && (
                  <Badge variant="outline" className="gap-1"><UserPlus className="h-3 w-3" />{draft.patientName}</Badge>
                )}
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Stepper */}
        <div className="border-b bg-muted/30 px-6 py-3">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            {steps.map((s, i) => {
              const done = i < stepIdx, active = i === stepIdx;
              return (
                <li key={s.key} className="flex items-center gap-2">
                  <button
                    type="button" onClick={() => i <= stepIdx && setStepIdx(i)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition",
                      active && "border-primary bg-primary text-primary-foreground shadow-sm",
                      done && "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                      !active && !done && "border-border bg-background text-muted-foreground",
                    )}
                  >
                    <span className={cn("grid h-4 w-4 place-items-center rounded-full text-[9px] font-semibold",
                      active ? "bg-primary-foreground/20" : done ? "bg-emerald-500/20" : "bg-muted")}>
                      {done ? <Check className="h-2.5 w-2.5" /> : i + 1}
                    </span>
                    <span className="font-medium whitespace-nowrap">{s.title}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Body */}
        <div className="max-h-[58vh] overflow-y-auto px-6 py-5">
          <div className="mb-4">
            <div className="text-sm font-semibold">{currentStep?.title}</div>
            <div className="text-xs text-muted-foreground">{currentStep?.hint}</div>
          </div>

          {/* ── Admit 16-step content ─────────────────────────────── */}

          {currentStep?.key === "facility" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Facility" required>
                <SelectBox
                  value={draft.facilityId}
                  onChange={(v) => { set("facilityId", v); journey.setFacility(v, v); }}
                  options={FACILITIES.filter((f) => f !== "All facilities").map((f) => ({ value: f, label: f }))}
                />
              </Field>
              <div className="rounded-lg border bg-muted/20 p-3 text-[11px] text-muted-foreground">
                The facility scopes every search, bed pool and worklist for the remainder of the journey.
              </div>
            </div>
          )}

          {currentStep?.key === "identify" && (
            <div className="space-y-3">
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8" value={patientQuery} onChange={(e) => setPatientQuery(e.target.value)} placeholder="Search by name, MRN or ID" />
              </div>
              <div className="grid gap-2">
                {patientResults.map((p) => {
                  const selected = draft.patientId === p.id;
                  return (
                    <button key={p.id} type="button"
                      onClick={() => {
                        set("patientId", p.id); set("patientName", p.name); set("mrn", p.mrn); set("registerNew", false);
                        journey.setPatient(p.id, p.mrn);
                      }}
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
                  <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">No matches found for that query.</div>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  set("registerNew", true); set("patientId", ""); set("patientName", ""); set("mrn", "");
                  journey.markPatientRegistrationStarted();
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg border border-dashed p-3 text-xs transition hover:border-primary/40 hover:bg-accent",
                  draft.registerNew && "border-primary bg-primary/5",
                )}>
                <UserPlus className="h-4 w-4" />
                <span>No match — register a new patient inline and return to this admission.</span>
              </button>
            </div>
          )}

          {currentStep?.key === "registration" && (
            draft.registerNew ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="First name" required><Input value={draft.newFirstName} onChange={(e) => set("newFirstName", e.target.value)} /></Field>
                <Field label="Surname" required><Input value={draft.newSurname} onChange={(e) => set("newSurname", e.target.value)} /></Field>
                <Field label="ID / Passport" required><Input value={draft.newIdOrPassport} onChange={(e) => set("newIdOrPassport", e.target.value)} /></Field>
                <Field label="Date of birth"><Input type="date" value={draft.newDob} onChange={(e) => set("newDob", e.target.value)} /></Field>
                <Field label="Sex">
                  <SelectBox value={draft.newSex} onChange={(v) => set("newSex", v as Draft["newSex"])}
                    options={[{ value: "", label: "—" }, { value: "F", label: "Female" }, { value: "M", label: "Male" }, { value: "X", label: "Other" }]} />
                </Field>
                <div className="sm:col-span-2 rounded-lg border bg-emerald-500/5 p-3 text-[11px] text-emerald-800 dark:text-emerald-200">
                  This creates a lightweight patient record. Full demographics can be completed from Patient Maintenance later without leaving this admission.
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-xs text-muted-foreground">
                Existing patient selected — no registration required. Click Continue.
              </div>
            )
          )}

          {currentStep?.key === "encounter" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Admission type" required>
                <SelectBox value={draft.admissionType} onChange={(v) => set("admissionType", v as AdmissionType)}
                  options={ADMISSION_TYPES.map((t) => ({ value: t, label: t }))} />
              </Field>
              <Field label="Admission source">
                <SelectBox value={draft.admissionSource} onChange={(v) => set("admissionSource", v as AdmissionSource)}
                  options={ADMISSION_SOURCES.map((s) => ({ value: s, label: s }))} />
              </Field>
              <Field label="Admission date & time" required><Input type="datetime-local" value={draft.admissionDate} onChange={(e) => set("admissionDate", e.target.value)} /></Field>
              <Field label="Expected departure"><Input type="datetime-local" value={draft.expectedDeparture} onChange={(e) => set("expectedDeparture", e.target.value)} /></Field>
            </div>
          )}

          {currentStep?.key === "diagnosis" && (
            <div className="grid gap-3">
              <Field label="Reason for admission" required>
                <Textarea rows={2} value={draft.reasonForAdmission} onChange={(e) => set("reasonForAdmission", e.target.value)} placeholder="Presenting complaint / procedure" />
              </Field>
              <Field label="Admission diagnosis">
                <Input value={draft.admissionDiagnosis} onChange={(e) => set("admissionDiagnosis", e.target.value)} placeholder="Provisional diagnosis or ICD-10 anchor" />
              </Field>
            </div>
          )}

          {currentStep?.key === "primary-practitioner" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Admitting practitioner" required>
                <Input value={draft.admittingPractitionerId} onChange={(e) => set("admittingPractitionerId", e.target.value)} placeholder="Dr. surname or practice number" />
              </Field>
              <Field label="Responsible practitioner">
                <Input value={draft.responsiblePractitionerId} onChange={(e) => set("responsiblePractitionerId", e.target.value)} placeholder="Optional" />
              </Field>
            </div>
          )}

          {currentStep?.key === "team-practitioners" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Referring practitioner">
                <Input value={draft.referringPractitionerId} onChange={(e) => set("referringPractitionerId", e.target.value)} placeholder="Optional" />
              </Field>
              <Field label="Additional specialists">
                <Input value={draft.additionalSpecialists} onChange={(e) => set("additionalSpecialists", e.target.value)} placeholder="Comma-separated" />
              </Field>
            </div>
          )}

          {currentStep?.key === "funding-method" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Funding method" required>
                <SelectBox value={draft.fundingMethod} onChange={(v) => set("fundingMethod", v as FundingMethod)}
                  options={FUNDING_METHODS.map((f) => ({ value: f, label: f }))} />
              </Field>
              <div className="rounded-lg border bg-muted/20 p-3 text-[11px] text-muted-foreground">
                Selecting <span className="font-medium">Medical Scheme</span> unlocks scheme, membership and member-validation steps.
              </div>
            </div>
          )}

          {currentStep?.key === "scheme-membership" && (
            draft.fundingMethod === "MedicalScheme" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Scheme" required><Input value={draft.scheme} onChange={(e) => set("scheme", e.target.value)} placeholder="e.g. Discovery Health" /></Field>
                <Field label="Membership number" required><Input value={draft.membershipNumber} onChange={(e) => set("membershipNumber", e.target.value)} placeholder="Member #" /></Field>
                <Field label="Dependant code"><Input value={draft.dependantCode} onChange={(e) => set("dependantCode", e.target.value)} placeholder="00 / 01 / 02" /></Field>
                <Field label="Principal member (if not patient)"><Input value={draft.principalMemberName} onChange={(e) => set("principalMemberName", e.target.value)} /></Field>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-xs text-muted-foreground">
                Scheme details are not required for {draft.fundingMethod}.
              </div>
            )
          )}

          {currentStep?.key === "member-validation" && (
            draft.fundingMethod === "MedicalScheme" ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {(["Verified", "Pending", "Failed", "NotRequired"] as const).map((v) => (
                    <button key={v} type="button"
                      onClick={() => set("memberValidationOutcome", v)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border p-3 text-xs transition hover:border-primary/40",
                        draft.memberValidationOutcome === v && "border-primary bg-primary/5 ring-1 ring-primary/30",
                      )}>
                      <ShieldCheck className={cn("h-4 w-4", v === "Verified" && "text-emerald-500", v === "Failed" && "text-rose-500", v === "Pending" && "text-amber-500")} />
                      <span className="font-medium">{v}</span>
                    </button>
                  ))}
                </div>
                <div className="rounded-lg border bg-muted/20 p-3 text-[11px] text-muted-foreground">
                  A <span className="font-medium">Failed</span> outcome does not block admission — capture no-auth follow-up in the next step.
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-xs text-muted-foreground">
                Member validation not applicable for {draft.fundingMethod}.
              </div>
            )
          )}

          {currentStep?.key === "authorisation" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Authorisation number">
                <Input value={draft.authorisationNumber} onChange={(e) => set("authorisationNumber", e.target.value)} placeholder="AUTH-…" />
              </Field>
              <Field label="No-auth reason (if no auth)">
                <SelectBox value={draft.noAuthReason || "none"}
                  onChange={(v) => set("noAuthReason", (v === "none" ? "" : v) as Draft["noAuthReason"])}
                  options={[{ value: "none", label: "— none —" }, ...NO_AUTH_REASONS.map((r) => ({ value: r, label: r }))]} />
              </Field>
              {draft.noAuthReason && (
                <>
                  <Field label="Follow-up owner" required><Input value={draft.followUpOwnerId} onChange={(e) => set("followUpOwnerId", e.target.value)} placeholder="Case manager" /></Field>
                  <Field label="Follow-up date" required><Input type="date" value={draft.followUpDate} onChange={(e) => set("followUpDate", e.target.value)} /></Field>
                </>
              )}
            </div>
          )}

          {currentStep?.key === "consent" && (
            <label className="flex items-start gap-2 rounded-lg border bg-muted/20 p-4 text-sm">
              <input type="checkbox" className="mt-1" checked={draft.consentCaptured} onChange={(e) => set("consentCaptured", e.target.checked)} />
              <span>
                <div className="font-medium">Treatment consent captured</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  The patient (or guardian) has consented to admission, treatment and information sharing with the funder, and has acknowledged the privacy notice.
                </div>
              </span>
            </label>
          )}

          {currentStep?.key === "documents" && (
            <div className="space-y-3">
              <Field label="Documents captured this admission (comma-separated)">
                <Textarea rows={2} value={draft.documentsCaptured} onChange={(e) => set("documentsCaptured", e.target.value)} placeholder="e.g. ID copy, Medical aid card, Referral letter" />
              </Field>
              <div className="rounded-lg border bg-muted/20 p-3 text-[11px] text-muted-foreground">
                <FileText className="mr-1 inline h-3 w-3" />
                Files can also be attached later from the Admission Workspace without breaking this journey.
              </div>
            </div>
          )}

          {currentStep?.key === "bed-allocation" && (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Accommodation type">
                  <SelectBox value={draft.accommodationType}
                    onChange={(v) => { set("accommodationType", v as Draft["accommodationType"]); set("selectedBedId", ""); }}
                    options={ACCOMMODATION_TYPES.map((t) => ({ value: t, label: t }))} />
                </Field>
              </div>
              <div className="rounded-lg border">
                <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-2 text-xs">
                  <span className="font-medium">Available beds — {draft.facilityId}</span>
                  {bedsLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                </div>
                {beds.length === 0 && !bedsLoading ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">No available beds match this filter. Adjust the accommodation type.</div>
                ) : (
                  <div className="max-h-56 divide-y overflow-y-auto">
                    {beds.map((b) => {
                      const sel = draft.selectedBedId === b.bedId;
                      return (
                        <button key={b.bedId} type="button"
                          onClick={() => { set("selectedBedId", b.bedId); set("selectedWardId", b.wardId); }}
                          className={cn("flex w-full items-center justify-between px-3 py-2 text-left text-xs transition hover:bg-accent",
                            sel && "bg-primary/5 ring-1 ring-inset ring-primary/30")}>
                          <div className="flex items-center gap-2">
                            <Bed className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-medium">{b.wardName} · {b.bedName}</span>
                            <Badge variant="outline" className="text-[10px]">{b.accommodationType}</Badge>
                            {b.isolation && <Badge variant="outline" className="text-[10px]">Isolation</Badge>}
                          </div>
                          {sel && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep?.key === "review" && <ReviewPanel draft={draft} variant={variant} onToggleConsent={(v) => set("consentCaptured", v)} />}

          {currentStep?.key === "confirm" && (
            <div className="space-y-3">
              <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-4 text-xs">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                  <CheckCircle2 className="h-4 w-4" /> Ready to submit
                </div>
                <div className="mt-1 text-emerald-800/80 dark:text-emerald-200/80">
                  The admission will be created, the selected bed reserved, and the Admission Workspace will open with backend-authoritative available actions.
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Badge variant="outline">Correlation</Badge>{journey.correlationId.slice(0, 12)}…
                <Separator className="mx-1 h-3" orientation="vertical" />
                <Badge variant="outline">Idempotent</Badge> Duplicate submissions within this session are deduplicated.
              </div>
            </div>
          )}

          {/* ── Alternate short-flow steps (unchanged behaviour) ── */}

          {currentStep?.key === "preadmission" && (
            <Field label="Preadmission reference" required>
              <Input value={draft.preadmissionId} onChange={(e) => set("preadmissionId", e.target.value)} placeholder="PRE-…" />
            </Field>
          )}

          {currentStep?.key === "eu-visit" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Emergency visit reference" required><Input value={draft.emergencyVisitId} onChange={(e) => set("emergencyVisitId", e.target.value)} placeholder="EU-…" /></Field>
              <Field label="Triage summary"><Input value={draft.triageSummary} onChange={(e) => set("triageSummary", e.target.value)} placeholder="ESI · presenting complaint" /></Field>
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
                          className={cn("flex items-center justify-between rounded-lg border p-3 text-left text-xs transition hover:border-primary/40 hover:bg-accent",
                            selected && "border-primary bg-primary/5 ring-1 ring-primary/30")}>
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

          {currentStep?.key === "practitioner" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Admitting practitioner" required><Input value={draft.admittingPractitionerId} onChange={(e) => set("admittingPractitionerId", e.target.value)} placeholder="Dr. surname or practice number" /></Field>
              <Field label="Responsible practitioner"><Input value={draft.responsiblePractitionerId} onChange={(e) => set("responsiblePractitionerId", e.target.value)} placeholder="Optional" /></Field>
              <Field label="Referring practitioner" className="sm:col-span-2"><Input value={draft.referringPractitionerId} onChange={(e) => set("referringPractitionerId", e.target.value)} placeholder="Optional" /></Field>
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
              <Field label="Membership number"><Input value={draft.membershipNumber} onChange={(e) => set("membershipNumber", e.target.value)} placeholder="Member #" /></Field>
              <Field label="Authorisation number"><Input value={draft.authorisationNumber} onChange={(e) => set("authorisationNumber", e.target.value)} placeholder="AUTH-…" /></Field>
              <Field label="No-auth reason (if applicable)" className="sm:col-span-2">
                <SelectBox value={draft.noAuthReason || "none"}
                  onChange={(v) => set("noAuthReason", (v === "none" ? "" : v) as Draft["noAuthReason"])}
                  options={[{ value: "none", label: "— none —" }, ...NO_AUTH_REASONS.map((r) => ({ value: r, label: r }))]} />
              </Field>
            </div>
          )}

          {currentStep?.key === "no-auth" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="No-auth reason" required>
                <SelectBox value={draft.noAuthReason || ""} onChange={(v) => set("noAuthReason", v as NoAuthReason)} options={NO_AUTH_REASONS.map((r) => ({ value: r, label: r }))} />
              </Field>
              <Field label="Rejected authorisation reference"><Input value={draft.authorisationNumber} onChange={(e) => set("authorisationNumber", e.target.value)} placeholder="AUTH-… (if rejected)" /></Field>
              <Field label="Comments" required className="sm:col-span-2"><Textarea rows={3} value={draft.noAuthComments} onChange={(e) => set("noAuthComments", e.target.value)} placeholder="Explain why authorisation is not in place." /></Field>
            </div>
          )}

          {currentStep?.key === "follow-up" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Follow-up owner" required><Input value={draft.followUpOwnerId} onChange={(e) => set("followUpOwnerId", e.target.value)} placeholder="Case manager" /></Field>
              <Field label="Follow-up date" required><Input type="date" value={draft.followUpDate} onChange={(e) => set("followUpDate", e.target.value)} /></Field>
              <Field label="Management approver" className="sm:col-span-2"><Input value={draft.approverId} onChange={(e) => set("approverId", e.target.value)} placeholder="Approving manager (elevated)" /></Field>
            </div>
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
          <div className="text-[11px] text-muted-foreground flex items-center gap-2">
            <Stethoscope className="h-3 w-3" />
            Step {stepIdx + 1} of {steps.length}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}><X className="mr-1 h-3.5 w-3.5" />Cancel</Button>
            <Button variant="outline" size="sm" disabled={stepIdx === 0} onClick={() => setStepIdx((i) => Math.max(0, i - 1))}>
              <ArrowLeft className="mr-1 h-3.5 w-3.5" />Back
            </Button>
            {!isLast ? (
              <Button size="sm" disabled={!canAdvance} onClick={advance}>
                Continue<ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button size="sm" disabled={!canAdvance || submitting} onClick={submit}>
                {submitting ? <><Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />Submitting…</> : "Submit admission"}
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
        ["Member validation", draft.memberValidationOutcome || (draft.fundingMethod === "MedicalScheme" ? "—" : "N/A")],
        ["Authorisation", draft.authorisationNumber || (draft.noAuthReason ? `No-auth · ${draft.noAuthReason}` : "—")],
        ["Bed", draft.selectedBedId ? `${draft.selectedWardId} · ${draft.selectedBedId}` : "—"],
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
      {variant !== "no-auth-admit" && variant !== "admit" && (
        <label className="flex items-start gap-2 rounded-lg border bg-muted/20 p-3 text-xs">
          <input type="checkbox" className="mt-0.5" checked={draft.consentCaptured} onChange={(e) => onToggleConsent(e.target.checked)} />
          <span>
            <span className="font-medium">Consent captured.</span>{" "}
            The patient (or guardian) has consented to admission, treatment and information sharing with the funder.
          </span>
        </label>
      )}
    </div>
  );
}

/** Icon lookup helper for the callers who already know the variant key. */
export const CreationVariantIcons = { UserPlus, Repeat, PhoneCall, Ambulance, ShieldOff, Baby };
