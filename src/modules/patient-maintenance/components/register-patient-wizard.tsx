/**
 * Register Patient — 15-step guided wizard.
 * Modal-constrained: fixed header + stepper, scrollable body, fixed footer.
 * Mock-only. Uses patientMaintenanceService to persist the registration.
 */
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, Building2, Check, CheckCircle2, ClipboardList,
  FileText, Loader2, Printer, Save, Search as SearchIcon, ShieldAlert,
  UserPlus, X, AlertTriangle, HeartPulse, IdCard, Users, MapPin,
  Wallet, FileSignature, ListChecks,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
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
import { formatDateZA } from "@/lib/format";
import { usePatientMaintenanceJourney } from "@/modules/patient-maintenance/state/journey-context";
import { patientMaintenanceService } from "@/services/modules/patient-maintenance.service";
import {
  PM_COUNTRIES, PM_FACILITIES, PM_LANGUAGES, PM_MARITAL, PM_NATIONALITIES,
  PM_PROVINCES, PM_SCHEMES, PM_TITLES,
} from "@/modules/patient-maintenance/mock/patient-maintenance-mock-data";
import type {
  Address, CreatePatientInput, DuplicateMatch, FundingMethod, IdentifierType,
  PatientRecord, PatientType, PreferredChannel,
} from "@/modules/patient-maintenance/contracts";

type StepKey =
  | "facility" | "search" | "duplicates" | "decision" | "identity"
  | "demographics" | "contact" | "relationships" | "funding" | "funding-detail"
  | "consent" | "documents" | "validation" | "review" | "complete";

const STEPS: Array<{ key: StepKey; title: string; hint: string; icon: typeof UserPlus }> = [
  { key: "facility",       title: "Facility",             hint: "Select the authorised facility.",         icon: Building2 },
  { key: "search",         title: "Search person",        hint: "Check if the patient already exists.",    icon: SearchIcon },
  { key: "duplicates",     title: "Possible duplicates",  hint: "Review matches before creating.",         icon: ShieldAlert },
  { key: "decision",       title: "Registration decision",hint: "Reuse existing or create new.",           icon: ClipboardList },
  { key: "identity",       title: "Country & identity",   hint: "Country, type, identifier.",              icon: IdCard },
  { key: "demographics",   title: "Demographics",         hint: "Name, DOB, sex, nationality.",            icon: UserPlus },
  { key: "contact",        title: "Contact & address",    hint: "Phone, email, address.",                  icon: MapPin },
  { key: "relationships",  title: "Relationships",        hint: "Next of kin, guarantor, employer, GP.",   icon: Users },
  { key: "funding",        title: "Funding method",       hint: "How care will be funded.",                icon: Wallet },
  { key: "funding-detail", title: "Funding details",      hint: "Scheme / policy / COID specifics.",       icon: Wallet },
  { key: "consent",        title: "Consent & privacy",    hint: "POPIA, treatment and communication.",     icon: FileSignature },
  { key: "documents",      title: "Documents",            hint: "Attach supporting documents (mock).",     icon: FileText },
  { key: "validation",     title: "Validation",           hint: "Blocking errors and warnings.",           icon: ListChecks },
  { key: "review",         title: "Review",               hint: "Final summary before saving.",            icon: CheckCircle2 },
  { key: "complete",       title: "Complete",             hint: "MRN issued and profile ready.",           icon: Check },
];

type Draft = {
  facility: string;
  // search
  searchQuery: string;
  duplicatesRun: boolean;
  overrideAck: boolean;
  overrideReason: string;
  // decision
  decision: "" | "existing" | "new";
  existingId: string;
  // identity
  country: string;
  patientType: PatientType;
  identifierType: IdentifierType;
  identifierValue: string;
  identifierUnavailableReason: string;
  // demographics
  title: string; firstName: string; middleNames: string; surname: string;
  previousSurname: string; initials: string; dateOfBirth: string;
  sex: "M" | "F" | "X" | "";
  maritalStatus: string; nationality: string; language: string;
  // contact
  mobile: string; alternatePhone: string; email: string;
  preferredChannel: PreferredChannel;
  resLine1: string; resSuburb: string; resCity: string; resProvince: string; resPostal: string;
  postalSameAsResidential: boolean;
  postLine1: string; postSuburb: string; postCity: string; postProvince: string; postPostal: string;
  // relationships
  nokName: string; nokRelationship: string; nokPhone: string;
  guarantorName: string; guarantorPhone: string;
  employerName: string;
  gpName: string; gpPhone: string;
  // funding
  fundingMethod: FundingMethod | "";
  schemeName: string; planOption: string; membershipNumber: string;
  dependantCode: string; principalMember: string;
  policyReference: string; responsibleOrganisation: string;
  coidEmployer: string; coidAccidentDate: string; coidClaimNumber: string; coidInjury: string;
  // consent
  privacyAck: boolean; treatmentConsent: boolean; communicationConsent: boolean;
  signerName: string; signerRelationship: string; digitalSignatureAck: boolean;
  // documents
  attachIdDoc: boolean; attachAidCard: boolean; attachConsent: boolean; attachImage: boolean;
};

function emptyDraft(facility: string): Draft {
  return {
    facility,
    searchQuery: "",
    duplicatesRun: false,
    overrideAck: false,
    overrideReason: "",
    decision: "",
    existingId: "",
    country: "South Africa",
    patientType: "Private",
    identifierType: "SA ID",
    identifierValue: "",
    identifierUnavailableReason: "",
    title: "Mr",
    firstName: "", middleNames: "", surname: "", previousSurname: "", initials: "",
    dateOfBirth: "",
    sex: "",
    maritalStatus: "Single", nationality: "South African", language: "English",
    mobile: "", alternatePhone: "", email: "",
    preferredChannel: "SMS",
    resLine1: "", resSuburb: "", resCity: "", resProvince: "Gauteng", resPostal: "",
    postalSameAsResidential: true,
    postLine1: "", postSuburb: "", postCity: "", postProvince: "Gauteng", postPostal: "",
    nokName: "", nokRelationship: "", nokPhone: "",
    guarantorName: "", guarantorPhone: "",
    employerName: "",
    gpName: "", gpPhone: "",
    fundingMethod: "",
    schemeName: "", planOption: "", membershipNumber: "",
    dependantCode: "", principalMember: "",
    policyReference: "", responsibleOrganisation: "",
    coidEmployer: "", coidAccidentDate: "", coidClaimNumber: "", coidInjury: "",
    privacyAck: false, treatmentConsent: false, communicationConsent: false,
    signerName: "", signerRelationship: "Self", digitalSignatureAck: false,
    attachIdDoc: false, attachAidCard: false, attachConsent: false, attachImage: false,
  };
}

type Issue = { level: "error" | "warning"; step: StepKey; message: string };

function isEmail(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function isSaPhone(v: string) { return /^(\+27|0)[6-8][0-9](\s?\d){7}$/.test(v.replace(/\s+/g, "")); }
function isSaId13(v: string) { return /^\d{13}$/.test(v); }

function validateAll(d: Draft): Issue[] {
  const errs: Issue[] = [];
  if (!d.facility) errs.push({ level: "error", step: "facility", message: "Facility is required." });
  if (d.decision === "new" && !d.duplicatesRun) errs.push({ level: "error", step: "duplicates", message: "Duplicate search must be completed before creating a new patient." });
  if (!d.decision) errs.push({ level: "error", step: "decision", message: "Registration decision is required." });
  if (!d.country) errs.push({ level: "error", step: "identity", message: "Country is required." });
  if (!d.patientType) errs.push({ level: "error", step: "identity", message: "Patient type is required." });
  if (d.identifierType === "SA ID" && d.identifierValue && !isSaId13(d.identifierValue)) errs.push({ level: "error", step: "identity", message: "SA ID must be 13 digits." });
  if (d.identifierType === "Passport" && !d.identifierValue) errs.push({ level: "error", step: "identity", message: "Passport number is required." });
  if (d.identifierType !== "None" && !d.identifierValue && !d.identifierUnavailableReason) errs.push({ level: "error", step: "identity", message: "Identifier value or an approved unavailable reason is required." });
  if (!d.firstName.trim()) errs.push({ level: "error", step: "demographics", message: "First name is required." });
  if (!d.surname.trim()) errs.push({ level: "error", step: "demographics", message: "Surname is required." });
  if (!d.sex) errs.push({ level: "error", step: "demographics", message: "Sex / gender is required." });
  if (!d.dateOfBirth) errs.push({ level: "error", step: "demographics", message: "Date of birth is required." });
  if (d.dateOfBirth && new Date(d.dateOfBirth).getTime() > Date.now()) errs.push({ level: "error", step: "demographics", message: "Date of birth cannot be in the future." });
  if (d.email && !isEmail(d.email)) errs.push({ level: "error", step: "contact", message: "Email address format is invalid." });
  if (d.mobile && !isSaPhone(d.mobile)) errs.push({ level: "warning", step: "contact", message: "Mobile does not match a standard SA phone format." });
  if (!d.fundingMethod) errs.push({ level: "error", step: "funding", message: "Funding method is required." });
  if (d.fundingMethod === "Medical Scheme") {
    if (!d.schemeName) errs.push({ level: "error", step: "funding-detail", message: "Scheme is required for medical scheme funding." });
    if (!d.membershipNumber) errs.push({ level: "error", step: "funding-detail", message: "Membership number is required for medical scheme funding." });
    if (!d.dependantCode) errs.push({ level: "error", step: "funding-detail", message: "Dependant code is required for medical scheme funding." });
  }
  if (d.fundingMethod === "COID") {
    if (!d.coidEmployer) errs.push({ level: "error", step: "funding-detail", message: "Employer is required for COID." });
    if (!d.coidAccidentDate) errs.push({ level: "error", step: "funding-detail", message: "Accident date is required for COID." });
    if (!d.coidClaimNumber) errs.push({ level: "error", step: "funding-detail", message: "Claim / reference number is required for COID." });
  }
  if (!d.privacyAck) errs.push({ level: "error", step: "consent", message: "POPIA / privacy acknowledgement is required." });
  if (!d.treatmentConsent) errs.push({ level: "error", step: "consent", message: "General treatment consent is required." });
  return errs;
}

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCompleted?: (record: PatientRecord) => void;
  onOpenProfile?: (id: string) => void;
};

export function RegisterPatientWizard({ open, onOpenChange, onCompleted, onOpenProfile }: Props) {
  const journey = usePatientMaintenanceJourney();
  const [stepIdx, setStepIdx] = useState(0);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(journey.facility ?? PM_FACILITIES[0]));
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState<PatientRecord | null>(null);

  useEffect(() => {
    if (open) {
      const fresh = emptyDraft(journey.facility ?? PM_FACILITIES[0]);
      setDraft(fresh);
      setStepIdx(0);
      setIssued(null);
      const { draftId } = patientMaintenanceService.createDraft();
      journey.startJourney("register-patient", draftId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const step = STEPS[stepIdx];
  const issues = useMemo(() => validateAll(draft), [draft]);
  const stepBlockers = issues.filter((i) => i.step === step.key && i.level === "error");

  const duplicates: DuplicateMatch[] = useMemo(() => {
    if (!draft.searchQuery && !draft.identifierValue && !draft.surname && !draft.dateOfBirth) return [];
    return patientMaintenanceService.searchDuplicates({
      identifierValue: draft.identifierValue || draft.searchQuery,
      firstName: draft.firstName,
      surname: draft.surname || draft.searchQuery,
      dateOfBirth: draft.dateOfBirth,
      phone: draft.mobile,
    });
  }, [draft.searchQuery, draft.identifierValue, draft.firstName, draft.surname, draft.dateOfBirth, draft.mobile]);

  const patch = (p: Partial<Draft>) => setDraft((prev) => ({ ...prev, ...p }));

  const goNext = () => {
    // Step-local hard blockers
    if (step.key === "facility" && !draft.facility) return toast.error("Select a facility to continue.");
    if (step.key === "duplicates" && duplicates.some((d) => d.strength === "Probable") && !draft.overrideAck)
      return toast.error("Acknowledge probable matches or select an existing record.");
    if (step.key === "decision" && !draft.decision) return toast.error("Select a registration decision.");
    if (step.key === "decision" && draft.decision === "existing" && !draft.existingId) return toast.error("Select the existing patient to reuse.");
    if (step.key === "decision" && draft.decision === "existing") {
      // Short-circuit: reuse existing, do not continue to create.
      onOpenProfile?.(draft.existingId);
      toast.success("Opened existing patient profile — no duplicate created.");
      onOpenChange(false);
      return;
    }
    if (stepBlockers.length > 0) return toast.error(stepBlockers[0].message);
    journey.markStepComplete(step.key);
    setStepIdx((i) => Math.min(STEPS.length - 1, i + 1));
  };
  const goBack = () => setStepIdx((i) => Math.max(0, i - 1));

  const confirm = () => {
    const blocking = issues.filter((i) => i.level === "error");
    if (blocking.length) {
      toast.error("Fix blocking validations before confirming.", { description: blocking[0].message });
      setStepIdx(STEPS.findIndex((s) => s.key === blocking[0].step));
      return;
    }
    setBusy(true);
    const residential: Address = { line1: draft.resLine1, suburb: draft.resSuburb, city: draft.resCity, province: draft.resProvince, postalCode: draft.resPostal, country: draft.country };
    const postal: Address = draft.postalSameAsResidential ? residential : { line1: draft.postLine1, suburb: draft.postSuburb, city: draft.postCity, province: draft.postProvince, postalCode: draft.postPostal, country: draft.country };
    const input: CreatePatientInput = {
      facility: draft.facility,
      patientType: draft.patientType,
      country: draft.country,
      identifierType: draft.identifierType,
      identifierValue: draft.identifierValue || undefined,
      identifierUnavailableReason: draft.identifierUnavailableReason || undefined,
      title: draft.title,
      firstName: draft.firstName.trim(),
      middleNames: draft.middleNames || undefined,
      surname: draft.surname.trim(),
      previousSurname: draft.previousSurname || undefined,
      initials: draft.initials || `${draft.firstName[0] ?? ""}`.toUpperCase(),
      dateOfBirth: draft.dateOfBirth,
      sex: (draft.sex || "X") as "M" | "F" | "X",
      maritalStatus: draft.maritalStatus,
      nationality: draft.nationality,
      language: draft.language,
      contact: {
        mobile: draft.mobile || undefined,
        alternatePhone: draft.alternatePhone || undefined,
        email: draft.email || undefined,
        preferredChannel: draft.preferredChannel,
        residentialAddress: residential,
        postalAddress: postal,
        postalSameAsResidential: draft.postalSameAsResidential,
      },
      relationships: [
        draft.nokName ? { kind: "Next of kin" as const, name: draft.nokName, relationship: draft.nokRelationship, phone: draft.nokPhone } : null,
        draft.guarantorName ? { kind: "Guarantor" as const, name: draft.guarantorName, phone: draft.guarantorPhone } : null,
        draft.employerName ? { kind: "Employer" as const, name: draft.employerName } : null,
        draft.gpName ? { kind: "Family practitioner" as const, name: draft.gpName, phone: draft.gpPhone } : null,
      ].filter((x): x is NonNullable<typeof x> => x !== null),
      funding: {
        method: (draft.fundingMethod || "Private / Cash") as FundingMethod,
        schemeName: draft.schemeName || undefined,
        planOption: draft.planOption || undefined,
        membershipNumber: draft.membershipNumber || undefined,
        dependantCode: draft.dependantCode || undefined,
        principalMember: draft.principalMember || undefined,
        guarantorName: draft.guarantorName || undefined,
        policyReference: draft.policyReference || undefined,
        responsibleOrganisation: draft.responsibleOrganisation || undefined,
        employer: draft.coidEmployer || undefined,
        accidentDate: draft.coidAccidentDate || undefined,
        claimNumber: draft.coidClaimNumber || undefined,
        injuryDescription: draft.coidInjury || undefined,
      },
      consent: {
        privacyAcknowledged: draft.privacyAck,
        treatmentConsent: draft.treatmentConsent,
        communicationConsent: draft.communicationConsent,
        signerName: draft.signerName || `${draft.firstName} ${draft.surname}`.trim(),
        signerRelationship: draft.signerRelationship,
        digitalSignatureAcknowledged: draft.digitalSignatureAck,
        capturedAt: new Date().toISOString(),
      },
    };
    const record = patientMaintenanceService.registerPatient(input, "Reception · current user");
    window.setTimeout(() => {
      setIssued(record);
      setStepIdx(STEPS.length - 1);
      setBusy(false);
      onCompleted?.(record);
      toast.success(`Patient registered — MRN ${record.mrn} issued.`);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100vh-2rem)] w-[min(1100px,calc(100vw-2rem))] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-h-[calc(100vh-4rem)]">
        <DialogHeader className="shrink-0 border-b bg-gradient-to-r from-primary/10 via-transparent to-transparent px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-background/80 shadow-sm ring-1 ring-border">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg">Register patient</DialogTitle>
              <DialogDescription className="text-xs">
                Duplicate-safe registration with demographics, funding, consent and documents.
              </DialogDescription>
            </div>
            <Badge variant="outline" className="ml-auto gap-1"><Building2 className="h-3 w-3" />{draft.facility || "No facility"}</Badge>
          </div>
        </DialogHeader>

        <Stepper steps={STEPS} activeIdx={stepIdx} completed={journey.completedSteps} onJump={(i) => i <= stepIdx && setStepIdx(i)} />

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step.key === "facility" && (
            <StepShell title="Select facility" icon={Building2}>
              <Field label="Facility" required>
                <SelectBox value={draft.facility} onChange={(v) => { patch({ facility: v }); journey.setFacility(v); }}
                  options={PM_FACILITIES.map((f) => ({ value: f, label: f }))} />
              </Field>
              <p className="text-xs text-muted-foreground">Search scope and audit will be recorded against this facility.</p>
            </StepShell>
          )}

          {step.key === "search" && (
            <StepShell title="Search for existing person" icon={SearchIcon}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Free-text search"><Input value={draft.searchQuery} onChange={(e) => patch({ searchQuery: e.target.value })} placeholder="Name, MRN, ID, email…" /></Field>
                <Field label="Mobile"><Input value={draft.mobile} onChange={(e) => patch({ mobile: e.target.value })} placeholder="+27 82 555 0141" /></Field>
                <Field label="SA ID / Passport"><Input value={draft.identifierValue} onChange={(e) => patch({ identifierValue: e.target.value })} /></Field>
                <Field label="Date of birth"><Input type="date" value={draft.dateOfBirth} onChange={(e) => patch({ dateOfBirth: e.target.value })} /></Field>
                <Field label="Surname"><Input value={draft.surname} onChange={(e) => patch({ surname: e.target.value })} /></Field>
                <Field label="First name"><Input value={draft.firstName} onChange={(e) => patch({ firstName: e.target.value })} /></Field>
              </div>
              <Button variant="outline" size="sm" onClick={() => { patch({ duplicatesRun: true }); setStepIdx((i) => i + 1); toast.success("Duplicate search executed."); }}>
                <SearchIcon className="mr-1 h-3.5 w-3.5" />Run duplicate search
              </Button>
            </StepShell>
          )}

          {step.key === "duplicates" && (
            <StepShell title="Possible duplicates" icon={ShieldAlert}>
              {duplicates.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                  No possible duplicates found. Safe to create a new record.
                </div>
              ) : (
                <div className="space-y-2">
                  {duplicates.map((d) => (
                    <div key={d.patient.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card p-3 text-xs">
                      <div className="min-w-0">
                        <div className="font-medium">{d.patient.firstName} {d.patient.surname} <span className="ml-1 font-mono text-[11px] text-muted-foreground">{d.patient.mrn}</span></div>
                        <div className="text-[11px] text-muted-foreground">DOB {d.patient.dateOfBirth} · {d.patient.facility} · matched on {d.matchedOn.join(", ")}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn(
                          "text-[10px]",
                          d.strength === "Exact" && "border-rose-400/50 text-rose-600 dark:text-rose-400",
                          d.strength === "Probable" && "border-amber-400/50 text-amber-600 dark:text-amber-400",
                          d.strength === "Possible" && "border-sky-400/50 text-sky-600 dark:text-sky-400",
                        )}>{d.strength} · {d.confidence}%</Badge>
                        <Button size="sm" variant="outline" onClick={() => { patch({ decision: "existing", existingId: d.patient.id }); setStepIdx(STEPS.findIndex((s) => s.key === "decision")); toast.info("Existing patient selected."); }}>
                          Use existing
                        </Button>
                      </div>
                    </div>
                  ))}
                  {duplicates.some((d) => d.strength !== "Possible") && (
                    <div className="mt-2 rounded-lg border border-amber-400/40 bg-amber-500/5 p-3 text-xs">
                      <div className="flex items-center gap-2 font-medium text-amber-700 dark:text-amber-400"><AlertTriangle className="h-3.5 w-3.5" /> Probable / exact matches present</div>
                      <label className="mt-2 flex items-start gap-2">
                        <Checkbox checked={draft.overrideAck} onCheckedChange={(v) => patch({ overrideAck: !!v })} />
                        <span>I have reviewed the matches and confirm they are not the same person.</span>
                      </label>
                      {draft.overrideAck && (
                        <Textarea className="mt-2 text-xs" rows={2} value={draft.overrideReason}
                          onChange={(e) => patch({ overrideReason: e.target.value })} placeholder="Reason for creating a new record" />
                      )}
                    </div>
                  )}
                </div>
              )}
            </StepShell>
          )}

          {step.key === "decision" && (
            <StepShell title="Registration decision" icon={ClipboardList}>
              <Field label="Decision" required>
                <SelectBox value={draft.decision || "unset"} onChange={(v) => patch({ decision: v === "unset" ? "" : (v as "existing" | "new") })}
                  options={[{ value: "unset", label: "— Select decision —" }, { value: "existing", label: "Reuse existing patient" }, { value: "new", label: "Create new patient" }]} />
              </Field>
              {draft.decision === "existing" && (
                <Field label="Existing patient ID">
                  <Input value={draft.existingId} onChange={(e) => patch({ existingId: e.target.value })} placeholder="e.g. P-10241" />
                </Field>
              )}
              {draft.decision === "new" && !draft.duplicatesRun && (
                <div className="rounded-lg border border-rose-400/40 bg-rose-500/5 p-3 text-xs text-rose-600 dark:text-rose-400">
                  Run the duplicate search first before creating a new record.
                </div>
              )}
            </StepShell>
          )}

          {step.key === "identity" && (
            <StepShell title="Country & identity" icon={IdCard}>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Country" required><SelectBox value={draft.country} onChange={(v) => patch({ country: v })} options={PM_COUNTRIES.map((c) => ({ value: c, label: c }))} /></Field>
                <Field label="Patient type" required><SelectBox value={draft.patientType} onChange={(v) => patch({ patientType: v as PatientType })} options={["Public","Private","Emergency","Neonate","Foreign national"].map((t) => ({ value: t, label: t }))} /></Field>
                <Field label="Identifier type" required><SelectBox value={draft.identifierType} onChange={(v) => patch({ identifierType: v as IdentifierType })} options={["SA ID","Passport","Refugee permit","Asylum","None"].map((t) => ({ value: t, label: t }))} /></Field>
                <Field label="Identifier value"><Input value={draft.identifierValue} onChange={(e) => patch({ identifierValue: e.target.value })} placeholder={draft.identifierType === "SA ID" ? "13 digits" : ""} /></Field>
                <Field label="Unavailable reason (if identifier missing)" className="sm:col-span-2">
                  <Input value={draft.identifierUnavailableReason} onChange={(e) => patch({ identifierUnavailableReason: e.target.value })} placeholder="e.g. Unconscious emergency patient" />
                </Field>
              </div>
            </StepShell>
          )}

          {step.key === "demographics" && (
            <StepShell title="Demographics" icon={UserPlus}>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Title"><SelectBox value={draft.title} onChange={(v) => patch({ title: v })} options={PM_TITLES.map((t) => ({ value: t, label: t }))} /></Field>
                <Field label="First name" required><Input value={draft.firstName} onChange={(e) => patch({ firstName: e.target.value })} /></Field>
                <Field label="Middle names"><Input value={draft.middleNames} onChange={(e) => patch({ middleNames: e.target.value })} /></Field>
                <Field label="Surname" required><Input value={draft.surname} onChange={(e) => patch({ surname: e.target.value })} /></Field>
                <Field label="Previous surname"><Input value={draft.previousSurname} onChange={(e) => patch({ previousSurname: e.target.value })} /></Field>
                <Field label="Initials"><Input value={draft.initials} onChange={(e) => patch({ initials: e.target.value })} placeholder="Auto" /></Field>
                <Field label="Date of birth" required><Input type="date" value={draft.dateOfBirth} onChange={(e) => patch({ dateOfBirth: e.target.value })} /></Field>
                <Field label="Sex / gender" required><SelectBox value={draft.sex || "unset"} onChange={(v) => patch({ sex: v === "unset" ? "" : (v as "M" | "F" | "X") })} options={[{ value: "unset", label: "— Select —" }, { value: "F", label: "Female" }, { value: "M", label: "Male" }, { value: "X", label: "Other" }]} /></Field>
                <Field label="Marital status"><SelectBox value={draft.maritalStatus} onChange={(v) => patch({ maritalStatus: v })} options={PM_MARITAL.map((m) => ({ value: m, label: m }))} /></Field>
                <Field label="Nationality"><SelectBox value={draft.nationality} onChange={(v) => patch({ nationality: v })} options={PM_NATIONALITIES.map((n) => ({ value: n, label: n }))} /></Field>
                <Field label="Language"><SelectBox value={draft.language} onChange={(v) => patch({ language: v })} options={PM_LANGUAGES.map((l) => ({ value: l, label: l }))} /></Field>
              </div>
            </StepShell>
          )}

          {step.key === "contact" && (
            <StepShell title="Contact & address" icon={MapPin}>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Mobile"><Input value={draft.mobile} onChange={(e) => patch({ mobile: e.target.value })} placeholder="+27 82 555 0141" /></Field>
                <Field label="Alternate phone"><Input value={draft.alternatePhone} onChange={(e) => patch({ alternatePhone: e.target.value })} /></Field>
                <Field label="Email"><Input value={draft.email} onChange={(e) => patch({ email: e.target.value })} /></Field>
                <Field label="Preferred channel"><SelectBox value={draft.preferredChannel} onChange={(v) => patch({ preferredChannel: v as PreferredChannel })} options={["Phone","SMS","Email","WhatsApp"].map((c) => ({ value: c, label: c }))} /></Field>
              </div>
              <div className="mt-2 rounded-lg border p-3">
                <div className="mb-2 text-xs font-medium">Residential address</div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Street"><Input value={draft.resLine1} onChange={(e) => patch({ resLine1: e.target.value })} /></Field>
                  <Field label="Suburb"><Input value={draft.resSuburb} onChange={(e) => patch({ resSuburb: e.target.value })} /></Field>
                  <Field label="City"><Input value={draft.resCity} onChange={(e) => patch({ resCity: e.target.value })} /></Field>
                  <Field label="Province"><SelectBox value={draft.resProvince} onChange={(v) => patch({ resProvince: v })} options={PM_PROVINCES.map((p) => ({ value: p, label: p }))} /></Field>
                  <Field label="Postal code"><Input value={draft.resPostal} onChange={(e) => patch({ resPostal: e.target.value })} /></Field>
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs">
                <Checkbox checked={draft.postalSameAsResidential} onCheckedChange={(v) => patch({ postalSameAsResidential: !!v })} />
                Postal address is the same as residential
              </label>
              {!draft.postalSameAsResidential && (
                <div className="rounded-lg border p-3">
                  <div className="mb-2 text-xs font-medium">Postal address</div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Street"><Input value={draft.postLine1} onChange={(e) => patch({ postLine1: e.target.value })} /></Field>
                    <Field label="Suburb"><Input value={draft.postSuburb} onChange={(e) => patch({ postSuburb: e.target.value })} /></Field>
                    <Field label="City"><Input value={draft.postCity} onChange={(e) => patch({ postCity: e.target.value })} /></Field>
                    <Field label="Province"><SelectBox value={draft.postProvince} onChange={(v) => patch({ postProvince: v })} options={PM_PROVINCES.map((p) => ({ value: p, label: p }))} /></Field>
                    <Field label="Postal code"><Input value={draft.postPostal} onChange={(e) => patch({ postPostal: e.target.value })} /></Field>
                  </div>
                </div>
              )}
            </StepShell>
          )}

          {step.key === "relationships" && (
            <StepShell title="Relationships" icon={Users}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Next of kin — name"><Input value={draft.nokName} onChange={(e) => patch({ nokName: e.target.value })} /></Field>
                <Field label="Relationship"><Input value={draft.nokRelationship} onChange={(e) => patch({ nokRelationship: e.target.value })} placeholder="e.g. Spouse" /></Field>
                <Field label="Next of kin phone"><Input value={draft.nokPhone} onChange={(e) => patch({ nokPhone: e.target.value })} /></Field>
                <Field label="Guarantor name"><Input value={draft.guarantorName} onChange={(e) => patch({ guarantorName: e.target.value })} /></Field>
                <Field label="Guarantor phone"><Input value={draft.guarantorPhone} onChange={(e) => patch({ guarantorPhone: e.target.value })} /></Field>
                <Field label="Employer"><Input value={draft.employerName} onChange={(e) => patch({ employerName: e.target.value })} /></Field>
                <Field label="Family practitioner"><Input value={draft.gpName} onChange={(e) => patch({ gpName: e.target.value })} /></Field>
                <Field label="GP phone"><Input value={draft.gpPhone} onChange={(e) => patch({ gpPhone: e.target.value })} /></Field>
              </div>
            </StepShell>
          )}

          {step.key === "funding" && (
            <StepShell title="Funding method" icon={Wallet}>
              <div className="grid gap-2 sm:grid-cols-2">
                {(["Medical Scheme","Private / Cash","Government","Insurance","COID"] as FundingMethod[]).map((m) => (
                  <button key={m} type="button" onClick={() => patch({ fundingMethod: m })}
                    className={cn("rounded-lg border p-3 text-left text-xs shadow-sm transition",
                      draft.fundingMethod === m ? "border-primary bg-primary/5" : "hover:border-primary/40 hover:bg-accent/40")}>
                    <div className="font-medium">{m}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{fundingHelp(m)}</div>
                  </button>
                ))}
              </div>
            </StepShell>
          )}

          {step.key === "funding-detail" && (
            <StepShell title="Funding details" icon={Wallet}>
              {draft.fundingMethod === "Medical Scheme" && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Scheme" required><SelectBox value={draft.schemeName || "unset"} onChange={(v) => patch({ schemeName: v === "unset" ? "" : v })} options={[{ value: "unset", label: "— Select —" }, ...PM_SCHEMES.map((s) => ({ value: s, label: s }))]} /></Field>
                  <Field label="Plan / option"><Input value={draft.planOption} onChange={(e) => patch({ planOption: e.target.value })} /></Field>
                  <Field label="Membership number" required><Input value={draft.membershipNumber} onChange={(e) => patch({ membershipNumber: e.target.value })} /></Field>
                  <Field label="Dependant code" required><Input value={draft.dependantCode} onChange={(e) => patch({ dependantCode: e.target.value })} placeholder="00 = principal" /></Field>
                  <Field label="Principal member"><Input value={draft.principalMember} onChange={(e) => patch({ principalMember: e.target.value })} /></Field>
                </div>
              )}
              {draft.fundingMethod === "Private / Cash" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Guarantor"><Input value={draft.guarantorName} onChange={(e) => patch({ guarantorName: e.target.value })} /></Field>
                  <Field label="Account-responsible party"><Input value={draft.principalMember} onChange={(e) => patch({ principalMember: e.target.value })} /></Field>
                </div>
              )}
              {(draft.fundingMethod === "Government" || draft.fundingMethod === "Insurance") && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Reference / policy number"><Input value={draft.policyReference} onChange={(e) => patch({ policyReference: e.target.value })} /></Field>
                  <Field label="Responsible organisation"><Input value={draft.responsibleOrganisation} onChange={(e) => patch({ responsibleOrganisation: e.target.value })} /></Field>
                </div>
              )}
              {draft.fundingMethod === "COID" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Employer" required><Input value={draft.coidEmployer} onChange={(e) => patch({ coidEmployer: e.target.value })} /></Field>
                  <Field label="Accident date" required><Input type="date" value={draft.coidAccidentDate} onChange={(e) => patch({ coidAccidentDate: e.target.value })} /></Field>
                  <Field label="Claim / reference number" required><Input value={draft.coidClaimNumber} onChange={(e) => patch({ coidClaimNumber: e.target.value })} /></Field>
                  <Field label="Injury description" className="sm:col-span-2"><Textarea rows={3} value={draft.coidInjury} onChange={(e) => patch({ coidInjury: e.target.value })} /></Field>
                </div>
              )}
              {!draft.fundingMethod && (
                <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">Select a funding method to continue.</div>
              )}
            </StepShell>
          )}

          {step.key === "consent" && (
            <StepShell title="Consent & privacy" icon={FileSignature}>
              <div className="space-y-2 text-xs">
                <label className="flex items-start gap-2"><Checkbox checked={draft.privacyAck} onCheckedChange={(v) => patch({ privacyAck: !!v })} /><span>POPIA / privacy notice acknowledged.</span></label>
                <label className="flex items-start gap-2"><Checkbox checked={draft.treatmentConsent} onCheckedChange={(v) => patch({ treatmentConsent: !!v })} /><span>General treatment consent captured.</span></label>
                <label className="flex items-start gap-2"><Checkbox checked={draft.communicationConsent} onCheckedChange={(v) => patch({ communicationConsent: !!v })} /><span>Consent to communication via SMS / WhatsApp / email.</span></label>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Signer name"><Input value={draft.signerName} onChange={(e) => patch({ signerName: e.target.value })} placeholder="Defaults to patient" /></Field>
                <Field label="Signer relationship"><Input value={draft.signerRelationship} onChange={(e) => patch({ signerRelationship: e.target.value })} /></Field>
                <div className="flex items-end"><label className="flex items-center gap-2 text-xs"><Checkbox checked={draft.digitalSignatureAck} onCheckedChange={(v) => patch({ digitalSignatureAck: !!v })} /><span>Digital signature captured</span></label></div>
              </div>
            </StepShell>
          )}

          {step.key === "documents" && (
            <StepShell title="Documents & images" icon={FileText}>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { k: "attachIdDoc", label: "ID document (SA ID / passport)" },
                  { k: "attachAidCard", label: "Medical aid card" },
                  { k: "attachConsent", label: "Signed consent form" },
                  { k: "attachImage", label: "Patient image" },
                ].map((r) => (
                  <label key={r.k} className="flex items-center justify-between gap-2 rounded-lg border p-3 text-xs">
                    <div>{r.label}</div>
                    <Checkbox
                      checked={Boolean(draft[r.k as keyof Draft])}
                      onCheckedChange={(v) => patch({ [r.k]: !!v } as unknown as Partial<Draft>)}
                    />
                  </label>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">Attachments are simulated in this mock workspace and audited on save.</p>
            </StepShell>
          )}

          {step.key === "validation" && (
            <StepShell title="Validation" icon={ListChecks}>
              {issues.length === 0 ? (
                <div className="rounded-lg border border-emerald-400/40 bg-emerald-500/5 p-3 text-xs text-emerald-700 dark:text-emerald-400">All checks pass. Ready to review and confirm.</div>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {issues.map((i, idx) => (
                    <li key={idx} className="flex items-start justify-between gap-3 p-3 text-xs">
                      <div className="flex items-start gap-2">
                        <Badge variant="outline" className={cn("text-[10px]", i.level === "error" ? "border-rose-400/50 text-rose-600 dark:text-rose-400" : "border-amber-400/50 text-amber-600 dark:text-amber-400")}>
                          {i.level === "error" ? "Blocking" : "Warning"}
                        </Badge>
                        <div><div className="font-medium">{i.message}</div><div className="text-[11px] text-muted-foreground">Step {STEPS.findIndex((s) => s.key === i.step) + 1} · {STEPS.find((s) => s.key === i.step)?.title}</div></div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setStepIdx(STEPS.findIndex((s) => s.key === i.step))}>Fix</Button>
                    </li>
                  ))}
                </ul>
              )}
            </StepShell>
          )}

          {step.key === "review" && (
            <StepShell title="Review" icon={CheckCircle2}>
              <KV title="Identity" rows={[
                ["Facility", draft.facility],
                ["Country / patient type", `${draft.country} · ${draft.patientType}`],
                ["Identifier", `${draft.identifierType}: ${draft.identifierValue || "—"}`],
                ["Name", `${draft.title} ${draft.firstName} ${draft.surname}`],
                ["Date of birth", formatDateZA(draft.dateOfBirth)],
                ["Sex", draft.sex || "—"],
                ["Language", draft.language],
              ]} />
              <KV title="Contact" rows={[
                ["Mobile", draft.mobile || "—"],
                ["Email", draft.email || "—"],
                ["Preferred channel", draft.preferredChannel],
                ["Residential", [draft.resLine1, draft.resSuburb, draft.resCity, draft.resProvince, draft.resPostal].filter(Boolean).join(", ") || "—"],
              ]} />
              <KV title="Funding" rows={[
                ["Method", draft.fundingMethod || "—"],
                ["Scheme / policy", draft.schemeName || draft.policyReference || draft.coidClaimNumber || "—"],
                ["Membership / ref", draft.membershipNumber || draft.policyReference || draft.coidClaimNumber || "—"],
              ]} />
              <KV title="Consent" rows={[
                ["POPIA", draft.privacyAck ? "Acknowledged" : "Not acknowledged"],
                ["Treatment", draft.treatmentConsent ? "Consented" : "Not consented"],
                ["Communication", draft.communicationConsent ? "Consented" : "Declined"],
              ]} />
            </StepShell>
          )}

          {step.key === "complete" && (
            <StepShell title="Complete" icon={Check}>
              {issued ? (
                <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/5 p-5 text-center">
                  <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-600" />
                  <div className="text-sm font-semibold">Registration completed</div>
                  <div className="mt-1 text-xs text-muted-foreground">MRN <span className="font-mono">{issued.mrn}</span> issued for {issued.firstName} {issued.surname}.</div>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <Button size="sm" onClick={() => { onOpenProfile?.(issued.id); onOpenChange(false); }}>
                      <UserPlus className="mr-1 h-3.5 w-3.5" /> Open profile
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { toast.success("Registration documents printed (mock)."); window.print(); }}>
                      <Printer className="mr-1 h-3.5 w-3.5" /> Print registration
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">Confirm registration to issue an MRN.</div>
              )}
            </StepShell>
          )}
        </div>

        <div className="shrink-0 border-t bg-muted/20 px-6 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-[11px] text-muted-foreground">
              {step.hint} · Step {stepIdx + 1} of {STEPS.length}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}><X className="mr-1 h-3.5 w-3.5" />Cancel</Button>
              <Button variant="outline" size="sm" onClick={() => { toast.info("Draft saved and workflow closed (mock)."); onOpenChange(false); }}><Save className="mr-1 h-3.5 w-3.5" />Save draft & exit</Button>
              <Button variant="outline" size="sm" onClick={goBack} disabled={stepIdx === 0}><ArrowLeft className="mr-1 h-3.5 w-3.5" />Back</Button>
              {step.key !== "review" && step.key !== "complete" && (
                <Button size="sm" onClick={goNext}>Continue<ArrowRight className="ml-1 h-3.5 w-3.5" /></Button>
              )}
              {step.key === "review" && (
                <Button size="sm" onClick={confirm} disabled={busy}>
                  {busy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1 h-3.5 w-3.5" />}
                  Confirm registration
                </Button>
              )}
              {step.key === "complete" && (
                <Button size="sm" onClick={() => onOpenChange(false)}>Close</Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

void HeartPulse;

// ==================== Reusable step primitives ====================

function Stepper({ steps, activeIdx, completed, onJump }: { steps: typeof STEPS; activeIdx: number; completed: string[]; onJump: (i: number) => void }) {
  return (
    <div className="shrink-0 border-b bg-muted/30 px-4 py-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {steps.map((s, i) => {
          const isDone = completed.includes(s.key) || i < activeIdx;
          const isActive = i === activeIdx;
          return (
            <button key={s.key} type="button" onClick={() => onJump(i)}
              className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition",
                isActive ? "border-primary bg-primary text-primary-foreground shadow-sm" :
                isDone ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" :
                "border-border bg-background text-muted-foreground hover:bg-accent")}>
              <span className={cn("grid h-4 w-4 place-items-center rounded-full text-[10px] font-semibold",
                isActive ? "bg-primary-foreground/20" : isDone ? "bg-emerald-500/20" : "bg-muted")}>
                {isDone ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span className="whitespace-nowrap">{s.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepShell({ title, icon: Icon, children }: { title: string; icon: typeof UserPlus; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <header className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>
        <h3 className="text-base font-semibold">{title}</h3>
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, required, className, children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("space-y-1", className)}>
      <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}{required && <span className="text-rose-500"> *</span>}
      </Label>
      {children}
    </div>
  );
}

function SelectBox({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
      <SelectContent>{options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
    </Select>
  );
}

function KV({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
    <div className="rounded-lg border">
      <div className="border-b bg-muted/30 px-3 py-2 text-xs font-medium">{title}</div>
      <dl className="divide-y">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-3 gap-3 px-3 py-2 text-xs">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="col-span-2 font-medium">{v || "—"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function fundingHelp(m: FundingMethod): string {
  switch (m) {
    case "Medical Scheme": return "Scheme + plan, membership and dependant code.";
    case "Private / Cash": return "Guarantor and account-responsible party.";
    case "Government":     return "Reference or policy number, responsible organisation.";
    case "Insurance":      return "Policy number and insuring organisation.";
    case "COID":           return "Employer, accident date, claim / reference number.";
  }
}
