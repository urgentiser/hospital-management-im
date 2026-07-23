/**
 * Triage Patient — guided capture wizard.
 * Fixed header, scrollable body, fixed footer. Hooks kept unconditional.
 */
import { useEffect, useMemo, useState } from "react";
import {
  Ambulance, ArrowLeft, ArrowRight, Building2, Check, CheckCircle2,
  ClipboardList, HeartPulse, Loader2, Search as SearchIcon, ShieldAlert,
  Stethoscope, User, UserSearch, X, AlertTriangle, ListChecks, FlaskConical,
  Activity, Layers,
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
import { useAuth } from "@/security/auth-provider";
import { hasPermission, Permissions } from "@/security/permissions";
import { useTriageJourney } from "@/modules/triage/state/journey-context";
import { triageService } from "@/services/modules/triage.service";
import { patientMaintenanceService } from "@/services/modules/patient-maintenance.service";
import { maskIdentifier } from "@/modules/patient-maintenance/components/patient-browser";
import {
  TRIAGE_FACILITIES,
} from "@/modules/triage/mock/triage-mock-data";
import {
  TRIAGE_FINDING_LABELS,
  type ArrivalMode, type AvpuLevel, type MobilityLevel,
  type TriageFindingFlags, type TriagePatientType, type TraumaLevel,
  type TriageRecord, type TriageSeverity,
} from "@/modules/triage/contracts";

type StepKey =
  | "facility" | "patient" | "duplicate" | "arrival" | "patient-type"
  | "observations" | "findings" | "score" | "practitioner"
  | "review" | "complete";

const STEPS: Array<{ key: StepKey; title: string; hint: string; icon: typeof Stethoscope }> = [
  { key: "facility",     title: "Hospital context",   hint: "Confirm facility and hospital unit.", icon: Building2 },
  { key: "patient",      title: "Patient",            hint: "Find the patient or use the unknown pathway.", icon: UserSearch },
  { key: "duplicate",    title: "Open-visit check",   hint: "Prevent duplicate A&E/Triage visits.", icon: ShieldAlert },
  { key: "arrival",      title: "Arrival",            hint: "Time, mode and presenting complaint.", icon: Ambulance },
  { key: "patient-type", title: "Patient type",       hint: "Adult, child, infant or unknown.", icon: User },
  { key: "observations", title: "Core observations",  hint: "Mobility, vitals and consciousness.", icon: Activity },
  { key: "findings",     title: "Clinical findings",  hint: "Grouped symptom / mechanism flags.", icon: FlaskConical },
  { key: "score",        title: "Score & severity",   hint: "Deterministic mock score and severity.", icon: HeartPulse },
  { key: "practitioner", title: "Practitioner",       hint: "Treating clinician for this triage.", icon: Stethoscope },
  { key: "review",       title: "Review",             hint: "Confirm before saving.", icon: CheckCircle2 },
  { key: "complete",     title: "Complete",           hint: "Save and generate the record.", icon: Check },
];

type Draft = {
  facilityId: string;
  hospitalUnit: string;
  usingUnknown: boolean;
  patientId: string;
  patientName: string;
  patientMrn: string;
  patientMasked: string;
  patientGender: "M" | "F" | "X" | "";
  arrivalAt: string;
  arrivalMode: ArrivalMode | "";
  ambulanceGroup: string;
  presentingComplaint: string;
  isInjury: boolean;
  injuryIncidentDate: string;
  injuryIncidentTime: string;
  injuryMechanism: string;
  injuryBodyRegion: string;
  injuryDescription: string;
  isPoisoning: boolean;
  poisoningSubstance: string;
  poisoningRoute: "Oral" | "Inhaled" | "Injected" | "Skin" | "Unknown" | "";
  poisoningQuantity: string;
  poisoningDescription: string;
  patientType: TriagePatientType | "";
  unknownEstimatedAge: string;
  unknownEstimatedHeight: string;
  unknownDistinguishing: string;
  mobility: MobilityLevel | "";
  respiratoryRate: string;
  heartRate: string;
  systolicBp: string;
  temperature: string;
  avpu: AvpuLevel | "";
  trauma: TraumaLevel | "";
  findings: TriageFindingFlags;
  overridden: boolean;
  overrideReason: string;
  overrideSenior: string;
  practitionerId: string;
};

const emptyDraft = (facilityId: string, hospitalUnit: string): Draft => ({
  facilityId, hospitalUnit,
  usingUnknown: false,
  patientId: "", patientName: "", patientMrn: "", patientMasked: "", patientGender: "",
  arrivalAt: new Date().toISOString().slice(0, 16),
  arrivalMode: "", ambulanceGroup: "",
  presentingComplaint: "",
  isInjury: false,
  injuryIncidentDate: "", injuryIncidentTime: "",
  injuryMechanism: "", injuryBodyRegion: "", injuryDescription: "",
  isPoisoning: false,
  poisoningSubstance: "", poisoningRoute: "", poisoningQuantity: "", poisoningDescription: "",
  patientType: "",
  unknownEstimatedAge: "", unknownEstimatedHeight: "", unknownDistinguishing: "",
  mobility: "", respiratoryRate: "", heartRate: "", systolicBp: "", temperature: "",
  avpu: "", trauma: "",
  findings: {},
  overridden: false, overrideReason: "", overrideSenior: "",
  practitionerId: "",
});

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCompleted?: (record: TriageRecord) => void;
  onView?: (record: TriageRecord) => void;
};

export function TriagePatientWizard({ open, onOpenChange, onCompleted, onView }: Props) {
  const journey = useTriageJourney();
  const { principal } = useAuth();
  const canOverride = hasPermission(principal, Permissions.TriageOverride);

  const units = triageService.listHospitalUnits();
  const ambulanceGroups = triageService.listAmbulanceGroups();
  const practitioners = triageService.listPractitioners();
  const overrideReasons = triageService.listOverrideReasons();

  const defaultFacilityId = journey.facilityId ?? TRIAGE_FACILITIES[0].id;
  const defaultUnit = journey.hospitalUnit ?? (units.find((u) => u.facilityId === defaultFacilityId)?.name ?? "");

  const [draft, setDraft] = useState<Draft>(() => emptyDraft(defaultFacilityId, defaultUnit));
  const [stepIdx, setStepIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patientQuery, setPatientQuery] = useState("");
  const [saved, setSaved] = useState<TriageRecord | null>(null);

  useEffect(() => {
    if (!open) return;
    journey.startJourney();
    const f = journey.facilityId ?? TRIAGE_FACILITIES[0].id;
    const u = journey.hospitalUnit ?? (triageService.listHospitalUnits(f)[0]?.name ?? "");
    setDraft(emptyDraft(f, u));
    setStepIdx(0); setError(null); setPatientQuery(""); setSaved(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const availableUnits = useMemo(
    () => triageService.listHospitalUnits(draft.facilityId),
    [draft.facilityId],
  );

  const patientResults = useMemo(() => {
    const q = patientQuery.trim();
    if (!q) return patientMaintenanceService.listPatients({}).slice(0, 6);
    return patientMaintenanceService.listPatients({ q }).slice(0, 8);
  }, [patientQuery]);

  const scoreObs = useMemo(() => ({
    mobility: draft.mobility || undefined,
    respiratoryRate: draft.respiratoryRate ? Number(draft.respiratoryRate) : undefined,
    heartRate: draft.heartRate ? Number(draft.heartRate) : undefined,
    systolicBp: draft.systolicBp ? Number(draft.systolicBp) : undefined,
    temperature: draft.temperature ? Number(draft.temperature) : undefined,
    avpu: draft.avpu || undefined,
    trauma: draft.trauma || undefined,
    findings: draft.findings,
  }), [draft.mobility, draft.respiratoryRate, draft.heartRate, draft.systolicBp, draft.temperature, draft.avpu, draft.trauma, draft.findings]);

  const calculatedScore = triageService.calculateScore(scoreObs);
  const calculatedSeverity = triageService.resolveSeverity(calculatedScore);
  const [overrideSeverity, setOverrideSeverity] = useState<TriageSeverity | "">("");
  useEffect(() => { if (!draft.overridden) setOverrideSeverity(""); }, [draft.overridden]);
  const effectiveSeverity: TriageSeverity = draft.overridden && overrideSeverity ? overrideSeverity : calculatedSeverity;

  const hasOpenVisit = draft.patientId ? triageService.hasOpenVisit(draft.patientId) : false;

  // ---------- validation ----------
  type Issue = { message: string; stepIndex: number };
  const issues: Issue[] = useMemo(() => {
    const out: Issue[] = [];
    if (!draft.facilityId) out.push({ message: "Facility is required.", stepIndex: 0 });
    if (!draft.hospitalUnit) out.push({ message: "Hospital unit is required.", stepIndex: 0 });

    if (!draft.usingUnknown && !draft.patientId) out.push({ message: "Select a patient or switch to the unknown pathway.", stepIndex: 1 });
    if (draft.usingUnknown && !draft.patientGender) out.push({ message: "Gender is required for unknown patient.", stepIndex: 4 });
    if (draft.usingUnknown && !draft.unknownEstimatedAge && !draft.unknownEstimatedHeight) {
      out.push({ message: "Provide estimated age or height for unknown patient.", stepIndex: 4 });
    }
    if (draft.usingUnknown && !draft.unknownDistinguishing.trim()) {
      out.push({ message: "Distinguishing description is required for unknown patient.", stepIndex: 4 });
    }

    if (!draft.usingUnknown && hasOpenVisit) {
      out.push({ message: "This patient already has an open A&E/Triage visit — attend the existing record.", stepIndex: 2 });
    }

    if (!draft.arrivalAt) out.push({ message: "Arrival date/time is required.", stepIndex: 3 });
    if (draft.arrivalAt && new Date(draft.arrivalAt).getTime() > Date.now() + 60_000) {
      out.push({ message: "Arrival date/time cannot be in the future.", stepIndex: 3 });
    }
    if (!draft.arrivalMode) out.push({ message: "Arrival mode is required.", stepIndex: 3 });
    if (draft.arrivalMode === "Ambulance" && !draft.ambulanceGroup) {
      out.push({ message: "Ambulance group is required when arrival is by ambulance.", stepIndex: 3 });
    }
    if (!draft.presentingComplaint.trim()) out.push({ message: "Presenting complaint is required.", stepIndex: 3 });

    if (draft.isInjury) {
      if (!draft.injuryIncidentDate) out.push({ message: "Injury incident date is required.", stepIndex: 3 });
      if (!draft.injuryMechanism.trim()) out.push({ message: "Injury mechanism / description is required.", stepIndex: 3 });
      if (draft.injuryIncidentDate && draft.injuryIncidentTime && draft.arrivalAt) {
        const inc = new Date(`${draft.injuryIncidentDate}T${draft.injuryIncidentTime}`).getTime();
        if (!Number.isNaN(inc) && inc > new Date(draft.arrivalAt).getTime()) {
          out.push({ message: "Injury incident cannot be after arrival.", stepIndex: 3 });
        }
      }
    }
    if (draft.isPoisoning && !draft.poisoningDescription.trim() && !draft.poisoningSubstance.trim()) {
      out.push({ message: "Poisoning description or substance is required.", stepIndex: 3 });
    }

    if (!draft.patientType) out.push({ message: "Patient type is required.", stepIndex: 4 });

    for (const [k, label] of [
      ["mobility", "Mobility"], ["respiratoryRate", "Respiratory rate"],
      ["heartRate", "Heart rate"], ["systolicBp", "Systolic BP"],
      ["temperature", "Temperature"], ["avpu", "AVPU"], ["trauma", "Trauma"],
    ] as const) {
      if (!String(draft[k as keyof Draft] ?? "").trim()) {
        out.push({ message: `${label} is required.`, stepIndex: 5 });
      }
    }

    if (draft.overridden) {
      if (!canOverride) out.push({ message: "You do not have permission to override the triage score.", stepIndex: 7 });
      if (!draft.overrideReason) out.push({ message: "Override reason is required.", stepIndex: 7 });
      if (!draft.overrideSenior.trim()) out.push({ message: "Senior healthcare professional name is required for override.", stepIndex: 7 });
    }

    if (!draft.practitionerId) out.push({ message: "Treating practitioner is required.", stepIndex: 8 });
    return out;
  }, [draft, hasOpenVisit, canOverride]);

  const currentStepIssues = issues.filter((i) => i.stepIndex === stepIdx);
  const blockingBeforeReview = issues.filter((i) => i.stepIndex < STEPS.length - 2);
  const canAdvance = currentStepIssues.length === 0;
  const isLast = stepIdx === STEPS.length - 1;
  const current = STEPS[stepIdx];

  async function complete() {
    setSubmitting(true); setError(null);
    try {
      if (blockingBeforeReview.length > 0) {
        setError(`${blockingBeforeReview.length} issue${blockingBeforeReview.length === 1 ? "" : "s"} must be resolved before saving.`);
        return;
      }
      const practitioner = practitioners.find((p) => p.id === draft.practitionerId)?.name;
      const rec = triageService.createTriage({
        facilityId: draft.facilityId,
        hospitalUnit: draft.hospitalUnit,
        patientId: draft.usingUnknown ? undefined : draft.patientId,
        patientName: draft.usingUnknown ? "Unknown patient" : draft.patientName,
        patientMrn: draft.usingUnknown ? undefined : draft.patientMrn,
        patientMaskedIdentifier: draft.usingUnknown ? undefined : draft.patientMasked,
        patientType: draft.patientType as TriagePatientType,
        gender: draft.patientGender || undefined,
        unknown: draft.usingUnknown ? {
          estimatedAge: draft.unknownEstimatedAge || undefined,
          estimatedHeight: draft.unknownEstimatedHeight || undefined,
          distinguishing: draft.unknownDistinguishing || undefined,
        } : undefined,
        arrivalAt: new Date(draft.arrivalAt).toISOString(),
        arrivalMode: draft.arrivalMode as ArrivalMode,
        ambulanceGroup: draft.arrivalMode === "Ambulance" ? draft.ambulanceGroup : undefined,
        presentingComplaint: draft.presentingComplaint,
        isInjury: draft.isInjury,
        injury: draft.isInjury ? {
          incidentDate: draft.injuryIncidentDate,
          incidentTime: draft.injuryIncidentTime,
          mechanism: draft.injuryMechanism,
          bodyRegion: draft.injuryBodyRegion,
          description: draft.injuryDescription,
        } : undefined,
        isPoisoning: draft.isPoisoning,
        poisoning: draft.isPoisoning ? {
          substance: draft.poisoningSubstance,
          route: draft.poisoningRoute || undefined,
          quantity: draft.poisoningQuantity,
          description: draft.poisoningDescription,
        } : undefined,
        practitioner,
        observation: {
          mobility: draft.mobility || undefined,
          respiratoryRate: draft.respiratoryRate ? Number(draft.respiratoryRate) : undefined,
          heartRate: draft.heartRate ? Number(draft.heartRate) : undefined,
          systolicBp: draft.systolicBp ? Number(draft.systolicBp) : undefined,
          temperature: draft.temperature ? Number(draft.temperature) : undefined,
          avpu: draft.avpu || undefined,
          trauma: draft.trauma || undefined,
          findings: draft.findings,
          score: calculatedScore,
          severity: effectiveSeverity,
          overridden: draft.overridden,
          overrideReason: draft.overridden ? draft.overrideReason : undefined,
          overrideBy: draft.overridden ? draft.overrideSenior : undefined,
          recordedBy: practitioner ?? "Triage nurse",
        },
        createdBy: practitioner ?? "Triage nurse",
      });
      setSaved(rec);
      toast.success("Triage record saved", { description: `${rec.reference} · severity ${rec.currentSeverity}` });
      onCompleted?.(rec);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save triage record.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100vh-2rem)] w-[min(1080px,calc(100vw-2rem))] max-w-none flex-col gap-0 overflow-hidden p-0">
        {/* Fixed header */}
        <DialogHeader className="shrink-0 border-b bg-gradient-to-r from-rose-500/10 via-orange-500/5 to-transparent px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-background/80 shadow-sm ring-1 ring-border">
              <Stethoscope className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="truncate text-lg">Triage Patient</DialogTitle>
              <DialogDescription className="text-xs">
                Guided triage capture — hospital context, patient, observations, severity and confirmation.
              </DialogDescription>
            </div>
            <div className="ml-auto hidden flex-wrap items-center gap-2 md:flex">
              <Badge variant="outline" className="gap-1"><Building2 className="h-3 w-3" />{TRIAGE_FACILITIES.find((f) => f.id === draft.facilityId)?.name ?? draft.facilityId}</Badge>
              <Badge variant="outline" className="gap-1"><Layers className="h-3 w-3" />{draft.hospitalUnit || "Unit not set"}</Badge>
            </div>
          </div>
        </DialogHeader>

        {/* Fixed stepper */}
        <div className="shrink-0 border-b bg-muted/30 px-4 py-3">
          <div className="flex flex-wrap gap-1.5">
            {STEPS.map((s, i) => {
              const done = i < stepIdx;
              const active = i === stepIdx;
              const Icon = s.icon;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => i <= stepIdx && setStepIdx(i)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] transition",
                    active && "border-primary bg-primary text-primary-foreground shadow-sm",
                    done && !active && "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                    !active && !done && "border-border bg-background text-muted-foreground",
                    i > stepIdx && "cursor-not-allowed opacity-60",
                  )}
                  disabled={i > stepIdx}
                >
                  <span className={cn("grid h-4 w-4 place-items-center rounded-full text-[9px] font-semibold", active ? "bg-primary-foreground/25" : done ? "bg-emerald-500/20" : "bg-muted")}>
                    {done ? <Check className="h-2.5 w-2.5" /> : <Icon className="h-2.5 w-2.5" />}
                  </span>
                  {s.title}
                </button>
              );
            })}
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">Step {stepIdx + 1} of {STEPS.length}:</span> {current.hint}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {saved ? (
            <CompletedPanel record={saved} onView={onView} onClose={() => onOpenChange(false)} />
          ) : (
            <div className="space-y-5">
              {current.key === "facility" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldSelect label="Facility" value={draft.facilityId} onChange={(v) => { set("facilityId", v); set("hospitalUnit", ""); }} options={TRIAGE_FACILITIES.map((f) => ({ value: f.id, label: f.name }))} />
                  <FieldSelect label="Hospital unit" value={draft.hospitalUnit} onChange={(v) => set("hospitalUnit", v)} options={availableUnits.map((u) => ({ value: u.name, label: u.name }))} />
                  <div className="sm:col-span-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-[12px] text-amber-800 dark:text-amber-200">
                    Score / severity output on later steps is mock workflow data for interface validation — not a production clinical scoring engine.
                  </div>
                </div>
              )}

              {current.key === "patient" && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <Checkbox checked={draft.usingUnknown} onCheckedChange={(v) => { const b = v === true; set("usingUnknown", b); if (b) { set("patientId", ""); set("patientName", ""); set("patientMrn", ""); set("patientMasked", ""); } }} />
                      Unknown / unconscious patient
                    </label>
                    {draft.usingUnknown && (
                      <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300">Unknown pathway</Badge>
                    )}
                  </div>
                  {!draft.usingUnknown && (
                    <>
                      <div className="relative">
                        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input className="pl-9" placeholder="Search by name, MRN or masked identifier…" value={patientQuery} onChange={(e) => setPatientQuery(e.target.value)} />
                      </div>
                      <div className="rounded-lg border bg-card">
                        {patientResults.length === 0 ? (
                          <div className="p-4 text-center text-xs text-muted-foreground">No patients match your search.</div>
                        ) : (
                          <ul className="divide-y">
                            {patientResults.map((p) => {
                              const selected = draft.patientId === p.id;
                              const masked = maskIdentifier(p.identifierValue);
                              return (
                                <li key={p.id}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      set("patientId", p.id);
                                      set("patientName", `${p.firstName} ${p.surname}`.trim());
                                      set("patientMrn", p.mrn);
                                      set("patientMasked", masked);
                                      set("patientGender", p.sex);
                                    }}
                                    className={cn("flex w-full items-center gap-3 p-3 text-left hover:bg-muted/50", selected && "bg-primary/10")}
                                  >
                                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                      {p.initials}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="truncate text-sm font-medium">{p.firstName} {p.surname}</div>
                                      <div className="truncate text-[11px] text-muted-foreground">
                                        MRN {p.mrn} · <span className="font-mono">{masked}</span> · {p.sex} · {p.facility}
                                      </div>
                                    </div>
                                    {selected && <Check className="h-4 w-4 text-primary" />}
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {current.key === "duplicate" && (
                <div className="space-y-3">
                  {draft.usingUnknown ? (
                    <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                      Duplicate check does not apply for unknown patients — proceed to arrival details.
                    </div>
                  ) : hasOpenVisit ? (
                    <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-4">
                      <div className="flex items-start gap-2 text-sm text-rose-700 dark:text-rose-300">
                        <AlertTriangle className="mt-0.5 h-4 w-4" />
                        <div>
                          <div className="font-semibold">Open A&E/Triage visit detected</div>
                          <p className="mt-1 text-[12px]">
                            {draft.patientName} already has an open triage visit at a Life facility. Close the triage list and attend the existing record instead of creating a duplicate.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="mr-2 inline h-4 w-4" /> No open triage visit on file — safe to proceed.
                    </div>
                  )}
                </div>
              )}

              {current.key === "arrival" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldInput type="datetime-local" label="Arrival date/time" value={draft.arrivalAt} onChange={(v) => set("arrivalAt", v)} />
                  <FieldSelect label="Arrival mode" value={draft.arrivalMode} onChange={(v) => set("arrivalMode", v as ArrivalMode)} options={ARRIVAL_MODES.map((m) => ({ value: m, label: m }))} />
                  {draft.arrivalMode === "Ambulance" && (
                    <FieldSelect label="Ambulance group" value={draft.ambulanceGroup} onChange={(v) => set("ambulanceGroup", v)} options={ambulanceGroups.map((a) => ({ value: a.name, label: a.name }))} />
                  )}
                  <div className="sm:col-span-2">
                    <Label className="mb-1 block text-xs">Presenting complaint</Label>
                    <Textarea rows={3} value={draft.presentingComplaint} onChange={(e) => set("presentingComplaint", e.target.value)} placeholder="Concise clinical summary of why the patient is presenting…" />
                  </div>

                  <div className="sm:col-span-2 rounded-lg border p-3">
                    <label className="inline-flex items-center gap-2 text-sm font-medium">
                      <Checkbox checked={draft.isInjury} onCheckedChange={(v) => set("isInjury", v === true)} /> Injury case
                    </label>
                    {draft.isInjury && (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <FieldInput type="date" label="Incident date" value={draft.injuryIncidentDate} onChange={(v) => set("injuryIncidentDate", v)} />
                        <FieldInput type="time" label="Incident time" value={draft.injuryIncidentTime} onChange={(v) => set("injuryIncidentTime", v)} />
                        <FieldInput label="Mechanism" value={draft.injuryMechanism} onChange={(v) => set("injuryMechanism", v)} placeholder="e.g. Motor vehicle collision, fall from height" />
                        <FieldInput label="Body region(s)" value={draft.injuryBodyRegion} onChange={(v) => set("injuryBodyRegion", v)} placeholder="e.g. Head, chest, right leg" />
                        <div className="sm:col-span-2">
                          <Label className="mb-1 block text-xs">Injury description</Label>
                          <Textarea rows={2} value={draft.injuryDescription} onChange={(e) => set("injuryDescription", e.target.value)} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="sm:col-span-2 rounded-lg border p-3">
                    <label className="inline-flex items-center gap-2 text-sm font-medium">
                      <Checkbox checked={draft.isPoisoning} onCheckedChange={(v) => set("isPoisoning", v === true)} /> Poisoning case
                    </label>
                    {draft.isPoisoning && (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <FieldInput label="Substance" value={draft.poisoningSubstance} onChange={(v) => set("poisoningSubstance", v)} />
                        <FieldSelect label="Route" value={draft.poisoningRoute} onChange={(v) => set("poisoningRoute", v as Draft["poisoningRoute"])} options={["Oral", "Inhaled", "Injected", "Skin", "Unknown"].map((r) => ({ value: r, label: r }))} />
                        <FieldInput label="Quantity" value={draft.poisoningQuantity} onChange={(v) => set("poisoningQuantity", v)} placeholder="e.g. ≈ 50 ml" />
                        <div className="sm:col-span-2">
                          <Label className="mb-1 block text-xs">Poisoning description</Label>
                          <Textarea rows={2} value={draft.poisoningDescription} onChange={(e) => set("poisoningDescription", e.target.value)} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {current.key === "patient-type" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldSelect label="Patient type" value={draft.patientType} onChange={(v) => set("patientType", v as TriagePatientType)} options={["Adult", "Child", "Infant", "Unknown"].map((t) => ({ value: t, label: t }))} />
                  <FieldSelect label="Gender" value={draft.patientGender} onChange={(v) => set("patientGender", v as Draft["patientGender"])} options={[{ value: "M", label: "Male" }, { value: "F", label: "Female" }, { value: "X", label: "Other / undetermined" }]} />
                  {draft.usingUnknown && (
                    <>
                      <FieldInput label="Estimated age" value={draft.unknownEstimatedAge} onChange={(v) => set("unknownEstimatedAge", v)} placeholder="e.g. 40-50" />
                      <FieldInput label="Estimated height" value={draft.unknownEstimatedHeight} onChange={(v) => set("unknownEstimatedHeight", v)} placeholder="e.g. 175 cm" />
                      <div className="sm:col-span-2">
                        <Label className="mb-1 block text-xs">Distinguishing description</Label>
                        <Textarea rows={2} value={draft.unknownDistinguishing} onChange={(e) => set("unknownDistinguishing", e.target.value)} placeholder="Clothing, tattoos, marks, notable belongings…" />
                      </div>
                    </>
                  )}
                </div>
              )}

              {current.key === "observations" && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <FieldSelect label="Mobility" value={draft.mobility} onChange={(v) => set("mobility", v as MobilityLevel)} options={MOBILITY.map((m) => ({ value: m, label: m }))} />
                  <FieldInput label="Respiratory rate" value={draft.respiratoryRate} onChange={(v) => set("respiratoryRate", v)} placeholder="/min" type="number" />
                  <FieldInput label="Heart rate" value={draft.heartRate} onChange={(v) => set("heartRate", v)} placeholder="bpm" type="number" />
                  <FieldInput label="Systolic BP" value={draft.systolicBp} onChange={(v) => set("systolicBp", v)} placeholder="mmHg" type="number" />
                  <FieldInput label="Temperature" value={draft.temperature} onChange={(v) => set("temperature", v)} placeholder="°C" type="number" />
                  <FieldSelect label="AVPU / consciousness" value={draft.avpu} onChange={(v) => set("avpu", v as AvpuLevel)} options={AVPU.map((a) => ({ value: a, label: a }))} />
                  <FieldSelect label="Trauma / mechanism" value={draft.trauma} onChange={(v) => set("trauma", v as TraumaLevel)} options={TRAUMA.map((t) => ({ value: t, label: t }))} />
                </div>
              )}

              {current.key === "findings" && (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">Tick any clinically relevant findings. Grouped to keep the screen usable.</p>
                  {FINDING_GROUPS.map((g) => (
                    <div key={g.title} className="rounded-lg border p-3">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{g.title}</div>
                      <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                        {g.keys.map((k) => (
                          <label key={k} className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted/40">
                            <Checkbox
                              checked={!!draft.findings[k]}
                              onCheckedChange={(v) => set("findings", { ...draft.findings, [k]: v === true })}
                            />
                            {TRIAGE_FINDING_LABELS[k]}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {current.key === "score" && (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border bg-card p-4">
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Calculated score</div>
                      <div className="mt-1 text-3xl font-semibold tracking-tight">{calculatedScore}</div>
                    </div>
                    <div className="rounded-xl border bg-card p-4">
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Calculated severity</div>
                      <SeverityChip severity={calculatedSeverity} className="mt-1" />
                    </div>
                    <div className="rounded-xl border bg-card p-4">
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Effective severity</div>
                      <SeverityChip severity={effectiveSeverity} className="mt-1" />
                    </div>
                  </div>
                  <div className="rounded-xl border p-4">
                    <label className={cn("inline-flex items-center gap-2 text-sm font-medium", !canOverride && "opacity-60")}>
                      <Checkbox checked={draft.overridden} disabled={!canOverride} onCheckedChange={(v) => set("overridden", v === true)} />
                      Override calculated severity
                      {!canOverride && <Badge variant="outline" className="ml-2 border-muted-foreground/30 text-[10px]"><Lock className="mr-1 h-2.5 w-2.5" /> Elevated permission required</Badge>}
                    </label>
                    {draft.overridden && canOverride && (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <FieldSelect label="Override reason" value={draft.overrideReason} onChange={(v) => set("overrideReason", v)} options={overrideReasons.map((r) => ({ value: r.label, label: r.label }))} />
                        <FieldInput label="Senior healthcare professional" value={draft.overrideSenior} onChange={(v) => set("overrideSenior", v)} placeholder="Approving senior clinician name" />
                        <FieldSelect
                          label="Override severity"
                          value={overrideSeverity}
                          onChange={(v) => setOverrideSeverity(v as TriageSeverity | "")}
                          options={(["Red", "Orange", "Yellow", "Green", "Blue"] as TriageSeverity[]).map((s) => ({ value: s, label: s }))}
                        />
                      </div>
                    )}
                  </div>
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-[12px] text-amber-800 dark:text-amber-200">
                    This score/severity is mock workflow data for interface validation — not a production clinical decision engine.
                  </div>
                </div>
              )}

              {current.key === "practitioner" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldSelect
                    label="Treating practitioner"
                    value={draft.practitionerId}
                    onChange={(v) => set("practitionerId", v)}
                    options={practitioners.map((p) => ({ value: p.id, label: `${p.name} · ${p.discipline}` }))}
                  />
                </div>
              )}

              {current.key === "review" && (
                <div className="space-y-3">
                  <ReviewRow icon={Building2} label="Facility / unit" value={`${TRIAGE_FACILITIES.find((f) => f.id === draft.facilityId)?.name ?? draft.facilityId} · ${draft.hospitalUnit}`} />
                  <ReviewRow icon={User} label="Patient" value={draft.usingUnknown ? `Unknown patient — ${draft.unknownDistinguishing || "no description"}` : `${draft.patientName} · MRN ${draft.patientMrn} · ${draft.patientMasked}`} />
                  <ReviewRow icon={Ambulance} label="Arrival" value={`${new Date(draft.arrivalAt).toLocaleString("en-ZA")} · ${draft.arrivalMode}${draft.arrivalMode === "Ambulance" ? ` · ${draft.ambulanceGroup}` : ""}`} />
                  <ReviewRow icon={ClipboardList} label="Complaint" value={draft.presentingComplaint || "—"} />
                  {draft.isInjury && <ReviewRow icon={AlertTriangle} label="Injury" value={`${draft.injuryMechanism || "—"}${draft.injuryBodyRegion ? ` · ${draft.injuryBodyRegion}` : ""}`} />}
                  {draft.isPoisoning && <ReviewRow icon={FlaskConical} label="Poisoning" value={`${draft.poisoningSubstance || "Substance"} · ${draft.poisoningRoute || "route"}${draft.poisoningQuantity ? ` · ${draft.poisoningQuantity}` : ""}`} />}
                  <ReviewRow icon={Activity} label="Observations" value={`RR ${draft.respiratoryRate || "—"} · HR ${draft.heartRate || "—"} · BP ${draft.systolicBp || "—"} · T ${draft.temperature || "—"} · ${draft.avpu || "—"} · ${draft.mobility || "—"}`} />
                  <ReviewRow icon={HeartPulse} label="Score / severity" value={<><span className="font-semibold">{calculatedScore}</span> · <SeverityChip severity={effectiveSeverity} inline />{draft.overridden && <span className="ml-2 text-[11px] text-amber-700 dark:text-amber-300">overridden by {draft.overrideSenior}</span>}</>} />
                  <ReviewRow icon={Stethoscope} label="Practitioner" value={practitioners.find((p) => p.id === draft.practitionerId)?.name ?? "—"} />
                  {issues.length > 0 && (
                    <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3">
                      <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-rose-700 dark:text-rose-300">
                        <AlertTriangle className="h-4 w-4" /> {issues.length} issue{issues.length === 1 ? "" : "s"} to resolve
                      </div>
                      <ul className="space-y-0.5 text-[12px] text-rose-700 dark:text-rose-300">
                        {issues.map((i, idx) => <li key={idx}>• {i.message}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {current.key === "complete" && !saved && (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  Click <span className="font-medium text-foreground">Save triage record</span> to persist this triage and generate a reference.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fixed footer */}
        <div className="shrink-0 border-t bg-background/95 px-6 py-3 backdrop-blur">
          <div className="flex flex-wrap items-center gap-2">
            {error && (
              <span className="mr-auto inline-flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-3.5 w-3.5" /> {error}
              </span>
            )}
            {!error && currentStepIssues.length > 0 && !saved && (
              <span className="mr-auto text-xs text-amber-700 dark:text-amber-300">{currentStepIssues[0].message}</span>
            )}
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                <X className="mr-1 h-4 w-4" /> Close
              </Button>
              {!saved && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setStepIdx((i) => Math.max(0, i - 1))} disabled={stepIdx === 0}>
                    <ArrowLeft className="mr-1 h-4 w-4" /> Back
                  </Button>
                  {!isLast ? (
                    <Button size="sm" onClick={() => canAdvance && setStepIdx((i) => Math.min(STEPS.length - 1, i + 1))} disabled={!canAdvance}>
                      Next <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button size="sm" onClick={complete} disabled={submitting || issues.length > 0}>
                      {submitting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
                      Save triage record
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------- shared subcomponents -------- */

function FieldInput({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <Label className="mb-1 block text-xs">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function FieldSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <div>
      <Label className="mb-1 block text-xs">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function ReviewRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value: React.ReactNode }) {
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

function SeverityChip({ severity, className, inline }: { severity: TriageSeverity; className?: string; inline?: boolean }) {
  const tone: Record<TriageSeverity, string> = {
    Red: "bg-rose-600 text-white",
    Orange: "bg-orange-500 text-white",
    Yellow: "bg-amber-400 text-black",
    Green: "bg-emerald-500 text-white",
    Blue: "bg-sky-500 text-white",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm", tone[severity], inline ? "" : "", className)}>
      {severity}
    </span>
  );
}

function CompletedPanel({ record, onView, onClose }: { record: TriageRecord; onView?: (r: TriageRecord) => void; onClose: () => void }) {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-6 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/30">
        <CheckCircle2 className="h-7 w-7" />
      </div>
      <div>
        <h3 className="text-lg font-semibold">Triage saved</h3>
        <p className="mt-1 text-sm text-muted-foreground">Reference <span className="font-mono">{record.reference}</span> · severity <SeverityChip severity={record.currentSeverity} inline /></p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button size="sm" onClick={() => { onView?.(record); onClose(); }}>Open triage record</Button>
        <Button variant="outline" size="sm" onClick={onClose}><ListChecks className="mr-1 h-4 w-4" /> Return to triage list</Button>
      </div>
    </div>
  );
}

/* -------- constants -------- */

const ARRIVAL_MODES: ArrivalMode[] = [
  "Walk-in", "Ambulance", "Referral", "Inter-hospital transfer", "Police / SAPS", "Own transport",
];
const MOBILITY: MobilityLevel[] = ["Walking", "With aid", "Wheelchair", "Stretcher", "Immobile"];
const AVPU: AvpuLevel[] = ["Alert", "Voice", "Pain", "Unresponsive"];
const TRAUMA: TraumaLevel[] = ["None", "Minor", "Significant", "Severe"];

const FINDING_GROUPS: Array<{ title: string; keys: Array<keyof TriageFindingFlags> }> = [
  { title: "Airway & breathing", keys: ["shortnessOfBreath", "stridor", "drooling", "wheeze", "haemoptysis"] },
  { title: "Cardiovascular & bleeding", keys: ["chestPain", "haemorrhage", "prBleeding", "purpura"] },
  { title: "Neurology & consciousness", keys: ["seizure", "focalNeurology", "psychosis"] },
  { title: "Trauma & mechanism", keys: ["highEnergyTransfer", "fracture", "burn", "threatenedLimb"] },
  { title: "Metabolic & other", keys: ["diabeticConcern", "vomiting", "abdominalPain", "poisoning", "pregnancy", "pain"] },
];

// Fix missing Lock import above (used in override block)
import { Lock } from "lucide-react";
