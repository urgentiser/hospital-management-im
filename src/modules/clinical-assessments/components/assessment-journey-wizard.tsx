/**
 * Assess Patient — 15-step guided clinical assessment.
 *
 * Modelled on the Admissions creation wizard modal structure:
 *   - Dialog constrained to the viewport
 *   - Fixed header
 *   - Fixed stepper / progress bar
 *   - Scrollable content area
 *   - Fixed footer with Cancel / Back / Continue / Complete
 *
 * All data is mock-only. Written to keep hooks unconditional (no early
 * returns between hooks) so the modal cannot desync.
 */
import { useEffect, useMemo, useState } from "react";
import {
  Ambulance, ArrowLeft, ArrowRight, Building2, Check, CheckCircle2,
  ClipboardList, FileText, HeartPulse, Loader2, Printer, Save,
  Search as SearchIcon, Stethoscope, UserPlus, X, AlertTriangle,
  ShieldAlert, Activity, FlaskConical, ListChecks, Layers,
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
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useClinicalAssessmentJourney } from "@/modules/clinical-assessments/state/journey-context";
import { clinicalAssessmentService } from "@/services/modules/clinical-assessment.service";
import {
  CA_ASSESSMENT_REASONS, CA_ASSESSMENT_TYPES, CA_ASSESSORS, CA_FACILITIES,
  CA_ICD_CATALOGUE, CA_CPT_CATALOGUE, CA_PATIENTS, CA_PREADMISSIONS,
} from "@/modules/clinical-assessments/mock/clinical-assessment-mock-data";
import {
  ILLNESS_LABELS, type AcuityLevel, type AssessmentRecord, type AssessmentReason,
  type AssessmentType, type ClinicalCode, type IllnessKey, type YesNo,
  type UrinalysisResult,
} from "@/modules/clinical-assessments/contracts";

type StepKey =
  | "facility" | "patient" | "integrity" | "context" | "header"
  | "general" | "treatment" | "illness" | "vitals" | "urinalysis"
  | "acuity" | "coding" | "validation" | "review" | "complete";

const STEPS: Array<{ key: StepKey; title: string; hint: string; icon: typeof Stethoscope }> = [
  { key: "facility",   title: "Facility",              hint: "Confirm the authorised hospital unit.", icon: Building2 },
  { key: "patient",    title: "Patient",               hint: "Search and select the patient.",         icon: UserPlus },
  { key: "integrity",  title: "Patient integrity",     hint: "Validate identity and acknowledge alerts.", icon: ShieldAlert },
  { key: "context",    title: "Clinical context",      hint: "Admission, preadmission, ward and locks.",  icon: Layers },
  { key: "header",     title: "Assessment header",     hint: "Type, reason, date/time and assessor.",  icon: ClipboardList },
  { key: "general",    title: "General considerations",hint: "Allergies, previous ops, culture.",      icon: FileText },
  { key: "treatment",  title: "Treatment considerations", hint: "Medication, pregnancy, lifestyle.",   icon: HeartPulse },
  { key: "illness",    title: "Previous illness",      hint: "Structured yes/no illness history.",     icon: Ambulance },
  { key: "vitals",     title: "Vital signs",           hint: "BP, pulse, respiration, SpO₂ and chest.",icon: Activity },
  { key: "urinalysis", title: "Urinalysis",            hint: "Dipstick with abnormality scoring.",     icon: FlaskConical },
  { key: "acuity",     title: "Acuity & dependency",   hint: "Care needs across all categories.",      icon: ListChecks },
  { key: "coding",     title: "Clinical coding",       hint: "ICD-10 and CPT codes for the episode.",  icon: FileText },
  { key: "validation", title: "Validation",            hint: "Blocking errors and warnings.",          icon: ShieldAlert },
  { key: "review",     title: "Review",                hint: "Full summary before completion.",        icon: CheckCircle2 },
  { key: "complete",   title: "Complete",              hint: "Save and generate the clinical record.", icon: Check },
];

type Draft = {
  facilityId: string;
  patientId: string;
  // integrity
  identifierType: "SA ID" | "Passport" | "Refugee permit" | "Asylum" | "None";
  identifierValue: string;
  identifierUnavailableReason: string;
  firstName: string; surname: string; initials: string; title: string;
  gender: "M" | "F" | "X" | "";
  dateOfBirth: string;
  alertsAcknowledged: boolean;
  duplicateWarningAcknowledged: boolean;
  // context
  admissionId: string; preadmissionId: string; medicalEventId: string;
  wardId: string; caseFolder: string; previousAssessmentId: string;
  lockAcknowledged: boolean;
  // header
  type: AssessmentType; reason: AssessmentReason;
  assessmentDate: string; assessor: string; participants: string;
  // general
  allergies: string; riskFlags: string; previousOperations: string;
  previousAnaesthetic: string; religiousRequirements: string; culturalRequirements: string;
  // treatment
  chemoRadiation: YesNo; chemoDetails: string;
  steroids: YesNo; steroidsDetails: string;
  currentMedication: string;
  pacemaker: YesNo; pacemakerDetails: string;
  smoking: YesNo; smokingDetails: string;
  alcohol: YesNo; alcoholDetails: string;
  pregnancy: YesNo; lmp: string;
  breastfeeding: YesNo; oralContraceptive: YesNo;
  elderlyConsiderations: string;
  // illness
  illness: Record<IllnessKey, {
    present: YesNo; description: string; durationType: "days" | "weeks" | "months" | "years" | "";
    duration: string; treatment: string; personalHistory: string; familyHistory: string;
  }>;
  // vitals
  systolic: string; diastolic: string;
  pulse: string; pulseDescription: string;
  respiration: string; respirationDescription: string;
  temperature: string; temperatureRoute: "Oral" | "Tympanic" | "Axillary" | "Rectal";
  spo2: string; weight: string; height: string; haemoglucose: string;
  mrsaScreening: "Positive" | "Negative" | "Pending" | "Not done";
  chestApexLeft: string; chestApexRight: string;
  chestBaseLeft: string; chestBaseRight: string;
  // urinalysis
  pH: string; specificGravity: string;
  urinalysis: Record<
    "blood" | "leucocytes" | "ketones" | "bilirubin" | "glucose" | "protein" | "haemoglobin" | "urobilinogen" | "nitrites",
    { result: UrinalysisResult; score: string }
  >;
  // acuity
  acuity: Record<
    "hygiene" | "mobility" | "nutrition" | "elimination" |
    "haemodynamic" | "oxygen" | "neurological" | "glucose" |
    "ivInfusion" | "injections" | "oralRectalVaginal" | "inhalations" |
    "woundCare" | "skinPressure" | "pain" | "diagnostics" |
    "psychosocial" | "rehabilitation",
    AcuityLevel | ""
  >;
  // coding
  selectedCodes: ClinicalCode[];
  notes: string;
};

const ILLNESS_KEYS = Object.keys(ILLNESS_LABELS) as IllnessKey[];

const ACUITY_KEYS: Array<[keyof Draft["acuity"], string]> = [
  ["hygiene", "Hygiene"], ["mobility", "Mobility"], ["nutrition", "Nutrition"], ["elimination", "Elimination"],
  ["haemodynamic", "Haemodynamic monitoring"], ["oxygen", "Oxygen therapy"], ["neurological", "Neurological"], ["glucose", "Glucose / glycaemic"],
  ["ivInfusion", "IV infusion"], ["injections", "Injections"], ["oralRectalVaginal", "Oral / rectal / vaginal medication"], ["inhalations", "Inhalations"],
  ["woundCare", "Wound care"], ["skinPressure", "Skin / pressure care"], ["pain", "Pain management"], ["diagnostics", "Diagnostic / therapeutic"],
  ["psychosocial", "Psychosocial support"], ["rehabilitation", "Rehabilitation / teaching"],
];

const emptyIllness = (): Draft["illness"] =>
  Object.fromEntries(ILLNESS_KEYS.map((k) => [k, {
    present: "" as YesNo, description: "", durationType: "" as const, duration: "",
    treatment: "", personalHistory: "", familyHistory: "",
  }])) as Draft["illness"];

const emptyUrinalysis = (): Draft["urinalysis"] => ({
  blood: { result: "", score: "" }, leucocytes: { result: "", score: "" }, ketones: { result: "", score: "" },
  bilirubin: { result: "", score: "" }, glucose: { result: "", score: "" }, protein: { result: "", score: "" },
  haemoglobin: { result: "", score: "" }, urobilinogen: { result: "", score: "" }, nitrites: { result: "", score: "" },
});

const emptyAcuity = (): Draft["acuity"] =>
  Object.fromEntries(ACUITY_KEYS.map(([k]) => [k, "" as AcuityLevel | ""])) as Draft["acuity"];

const emptyDraft = (facilityId: string): Draft => ({
  facilityId, patientId: "",
  identifierType: "SA ID", identifierValue: "", identifierUnavailableReason: "",
  firstName: "", surname: "", initials: "", title: "Mr", gender: "",
  dateOfBirth: "", alertsAcknowledged: false, duplicateWarningAcknowledged: false,
  admissionId: "", preadmissionId: "", medicalEventId: "",
  wardId: "", caseFolder: "", previousAssessmentId: "", lockAcknowledged: false,
  type: "General admission assessment", reason: "New admission",
  assessmentDate: new Date().toISOString().slice(0, 16),
  assessor: CA_ASSESSORS[0], participants: "",
  allergies: "", riskFlags: "", previousOperations: "",
  previousAnaesthetic: "", religiousRequirements: "", culturalRequirements: "",
  chemoRadiation: "", chemoDetails: "", steroids: "", steroidsDetails: "",
  currentMedication: "", pacemaker: "", pacemakerDetails: "",
  smoking: "", smokingDetails: "", alcohol: "", alcoholDetails: "",
  pregnancy: "", lmp: "", breastfeeding: "", oralContraceptive: "",
  elderlyConsiderations: "",
  illness: emptyIllness(),
  systolic: "", diastolic: "", pulse: "", pulseDescription: "",
  respiration: "", respirationDescription: "",
  temperature: "", temperatureRoute: "Oral",
  spo2: "", weight: "", height: "", haemoglucose: "",
  mrsaScreening: "Not done",
  chestApexLeft: "", chestApexRight: "", chestBaseLeft: "", chestBaseRight: "",
  pH: "", specificGravity: "",
  urinalysis: emptyUrinalysis(),
  acuity: emptyAcuity(),
  selectedCodes: [],
  notes: "",
});

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCompleted?: (record: AssessmentRecord) => void;
  onView?: (record: AssessmentRecord) => void;
};

export function AssessmentJourneyWizard({ open, onOpenChange, onCompleted, onView }: Props) {
  const journey = useClinicalAssessmentJourney();
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(journey.facilityId ?? CA_FACILITIES[0]));
  const [stepIdx, setStepIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [patientQuery, setPatientQuery] = useState("");
  const [codeQuery, setCodeQuery] = useState("");
  const [savedRecord, setSavedRecord] = useState<AssessmentRecord | null>(null);

  useEffect(() => {
    if (!open) return;
    journey.startJourney("assess-patient");
    const facilityId = journey.facilityId ?? CA_FACILITIES[0];
    const d = emptyDraft(facilityId);
    if (journey.patientId) {
      const p = CA_PATIENTS.find((x) => x.id === journey.patientId);
      if (p) {
        d.patientId = p.id;
        d.firstName = p.name.split(" ")[0] ?? "";
        d.surname = p.name.split(" ").slice(1).join(" ");
        d.initials = p.initials;
        d.gender = p.gender;
        d.dateOfBirth = p.dob;
      }
    }
    setDraft(d);
    setStepIdx(0);
    setProblem(null);
    setPatientQuery("");
    setCodeQuery("");
    setSavedRecord(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const current = STEPS[stepIdx];
  const isLast = stepIdx === STEPS.length - 1;

  const patientResults = useMemo(() => {
    const q = patientQuery.trim().toLowerCase();
    return q
      ? CA_PATIENTS.filter((p) => `${p.name} ${p.mrn} ${p.id}`.toLowerCase().includes(q)).slice(0, 6)
      : CA_PATIENTS.slice(0, 5);
  }, [patientQuery]);

  const codeResults = useMemo(() => {
    const q = codeQuery.trim().toLowerCase();
    const pool = [...CA_ICD_CATALOGUE, ...CA_CPT_CATALOGUE];
    return q
      ? pool.filter((c) => `${c.code} ${c.description}`.toLowerCase().includes(q)).slice(0, 12)
      : pool.slice(0, 8);
  }, [codeQuery]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const selectedPatient = CA_PATIENTS.find((p) => p.id === draft.patientId);

  // ---- validation ----
  type Issue = { id: string; message: string; blocking: boolean; stepIndex: number };
  const issues: Issue[] = useMemo(() => {
    const out: Issue[] = [];
    const push = (id: string, message: string, blocking: boolean, stepIndex: number) =>
      out.push({ id, message, blocking, stepIndex });

    if (!draft.facilityId) push("facility", "A facility must be confirmed before continuing.", true, 0);
    if (!draft.patientId) push("patient", "A patient must be selected.", true, 1);

    // integrity
    if (!draft.firstName) push("firstName", "First name is required.", true, 2);
    if (!draft.surname) push("surname", "Surname is required.", true, 2);
    if (!draft.initials) push("initials", "Initials are required.", true, 2);
    if (!draft.title) push("title", "Title is required.", true, 2);
    if (!draft.gender) push("gender", "Gender is required.", true, 2);
    if (!draft.dateOfBirth) push("dob", "Date of birth is required.", true, 2);
    if (draft.identifierType !== "None" && !draft.identifierValue) {
      push("identifier", "Identifier value is required for the selected identifier type.", true, 2);
    }
    if (draft.identifierType === "None" && !draft.identifierUnavailableReason) {
      push("identifier-reason", "A reason is required when no identifier is available.", true, 2);
    }
    if (draft.identifierType === "SA ID" && draft.identifierValue && !/^\d{13}$/.test(draft.identifierValue)) {
      push("sa-id", "SA ID must be exactly 13 digits.", true, 2);
    }
    if (selectedPatient && selectedPatient.alerts.length > 0 && !draft.alertsAcknowledged) {
      push("alerts", "Patient alerts must be acknowledged before continuing.", true, 2);
    }
    if (selectedPatient && !draft.duplicateWarningAcknowledged) {
      push("duplicate", "Duplicate-check warning must be acknowledged.", false, 2);
    }

    // header
    if (!draft.type) push("type", "Assessment type is required.", true, 4);
    if (!draft.reason) push("reason", "Reason for assessment is required.", true, 4);
    if (!draft.assessmentDate) push("date", "Assessment date/time is required.", true, 4);
    if (!draft.assessor) push("assessor", "Assessor is required.", true, 4);

    // treatment
    if (draft.pregnancy === "Yes" && !draft.lmp) push("lmp", "LMP is required when pregnancy is Yes.", true, 6);

    // illness — for positive answers require description
    for (const k of ILLNESS_KEYS) {
      const row = draft.illness[k];
      if (row.present === "Yes" && !row.description.trim()) {
        push(`illness-${k}`, `Description required for ${ILLNESS_LABELS[k]}.`, true, 7);
      }
    }

    // vitals — required for a full assessment
    const requiredVitals: Array<[keyof Draft, string]> = [
      ["systolic", "Systolic BP"], ["diastolic", "Diastolic BP"], ["pulse", "Pulse"],
      ["respiration", "Respiration"], ["temperature", "Temperature"], ["spo2", "SpO₂"],
    ];
    for (const [k, label] of requiredVitals) {
      if (!String(draft[k] ?? "").trim()) push(`vitals-${String(k)}`, `${label} is required.`, true, 8);
    }
    const spo2n = Number(draft.spo2);
    if (draft.spo2 && !Number.isNaN(spo2n) && spo2n < 90) {
      push("spo2-low", "SpO₂ below 90% — clinical escalation recommended.", false, 8);
    }

    // urinalysis — abnormality selected requires score
    for (const [k, entry] of Object.entries(draft.urinalysis)) {
      if (entry.result && entry.result !== "Negative" && !entry.score.trim()) {
        push(`urinalysis-${k}`, `Score required for abnormal ${k}.`, true, 9);
      }
    }

    // acuity
    for (const [k, label] of ACUITY_KEYS) {
      if (!draft.acuity[k]) push(`acuity-${String(k)}`, `${label} acuity is required.`, true, 10);
    }

    return out;
  }, [draft, selectedPatient]);

  const blockingCount = issues.filter((i) => i.blocking).length;
  const warningCount = issues.filter((i) => !i.blocking).length;

  const canAdvance = (() => {
    const stepIssues = issues.filter((i) => i.blocking && i.stepIndex <= stepIdx);
    // Allow moving forward as long as the current step's blocking issues are resolved.
    return stepIssues.filter((i) => i.stepIndex === stepIdx).length === 0;
  })();

  function saveDraftAndExit() {
    toast.info("Draft saved", { description: "The current capture is preserved locally in this browser session." });
    onOpenChange(false);
  }

  async function complete() {
    setSubmitting(true); setProblem(null);
    try {
      if (blockingCount > 0) {
        setProblem(`${blockingCount} blocking validation${blockingCount === 1 ? "" : "s"} must be resolved before completion.`);
        return;
      }
      if (!selectedPatient) { setProblem("A patient is required."); return; }
      const rec = clinicalAssessmentService.createAssessment({
        patientId: selectedPatient.id,
        patientName: `${draft.firstName} ${draft.surname}`.trim() || selectedPatient.name,
        patientInitials: draft.initials || selectedPatient.initials,
        patientDob: draft.dateOfBirth || selectedPatient.dob,
        patientGender: (draft.gender || selectedPatient.gender) as "M" | "F" | "X",
        mrn: selectedPatient.mrn,
        facilityId: draft.facilityId, facilityName: draft.facilityId,
        wardId: draft.wardId || selectedPatient.ward,
        admissionId: draft.admissionId || selectedPatient.admissionId,
        preadmissionId: draft.preadmissionId || selectedPatient.preadmissionId,
        type: draft.type, reason: draft.reason,
        assessmentDate: new Date(draft.assessmentDate).toISOString(),
        assessor: draft.assessor, participants: draft.participants,
        completenessPercent: 100,
        sections: {
          integrity: {
            identifierType: draft.identifierType,
            identifierValue: draft.identifierValue,
            identifierUnavailableReason: draft.identifierUnavailableReason,
            firstName: draft.firstName, surname: draft.surname, initials: draft.initials,
            title: draft.title, gender: draft.gender, dateOfBirth: draft.dateOfBirth,
            alertsAcknowledged: draft.alertsAcknowledged,
            duplicateWarningAcknowledged: draft.duplicateWarningAcknowledged,
          },
          general: {
            allergies: draft.allergies, riskFlags: draft.riskFlags,
            previousOperations: draft.previousOperations,
            previousAnaesthetic: draft.previousAnaesthetic,
            religiousRequirements: draft.religiousRequirements,
            culturalRequirements: draft.culturalRequirements,
          },
          treatment: {
            chemoRadiation: draft.chemoRadiation, chemoRadiationDetails: draft.chemoDetails,
            steroidsCortisone: draft.steroids, steroidsDetails: draft.steroidsDetails,
            currentMedication: draft.currentMedication,
            pacemakerValve: draft.pacemaker, pacemakerDetails: draft.pacemakerDetails,
            smoking: draft.smoking, smokingDetails: draft.smokingDetails,
            alcohol: draft.alcohol, alcoholDetails: draft.alcoholDetails,
            pregnancy: draft.pregnancy, lmp: draft.lmp,
            breastfeeding: draft.breastfeeding, oralContraceptive: draft.oralContraceptive,
            elderlyConsiderations: draft.elderlyConsiderations,
          },
          illness: Object.fromEntries(ILLNESS_KEYS.filter((k) => draft.illness[k].present).map((k) => [k, {
            present: draft.illness[k].present,
            description: draft.illness[k].description,
            durationType: draft.illness[k].durationType || undefined,
            duration: draft.illness[k].duration ? Number(draft.illness[k].duration) : undefined,
            treatment: draft.illness[k].treatment,
            personalHistory: draft.illness[k].personalHistory,
            familyHistory: draft.illness[k].familyHistory,
          }])),
          vitals: {
            systolic: Number(draft.systolic) || undefined,
            diastolic: Number(draft.diastolic) || undefined,
            pulse: Number(draft.pulse) || undefined, pulseDescription: draft.pulseDescription,
            respiration: Number(draft.respiration) || undefined, respirationDescription: draft.respirationDescription,
            temperature: Number(draft.temperature) || undefined, temperatureRoute: draft.temperatureRoute,
            spo2: Number(draft.spo2) || undefined,
            weight: Number(draft.weight) || undefined, height: Number(draft.height) || undefined,
            haemoglucose: Number(draft.haemoglucose) || undefined,
            mrsaScreening: draft.mrsaScreening,
            chestApexLeft: draft.chestApexLeft, chestApexRight: draft.chestApexRight,
            chestBaseLeft: draft.chestBaseLeft, chestBaseRight: draft.chestBaseRight,
          },
          urinalysis: {
            pH: Number(draft.pH) || undefined, specificGravity: Number(draft.specificGravity) || undefined,
            ...Object.fromEntries(Object.entries(draft.urinalysis).flatMap(([k, v]) => [
              [k, v.result || undefined], [`${k}Score`, v.score || undefined],
            ])),
          },
          acuity: Object.fromEntries(
            ACUITY_KEYS.map(([k]) => [k, draft.acuity[k] || undefined]),
          ),
          codes: draft.selectedCodes,
          notes: draft.notes,
        },
      });
      setSavedRecord(rec);
      toast.success("Assessment completed", {
        description: `${rec.assessmentNumber} · ${rec.patientName}`,
      });
      onCompleted?.(rec);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[calc(100vh-2rem)] w-[min(1100px,calc(100vw-2rem))] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-h-[calc(100vh-4rem)]"
      >
        {/* Header */}
        <DialogHeader className="shrink-0 border-b bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-background/80 shadow-sm ring-1 ring-border">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg">Assess patient</DialogTitle>
              <DialogDescription className="text-xs">
                15-step guided clinical assessment.
              </DialogDescription>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {draft.facilityId && (
                <Badge variant="outline" className="gap-1"><Building2 className="h-3 w-3" />{draft.facilityId}</Badge>
              )}
              {selectedPatient && (
                <Badge variant="outline" className="gap-1"><UserPlus className="h-3 w-3" />{selectedPatient.name}</Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Stepper */}
        <div className="shrink-0 border-b bg-muted/30 px-6 py-3">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            {STEPS.map((s, i) => {
              const done = i < stepIdx, active = i === stepIdx;
              const Icon = s.icon;
              return (
                <li key={s.key} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => i <= stepIdx && setStepIdx(i)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition",
                      active && "border-primary bg-primary text-primary-foreground shadow-sm",
                      done && "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                      !active && !done && "border-border bg-background text-muted-foreground",
                    )}
                  >
                    <span className={cn(
                      "grid h-4 w-4 place-items-center rounded-full text-[9px] font-semibold",
                      active ? "bg-primary-foreground/20" : done ? "bg-emerald-500/20" : "bg-muted",
                    )}>
                      {done ? <Check className="h-2.5 w-2.5" /> : i + 1}
                    </span>
                    <Icon className="h-3 w-3" />
                    <span className="font-medium whitespace-nowrap">{s.title}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="mb-4">
            <div className="text-sm font-semibold">{current.title}</div>
            <div className="text-xs text-muted-foreground">{current.hint}</div>
          </div>

          {savedRecord ? (
            <CompletedPanel record={savedRecord} onView={() => onView?.(savedRecord)} />
          ) : (
            <StepBody
              current={current.key}
              draft={draft}
              set={set}
              patientQuery={patientQuery}
              setPatientQuery={setPatientQuery}
              patientResults={patientResults}
              selectedPatient={selectedPatient}
              codeQuery={codeQuery}
              setCodeQuery={setCodeQuery}
              codeResults={codeResults}
              issues={issues}
              blockingCount={blockingCount}
              warningCount={warningCount}
            />
          )}

          {problem && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-400/40 bg-rose-500/5 p-3 text-xs text-rose-700 dark:text-rose-300">
              <AlertTriangle className="mt-0.5 h-4 w-4" />
              <div><div className="font-medium">Could not complete assessment</div><div>{problem}</div></div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t bg-muted/20 px-6 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Stethoscope className="h-3 w-3" />
              Step {stepIdx + 1} of {STEPS.length}
              <Separator className="mx-1 h-3" orientation="vertical" />
              <span className={blockingCount ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>
                {blockingCount ? `${blockingCount} blocking` : "No blocking issues"}
              </span>
              <span>· {warningCount} warning{warningCount === 1 ? "" : "s"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                <X className="mr-1 h-3.5 w-3.5" />Cancel
              </Button>
              {!savedRecord && (
                <Button variant="outline" size="sm" onClick={saveDraftAndExit}>
                  <Save className="mr-1 h-3.5 w-3.5" />Save draft &amp; exit
                </Button>
              )}
              {!savedRecord && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={stepIdx === 0}
                  onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
                >
                  <ArrowLeft className="mr-1 h-3.5 w-3.5" />Back
                </Button>
              )}
              {!savedRecord && !isLast && (
                <Button size="sm" disabled={!canAdvance} onClick={() => setStepIdx((i) => Math.min(STEPS.length - 1, i + 1))}>
                  Continue<ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              )}
              {!savedRecord && isLast && (
                <Button size="sm" disabled={submitting || blockingCount > 0} onClick={complete}>
                  {submitting ? <><Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />Saving…</> : (<><Check className="mr-1 h-3.5 w-3.5" />Complete assessment</>)}
                </Button>
              )}
              {savedRecord && (
                <Button size="sm" onClick={() => onOpenChange(false)}>
                  <Check className="mr-1 h-3.5 w-3.5" />Close
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Step body dispatcher (kept out of the parent so the hook order stays stable)
// ---------------------------------------------------------------------------

type StepBodyProps = {
  current: StepKey;
  draft: Draft;
  set: <K extends keyof Draft>(k: K, v: Draft[K]) => void;
  patientQuery: string; setPatientQuery: (v: string) => void;
  patientResults: typeof CA_PATIENTS;
  selectedPatient: (typeof CA_PATIENTS)[number] | undefined;
  codeQuery: string; setCodeQuery: (v: string) => void;
  codeResults: ClinicalCode[];
  issues: Array<{ id: string; message: string; blocking: boolean; stepIndex: number }>;
  blockingCount: number; warningCount: number;
};

function StepBody(p: StepBodyProps) {
  const { current, draft, set, selectedPatient } = p;

  switch (current) {
    case "facility":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Facility" required>
            <SelectBox
              value={draft.facilityId}
              onChange={(v) => set("facilityId", v)}
              options={CA_FACILITIES.map((f) => ({ value: f, label: f }))}
            />
          </Field>
          <div className="rounded-lg border bg-muted/20 p-3 text-[11px] text-muted-foreground">
            Facility scopes patient search, preadmission lookup and the clinical record.
          </div>
        </div>
      );

    case "patient":
      return (
        <div className="space-y-3">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" value={p.patientQuery} onChange={(e) => p.setPatientQuery(e.target.value)} placeholder="Search by name, MRN or ID" />
          </div>
          <div className="grid gap-2">
            {p.patientResults.map((pt) => {
              const sel = draft.patientId === pt.id;
              return (
                <button
                  key={pt.id}
                  type="button"
                  onClick={() => {
                    set("patientId", pt.id);
                    set("firstName", pt.name.split(" ")[0] ?? "");
                    set("surname", pt.name.split(" ").slice(1).join(" "));
                    set("initials", pt.initials);
                    set("gender", pt.gender);
                    set("dateOfBirth", pt.dob);
                  }}
                  className={cn(
                    "flex items-start justify-between rounded-lg border p-3 text-left text-xs transition hover:border-primary/40 hover:bg-accent",
                    sel && "border-primary bg-primary/5 ring-1 ring-primary/30",
                  )}
                >
                  <div>
                    <div className="text-sm font-medium">{pt.name}</div>
                    <div className="text-muted-foreground">MRN {pt.mrn} · {pt.dob} · {pt.gender}</div>
                    {pt.alerts.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {pt.alerts.map((a) => (
                          <Badge key={a} variant="outline" className="border-rose-400/40 text-[10px] text-rose-600 dark:text-rose-400">{a}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  {sel && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </button>
              );
            })}
            {p.patientResults.length === 0 && (
              <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                No matches. Refine the search or continue with a preadmission link in the next step.
              </div>
            )}
          </div>
        </div>
      );

    case "integrity":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Identifier type" required>
            <SelectBox
              value={draft.identifierType}
              onChange={(v) => set("identifierType", v as Draft["identifierType"])}
              options={["SA ID", "Passport", "Refugee permit", "Asylum", "None"].map((o) => ({ value: o, label: o }))}
            />
          </Field>
          {draft.identifierType !== "None" ? (
            <Field label="Identifier value" required>
              <Input value={draft.identifierValue} onChange={(e) => set("identifierValue", e.target.value)} placeholder={draft.identifierType === "SA ID" ? "13-digit SA ID" : "Identifier"} />
            </Field>
          ) : (
            <Field label="Reason identifier unavailable" required>
              <Input value={draft.identifierUnavailableReason} onChange={(e) => set("identifierUnavailableReason", e.target.value)} placeholder="e.g. Unaccompanied minor" />
            </Field>
          )}
          <Field label="Title" required>
            <SelectBox value={draft.title} onChange={(v) => set("title", v)} options={["Mr","Mrs","Ms","Miss","Dr","Prof","Rev","Other"].map((o) => ({ value: o, label: o }))} />
          </Field>
          <Field label="Gender" required>
            <SelectBox
              value={draft.gender || "unspecified"}
              onChange={(v) => set("gender", (v === "unspecified" ? "" : v) as Draft["gender"])}
              options={[{ value: "unspecified", label: "—" }, { value: "F", label: "Female" }, { value: "M", label: "Male" }, { value: "X", label: "Other" }]}
            />
          </Field>
          <Field label="First name" required><Input value={draft.firstName} onChange={(e) => set("firstName", e.target.value)} /></Field>
          <Field label="Surname" required><Input value={draft.surname} onChange={(e) => set("surname", e.target.value)} /></Field>
          <Field label="Initials" required><Input value={draft.initials} onChange={(e) => set("initials", e.target.value)} /></Field>
          <Field label="Date of birth" required><Input type="date" value={draft.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} /></Field>

          {selectedPatient && selectedPatient.alerts.length > 0 && (
            <label className="col-span-full flex items-start gap-2 rounded-lg border border-rose-400/40 bg-rose-500/5 p-3 text-xs">
              <input type="checkbox" className="mt-0.5" checked={draft.alertsAcknowledged} onChange={(e) => set("alertsAcknowledged", e.target.checked)} />
              <span>
                <div className="font-medium text-rose-700 dark:text-rose-300">Acknowledge patient alerts</div>
                <div className="text-rose-700/80 dark:text-rose-300/80">
                  {selectedPatient.alerts.join(" · ")}
                </div>
              </span>
            </label>
          )}
          <label className="col-span-full flex items-start gap-2 rounded-lg border bg-muted/20 p-3 text-xs">
            <input type="checkbox" className="mt-0.5" checked={draft.duplicateWarningAcknowledged} onChange={(e) => set("duplicateWarningAcknowledged", e.target.checked)} />
            <span>
              <div className="font-medium">Duplicate check acknowledged</div>
              <div className="text-muted-foreground">No potential duplicates were surfaced for the captured identity.</div>
            </span>
          </label>
        </div>
      );

    case "context": {
      const patientPreads = CA_PREADMISSIONS.filter((x) => !draft.patientId || x.patientId === draft.patientId);
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Active admission (optional)">
            <Input value={draft.admissionId} onChange={(e) => set("admissionId", e.target.value)} placeholder={selectedPatient?.admissionId ?? "ADM-…"} />
          </Field>
          <Field label="Ward / unit (optional)">
            <Input value={draft.wardId} onChange={(e) => set("wardId", e.target.value)} placeholder={selectedPatient?.ward ?? "Ward"} />
          </Field>
          <Field label="Preadmission (optional)">
            <SelectBox
              value={draft.preadmissionId || "none"}
              onChange={(v) => set("preadmissionId", v === "none" ? "" : v)}
              options={[
                { value: "none", label: "— none —" },
                ...patientPreads.map((x) => ({ value: x.id, label: `${x.id} · ${x.procedure}` })),
              ]}
            />
          </Field>
          <Field label="Medical event (optional)">
            <Input value={draft.medicalEventId} onChange={(e) => set("medicalEventId", e.target.value)} placeholder="ME-…" />
          </Field>
          <Field label="Case folder">
            <Input value={draft.caseFolder} onChange={(e) => set("caseFolder", e.target.value)} placeholder="CASE-…" />
          </Field>
          <Field label="Previous assessment reference">
            <Input value={draft.previousAssessmentId} onChange={(e) => set("previousAssessmentId", e.target.value)} placeholder="CA-… (optional)" />
          </Field>
          <label className="col-span-full flex items-start gap-2 rounded-lg border bg-muted/20 p-3 text-xs">
            <input type="checkbox" className="mt-0.5" checked={draft.lockAcknowledged} onChange={(e) => set("lockAcknowledged", e.target.checked)} />
            <span>
              <div className="font-medium">Lock state acknowledged</div>
              <div className="text-muted-foreground">
                No concurrent editors detected. If another user opens this record, editing will be blocked with a lock notice.
              </div>
            </span>
          </label>
        </div>
      );
    }

    case "header":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Assessment type" required>
            <SelectBox value={draft.type} onChange={(v) => set("type", v as AssessmentType)}
              options={CA_ASSESSMENT_TYPES.map((t) => ({ value: t, label: t }))} />
          </Field>
          <Field label="Reason for assessment" required>
            <SelectBox value={draft.reason} onChange={(v) => set("reason", v as AssessmentReason)}
              options={CA_ASSESSMENT_REASONS.map((t) => ({ value: t, label: t }))} />
          </Field>
          <Field label="Assessment date &amp; time" required>
            <Input type="datetime-local" value={draft.assessmentDate} onChange={(e) => set("assessmentDate", e.target.value)} />
          </Field>
          <Field label="Assessor" required>
            <SelectBox value={draft.assessor} onChange={(v) => set("assessor", v)}
              options={CA_ASSESSORS.map((a) => ({ value: a, label: a }))} />
          </Field>
          <Field label="Additional participants" className="sm:col-span-2">
            <Input value={draft.participants} onChange={(e) => set("participants", e.target.value)} placeholder="Comma-separated" />
          </Field>
        </div>
      );

    case "general":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Allergies / risk flags" className="sm:col-span-2">
            <Textarea rows={2} value={draft.allergies} onChange={(e) => set("allergies", e.target.value)} placeholder="Drug, food, environmental" />
          </Field>
          <Field label="Additional risk flags"><Input value={draft.riskFlags} onChange={(e) => set("riskFlags", e.target.value)} placeholder="e.g. Falls high risk" /></Field>
          <Field label="Previous operations"><Input value={draft.previousOperations} onChange={(e) => set("previousOperations", e.target.value)} placeholder="Year · procedure" /></Field>
          <Field label="Previous anaesthetic history" className="sm:col-span-2"><Textarea rows={2} value={draft.previousAnaesthetic} onChange={(e) => set("previousAnaesthetic", e.target.value)} placeholder="Reactions, difficulties, agent used" /></Field>
          <Field label="Religious requirements"><Input value={draft.religiousRequirements} onChange={(e) => set("religiousRequirements", e.target.value)} /></Field>
          <Field label="Cultural requirements"><Input value={draft.culturalRequirements} onChange={(e) => set("culturalRequirements", e.target.value)} /></Field>
        </div>
      );

    case "treatment":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <YesNoRow label="Chemotherapy / radiation" value={draft.chemoRadiation} onChange={(v) => set("chemoRadiation", v)} detail={draft.chemoDetails} onDetail={(v) => set("chemoDetails", v)} />
          <YesNoRow label="Steroids / cortisone" value={draft.steroids} onChange={(v) => set("steroids", v)} detail={draft.steroidsDetails} onDetail={(v) => set("steroidsDetails", v)} />
          <Field label="Current medication" className="sm:col-span-2">
            <Textarea rows={2} value={draft.currentMedication} onChange={(e) => set("currentMedication", e.target.value)} placeholder="Name · dose · frequency" />
          </Field>
          <YesNoRow label="Pacemaker / heart valve" value={draft.pacemaker} onChange={(v) => set("pacemaker", v)} detail={draft.pacemakerDetails} onDetail={(v) => set("pacemakerDetails", v)} />
          <YesNoRow label="Smoking" value={draft.smoking} onChange={(v) => set("smoking", v)} detail={draft.smokingDetails} onDetail={(v) => set("smokingDetails", v)} />
          <YesNoRow label="Alcohol" value={draft.alcohol} onChange={(v) => set("alcohol", v)} detail={draft.alcoholDetails} onDetail={(v) => set("alcoholDetails", v)} />
          {draft.gender === "F" && (
            <>
              <YesNoRow label="Pregnancy" value={draft.pregnancy} onChange={(v) => set("pregnancy", v)} />
              {draft.pregnancy === "Yes" && (
                <Field label="LMP (last menstrual period)" required>
                  <Input type="date" value={draft.lmp} onChange={(e) => set("lmp", e.target.value)} />
                </Field>
              )}
              <YesNoRow label="Breastfeeding" value={draft.breastfeeding} onChange={(v) => set("breastfeeding", v)} />
              <YesNoRow label="Oral contraceptive" value={draft.oralContraceptive} onChange={(v) => set("oralContraceptive", v)} />
            </>
          )}
          <Field label="Elderly considerations (65+)" className="sm:col-span-2">
            <Textarea rows={2} value={draft.elderlyConsiderations} onChange={(e) => set("elderlyConsiderations", e.target.value)} placeholder="Frailty, cognition, polypharmacy" />
          </Field>
        </div>
      );

    case "illness":
      return (
        <div className="space-y-2">
          <div className="rounded-lg border bg-muted/20 p-3 text-[11px] text-muted-foreground">
            For every positive answer, capture description, duration and treatment. Personal and family history are optional but recommended.
          </div>
          <div className="space-y-2">
            {ILLNESS_KEYS.map((k) => {
              const row = draft.illness[k];
              return (
                <div key={k} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium">{ILLNESS_LABELS[k]}</div>
                    <div className="flex gap-1.5">
                      {(["Yes", "No"] as YesNo[]).map((opt) => (
                        <button key={opt} type="button"
                          onClick={() => set("illness", { ...draft.illness, [k]: { ...row, present: opt } })}
                          className={cn(
                            "rounded-full border px-3 py-0.5 text-[11px]",
                            row.present === opt
                              ? opt === "Yes"
                                ? "border-rose-400/60 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                : "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                              : "border-border bg-background text-muted-foreground",
                          )}>{opt}</button>
                      ))}
                    </div>
                  </div>
                  {row.present === "Yes" && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      <Field label="Description" className="sm:col-span-3">
                        <Input value={row.description} onChange={(e) => set("illness", { ...draft.illness, [k]: { ...row, description: e.target.value } })} />
                      </Field>
                      <Field label="Duration type">
                        <SelectBox value={row.durationType || "none"} onChange={(v) => set("illness", { ...draft.illness, [k]: { ...row, durationType: (v === "none" ? "" : v) as typeof row.durationType } })}
                          options={[{ value: "none", label: "—" }, { value: "days", label: "Days" }, { value: "weeks", label: "Weeks" }, { value: "months", label: "Months" }, { value: "years", label: "Years" }]} />
                      </Field>
                      <Field label="Duration"><Input type="number" min={0} value={row.duration} onChange={(e) => set("illness", { ...draft.illness, [k]: { ...row, duration: e.target.value } })} /></Field>
                      <Field label="Treatment"><Input value={row.treatment} onChange={(e) => set("illness", { ...draft.illness, [k]: { ...row, treatment: e.target.value } })} /></Field>
                      <Field label="Personal history"><Input value={row.personalHistory} onChange={(e) => set("illness", { ...draft.illness, [k]: { ...row, personalHistory: e.target.value } })} /></Field>
                      <Field label="Family history"><Input value={row.familyHistory} onChange={(e) => set("illness", { ...draft.illness, [k]: { ...row, familyHistory: e.target.value } })} /></Field>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );

    case "vitals":
      return (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Systolic BP (mmHg)" required><Input type="number" value={draft.systolic} onChange={(e) => set("systolic", e.target.value)} /></Field>
            <Field label="Diastolic BP (mmHg)" required><Input type="number" value={draft.diastolic} onChange={(e) => set("diastolic", e.target.value)} /></Field>
            <Field label="Pulse (bpm)" required><Input type="number" value={draft.pulse} onChange={(e) => set("pulse", e.target.value)} /></Field>
            <Field label="Pulse description" className="sm:col-span-3"><Input value={draft.pulseDescription} onChange={(e) => set("pulseDescription", e.target.value)} placeholder="Regular / thready / bounding" /></Field>
            <Field label="Respiration (rpm)" required><Input type="number" value={draft.respiration} onChange={(e) => set("respiration", e.target.value)} /></Field>
            <Field label="Respiration description" className="sm:col-span-2"><Input value={draft.respirationDescription} onChange={(e) => set("respirationDescription", e.target.value)} placeholder="Even / laboured / shallow" /></Field>
            <Field label="Temperature (°C)" required><Input type="number" step="0.1" value={draft.temperature} onChange={(e) => set("temperature", e.target.value)} /></Field>
            <Field label="Route">
              <SelectBox value={draft.temperatureRoute} onChange={(v) => set("temperatureRoute", v as Draft["temperatureRoute"])}
                options={["Oral","Tympanic","Axillary","Rectal"].map((o) => ({ value: o, label: o }))} />
            </Field>
            <Field label="SpO₂ (%)" required><Input type="number" min={0} max={100} value={draft.spo2} onChange={(e) => set("spo2", e.target.value)} /></Field>
            <Field label="Weight (kg)"><Input type="number" step="0.1" value={draft.weight} onChange={(e) => set("weight", e.target.value)} /></Field>
            <Field label="Height (cm)"><Input type="number" value={draft.height} onChange={(e) => set("height", e.target.value)} /></Field>
            <Field label="Haemoglucose (mmol/L)"><Input type="number" step="0.1" value={draft.haemoglucose} onChange={(e) => set("haemoglucose", e.target.value)} /></Field>
            <Field label="MRSA screening">
              <SelectBox value={draft.mrsaScreening} onChange={(v) => set("mrsaScreening", v as Draft["mrsaScreening"])}
                options={["Positive","Negative","Pending","Not done"].map((o) => ({ value: o, label: o }))} />
            </Field>
          </div>
          <div className="rounded-lg border">
            <div className="border-b bg-muted/30 px-3 py-2 text-xs font-medium">Chest auscultation</div>
            <div className="grid gap-3 p-3 sm:grid-cols-2">
              <Field label="Apex — left"><Input value={draft.chestApexLeft} onChange={(e) => set("chestApexLeft", e.target.value)} placeholder="Clear / crackles / wheeze" /></Field>
              <Field label="Apex — right"><Input value={draft.chestApexRight} onChange={(e) => set("chestApexRight", e.target.value)} /></Field>
              <Field label="Base — left"><Input value={draft.chestBaseLeft} onChange={(e) => set("chestBaseLeft", e.target.value)} /></Field>
              <Field label="Base — right"><Input value={draft.chestBaseRight} onChange={(e) => set("chestBaseRight", e.target.value)} /></Field>
            </div>
          </div>
        </div>
      );

    case "urinalysis":
      return (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="pH"><Input type="number" step="0.1" value={draft.pH} onChange={(e) => set("pH", e.target.value)} /></Field>
            <Field label="Specific gravity"><Input type="number" step="0.001" value={draft.specificGravity} onChange={(e) => set("specificGravity", e.target.value)} /></Field>
          </div>
          <div className="rounded-lg border">
            <div className="grid grid-cols-3 gap-2 border-b bg-muted/30 px-3 py-2 text-[11px] font-medium">
              <span>Parameter</span><span>Result</span><span>Abnormality score</span>
            </div>
            <div className="divide-y">
              {(Object.keys(draft.urinalysis) as Array<keyof Draft["urinalysis"]>).map((k) => {
                const row = draft.urinalysis[k];
                const abnormal = !!row.result && row.result !== "Negative";
                return (
                  <div key={k as string} className="grid grid-cols-3 items-center gap-2 px-3 py-2 text-xs">
                    <span className="capitalize">{k}</span>
                    <SelectBox
                      value={row.result || "unset"}
                      onChange={(v) => set("urinalysis", { ...draft.urinalysis, [k]: { ...row, result: v === "unset" ? "" : (v as UrinalysisResult) } })}
                      options={[{ value: "unset", label: "—" }, ...["Negative","Trace","+","++","+++","++++"].map((o) => ({ value: o, label: o }))]}
                    />
                    <Input
                      disabled={!abnormal}
                      value={row.score}
                      onChange={(e) => set("urinalysis", { ...draft.urinalysis, [k]: { ...row, score: e.target.value } })}
                      placeholder={abnormal ? "Required" : "—"}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );

    case "acuity":
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          {ACUITY_KEYS.map(([k, label]) => (
            <div key={String(k)} className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div className="text-xs font-medium">{label}</div>
              <div className="flex flex-wrap gap-1">
                {(["Independent","Assisted","Dependent","Total care"] as AcuityLevel[]).map((lvl) => (
                  <button key={lvl} type="button"
                    onClick={() => set("acuity", { ...draft.acuity, [k]: lvl })}
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px]",
                      draft.acuity[k] === lvl
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:bg-accent",
                    )}
                  >{lvl}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      );

    case "coding":
      return (
        <div className="space-y-3">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" value={p.codeQuery} onChange={(e) => p.setCodeQuery(e.target.value)} placeholder="Search ICD-10 / CPT catalogue" />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border">
              <div className="border-b bg-muted/30 px-3 py-2 text-[11px] font-medium">Search results</div>
              <div className="max-h-60 divide-y overflow-y-auto">
                {p.codeResults.map((c) => {
                  const already = draft.selectedCodes.some((x) => x.code === c.code && x.kind === c.kind);
                  return (
                    <button key={`${c.kind}-${c.code}`} type="button"
                      disabled={already}
                      onClick={() => set("selectedCodes", [...draft.selectedCodes, c])}
                      className={cn(
                        "flex w-full items-start justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-accent",
                        already && "opacity-40",
                      )}
                    >
                      <span>
                        <span className="mr-2 font-mono">{c.code}</span>
                        <Badge variant="outline" className="text-[9px]">{c.kind}</Badge>
                        <div className="text-[11px] text-muted-foreground">{c.description}</div>
                      </span>
                      {!already && <span className="text-primary">Add</span>}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="rounded-lg border">
              <div className="border-b bg-muted/30 px-3 py-2 text-[11px] font-medium">Selected codes ({draft.selectedCodes.length})</div>
              <div className="max-h-60 divide-y overflow-y-auto">
                {draft.selectedCodes.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">No codes added yet.</div>
                ) : draft.selectedCodes.map((c) => (
                  <div key={`${c.kind}-${c.code}`} className="flex items-start justify-between gap-2 px-3 py-2 text-xs">
                    <span>
                      <span className="mr-2 font-mono">{c.code}</span>
                      <Badge variant="outline" className="text-[9px]">{c.kind}</Badge>
                      <div className="text-[11px] text-muted-foreground">{c.description}</div>
                    </span>
                    <button type="button" className="text-rose-600 hover:underline"
                      onClick={() => set("selectedCodes", draft.selectedCodes.filter((x) => !(x.code === c.code && x.kind === c.kind)))}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <Field label="Clinical notes"><Textarea rows={3} value={draft.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Free-text clinical observations" /></Field>
        </div>
      );

    case "validation":
      return (
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-rose-400/40 bg-rose-500/5 p-3 text-xs">
              <div className="mb-1 font-medium text-rose-700 dark:text-rose-300">Blocking errors ({p.blockingCount})</div>
              {p.issues.filter((i) => i.blocking).length === 0 ? (
                <div className="text-muted-foreground">All blocking validations pass.</div>
              ) : (
                <ul className="space-y-1">
                  {p.issues.filter((i) => i.blocking).map((i) => (
                    <li key={i.id} className="flex items-start gap-1.5 text-rose-700 dark:text-rose-300">
                      <AlertTriangle className="mt-0.5 h-3 w-3" />
                      <span>{i.message} <span className="text-[10px] text-muted-foreground">· Step {i.stepIndex + 1}</span></span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-lg border border-amber-400/40 bg-amber-500/5 p-3 text-xs">
              <div className="mb-1 font-medium text-amber-700 dark:text-amber-300">Warnings ({p.warningCount})</div>
              {p.issues.filter((i) => !i.blocking).length === 0 ? (
                <div className="text-muted-foreground">No warnings raised.</div>
              ) : (
                <ul className="space-y-1">
                  {p.issues.filter((i) => !i.blocking).map((i) => (
                    <li key={i.id} className="flex items-start gap-1.5 text-amber-700 dark:text-amber-300">
                      <AlertTriangle className="mt-0.5 h-3 w-3" />
                      <span>{i.message}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      );

    case "review":
      return (
        <div className="space-y-3">
          <ReviewGrid rows={[
            ["Facility", draft.facilityId],
            ["Patient", `${draft.firstName} ${draft.surname}`.trim()],
            ["MRN", selectedPatient?.mrn ?? "—"],
            ["Type · Reason", `${draft.type} · ${draft.reason}`],
            ["Assessor", draft.assessor],
            ["Date", draft.assessmentDate.replace("T", " ")],
            ["Vitals", `${draft.systolic || "—"}/${draft.diastolic || "—"} · HR ${draft.pulse || "—"} · SpO₂ ${draft.spo2 || "—"}%`],
            ["ICD/CPT codes", draft.selectedCodes.length ? draft.selectedCodes.map((c) => c.code).join(", ") : "—"],
            ["Completeness", `${100 - Math.min(90, p.blockingCount * 10)}%`],
          ]} />
          <div className={cn(
            "rounded-lg border p-3 text-xs",
            p.blockingCount === 0
              ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
              : "border-rose-500/40 bg-rose-500/5 text-rose-700 dark:text-rose-300",
          )}>
            {p.blockingCount === 0
              ? "Ready to complete — all sections pass validation."
              : `Cannot complete — resolve ${p.blockingCount} blocking issue${p.blockingCount === 1 ? "" : "s"} first.`}
          </div>
        </div>
      );

    case "complete":
      return (
        <div className="rounded-lg border bg-muted/20 p-4 text-xs text-muted-foreground">
          Click <span className="font-medium text-foreground">Complete assessment</span> to save the assessment
          and generate the clinical record.
        </div>
      );
  }
}

function CompletedPanel({ record, onView }: { record: AssessmentRecord; onView: () => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-4 text-xs">
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-200">
          <CheckCircle2 className="h-4 w-4" /> Assessment {record.assessmentNumber} completed
        </div>
        <div className="mt-1 text-emerald-800/80 dark:text-emerald-200/80">
          {record.patientName} · {record.facilityName} · {record.type}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={onView}>
          <FileText className="mr-1 h-3.5 w-3.5" /> View clinical record
        </Button>
        <Button size="sm" variant="outline" onClick={() => window.print()}>
          <Printer className="mr-1 h-3.5 w-3.5" /> Print clinical record
        </Button>
      </div>
    </div>
  );
}

function ReviewGrid({ rows }: { rows: Array<[string, string]> }) {
  return (
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

function YesNoRow({
  label, value, onChange, detail, onDetail,
}: {
  label: string; value: YesNo; onChange: (v: YesNo) => void;
  detail?: string; onDetail?: (v: string) => void;
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-medium">{label}</div>
        <div className="flex gap-1.5">
          {(["Yes", "No"] as YesNo[]).map((opt) => (
            <button key={opt} type="button" onClick={() => onChange(opt)}
              className={cn(
                "rounded-full border px-3 py-0.5 text-[11px]",
                value === opt
                  ? opt === "Yes"
                    ? "border-rose-400/60 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    : "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "border-border bg-background text-muted-foreground",
              )}
            >{opt}</button>
          ))}
        </div>
      </div>
      {onDetail && value === "Yes" && (
        <div className="mt-2">
          <Input value={detail ?? ""} onChange={(e) => onDetail(e.target.value)} placeholder="Details" />
        </div>
      )}
    </div>
  );
}
