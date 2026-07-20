import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ClipboardCheck,
  HeartPulse,
  Radio,
  Search,
  User,
  Wallet,
} from "lucide-react";

import { toast } from "sonner";
import { Card } from "@/components/app-shell";
import { RuleResults } from "@/components/workflow/rule-results";
import { CurrentStateModuleButton } from "@/components/current-state/module-specification";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FACILITIES, useFacilityContext } from "@/lib/facility-context";
import { availablePatients, usePatientContext } from "@/lib/patient-context";
import type { ModuleKey } from "@/lib/workflow-store";
import type { RuleEvaluationSummary, RuleResult } from "@/rules/types";
import { useAuth } from "@/security/auth-provider";
import { canAccessFacility } from "@/security/facility-scope";
import { hasPermission, Permissions } from "@/security/permissions";
import { getDefaultModulePermissions } from "@/security/module-permissions";
import type { Permission } from "@/security/types";
import { draftsService } from "@/services/drafts.service";
import { getModuleService } from "@/services/modules/registry";
import { validateModuleInput } from "@/validation/engine";

export type StepField = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "select" | "date" | "datetime-local";
  options?: string[];
  required?: boolean;
  placeholder?: string;
  hint?: string;
  group?: string;
  permission?: Permission;
  readOnly?: boolean;
};

export type FlowStep = {
  key: string;
  title: string;
  description: string;
  fields?: StepField[];
  checklist?: string[];
  events?: string[];
  rules?: string[];
  ruleIds?: string[];
  permission?: Permission;
  optional?: boolean;
};

export type BusinessFlow = {
  moduleKey: ModuleKey;
  title: string;
  purpose: string;
  routeFamily: string[];
  legacySource: string;
  patientRequired?: boolean;
  steps: FlowStep[];
  globalRules: string[];
  globalRuleIds?: string[];
  handoffs?: string[];
  events: string[];
  acceptance: string[];
  completionKind: string;
  completionStatus: string;
  completionLabel?: string;
  createPermission?: Permission;
  completionPermission?: Permission;
  draftKey?: string;
  titleFrom?: (values: Record<string, string>) => string;
  subtitleFrom?: (values: Record<string, string>) => string;
};

type Values = Record<string, string>;

export function PatientBanner({
  values,
  onSelectPatient,
}: {
  values: Values;
  onSelectPatient?: () => void;
}) {
  const hasPatient = Boolean(values.patient || values.name);
  const name = values.patient || values.name || "";
  const mrn = values.mrn || values.idNumber || "—";
  const dob = values.dob || "—";
  const gender = values.gender || "—";
  const facility = values.facility || "—";
  const ward = values.ward || values.unit || "—";
  const allergies = values.allergies?.trim();
  const scheme = values.scheme || values.funder || "—";

  if (!hasPatient) {
    return (
      <Card className="flex min-h-[82px] items-center justify-between gap-4 border-primary/25 bg-primary/[0.035] px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
            <User className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Patient banner</div>
            <div className="font-medium">No patient selected</div>
            <p className="truncate text-xs text-muted-foreground">
              Select a patient to load the active episode of care.
            </p>
          </div>
        </div>
        {onSelectPatient && (
          <Button size="sm" variant="outline" onClick={onSelectPatient}>
            Select patient
          </Button>
        )}
      </Card>
    );
  }

  return (
    <Card className="border-primary/25 bg-primary/[0.035] px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="flex min-w-[230px] items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
            <User className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Patient</div>
            <div className="truncate font-semibold">{name}</div>
            <div className="text-xs text-muted-foreground">{mrn} · {dob} · {gender}</div>
          </div>
        </div>
        <BannerCell icon={Building2} label="Facility / ward" value={`${facility} · ${ward}`} />
        <BannerCell icon={Wallet} label="Scheme" value={scheme} />
        <BannerCell
          icon={HeartPulse}
          label="Clinical alerts"
          value={allergies ? `Allergies: ${allergies}` : "No alerts recorded"}
          alert={Boolean(allergies)}
        />
        {onSelectPatient && (
          <Button className="ml-auto" size="sm" variant="ghost" onClick={onSelectPatient}>
            Change patient
          </Button>
        )}
      </div>
    </Card>
  );
}

function BannerCell({
  icon: Icon,
  label,
  value,
  alert = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div className="flex min-w-[150px] items-center gap-2 border-l border-border pl-4">
      <Icon className={`h-4 w-4 shrink-0 ${alert ? "text-destructive" : "text-muted-foreground"}`} />
      <div className="min-w-0">
        <div className="text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
        <div className={`truncate text-xs font-medium ${alert ? "text-destructive" : ""}`}>{value}</div>
      </div>
    </div>
  );
}

export function BusinessFlowWizard({ flow }: { flow: BusinessFlow }) {
  const { principal } = useAuth();
  const currentPatientId = usePatientContext((state) => state.currentPatientId);
  const setPatient = usePatientContext((state) => state.setPatient);
  const globalFacility = useFacilityContext((state) => state.facility);
  const [index, setIndex] = useState(0);
  const [values, setValues] = useState<Values>({});
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [ruleResults, setRuleResults] = useState<RuleResult[]>([]);
  const [patientPickerOpen, setPatientPickerOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [busy, setBusy] = useState(false);

  const stepperRef = useRef<HTMLDivElement>(null);
  const total = flow.steps.length;
  const step = flow.steps[index];
  const isLast = index === total - 1;
  const draftKey = flow.draftKey ?? `${flow.moduleKey}:${flow.title}`;
  const defaultPermissions = getDefaultModulePermissions(flow.moduleKey);
  const createPermission = flow.createPermission ?? defaultPermissions.create;
  const managePermission = flow.completionPermission ?? defaultPermissions.manage ?? createPermission;

  useEffect(() => {
    const draft = draftsService.load<Values>(draftKey);
    if (!draft) return;
    setValues(draft.values);
    setIndex(Math.min(draft.stepIndex, Math.max(0, flow.steps.length - 1)));
    setCompleted(new Set(draft.completedSteps));
  }, [draftKey, flow.steps.length]);

  useEffect(() => {
    if (!currentPatientId) return;
    const patient = availablePatients.find((candidate) => candidate.id === currentPatientId);
    if (!patient) return;
    setValues((current) => ({
      ...current,
      patientId: patient.id,
      patient: patient.name,
      mrn: patient.mrn,
      scheme: patient.scheme,
      dob: patient.dob,
      gender: patient.gender,
      patientStatus: patient.status,
      facility: current.facility || patient.facility || globalFacility,
    }));
  }, [currentPatientId, globalFacility]);

  useEffect(() => {
    if (globalFacility && globalFacility !== "All facilities") {
      setValues((current) => (current.facility ? current : { ...current, facility: globalFacility }));
    }
  }, [globalFacility]);

  // Auto-mark patient-identity steps complete when a patient is already loaded,
  // so users are not asked to "select a patient" twice when the banner already shows one.
  useEffect(() => {
    if (!values.patient) return;
    const identityKeys = new Set(["patient", "identity", "context", "select-patient"]);
    setCompleted((current) => {
      let changed = false;
      const next = new Set(current);
      flow.steps.forEach((candidate, candidateIndex) => {
        if (!identityKeys.has(candidate.key)) return;
        const missing = (candidate.fields ?? []).filter((field) => {
          if (!field.required) return false;
          const value = values[field.name];
          return value === undefined || value === null || String(value).trim() === "";
        });
        if (missing.length === 0 && !next.has(candidateIndex)) {
          next.add(candidateIndex);
          changed = true;
        }
      });
      return changed ? next : current;
    });
  }, [values, flow.steps]);

  useEffect(() => {
    const element = stepperRef.current?.querySelector<HTMLElement>(`[data-step-idx="${index}"]`);
    element?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [index]);


  const groupedFields = useMemo(() => {
    const groups = new Map<string, StepField[]>();
    for (const field of step.fields ?? []) {
      const key = field.group ?? "";
      groups.set(key, [...(groups.get(key) ?? []), field]);
    }
    return [...groups.entries()];
  }, [step.fields]);

  const missingRequired = useMemo(
    () =>
      (step.fields ?? []).filter((field) => {
        if (!field.required) return false;
        const value = values[field.name];
        return value === undefined || value === null || String(value).trim() === "";
      }),
    [step.fields, values],
  );

  const permission = step.permission ?? createPermission;
  const facilityAllowed = !values.facility || canAccessFacility(principal, values.facility);
  const quickBlockedReasons = [
    ...missingRequired.map((field) => `${field.label} is required`),
    ...(flow.patientRequired && !values.patient ? ["Select a patient"] : []),
    ...(!hasPermission(principal, permission) ? [`Permission ${permission} is required`] : []),
    ...(!facilityAllowed ? [`You are not authorised for ${values.facility}`] : []),
  ];

  function setValue(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }


  async function validateCurrentStep(): Promise<RuleEvaluationSummary> {
    const summary = await validateModuleInput({
      moduleKey: flow.moduleKey,
      action: `step:${step.key}`,
      fields: (step.fields ?? []).map((field) => ({ name: field.name, label: field.label, type: field.type, required: field.required, stepIndex: index })),
      values,
      user: principal,
      facility: values.facility || globalFacility,
      patientId: values.patientId || currentPatientId,
      patientRequired: flow.patientRequired,
      permission,
      completedSteps: [...completed].map((stepIndex) => flow.steps[stepIndex]?.key).filter(Boolean),
      mandatorySteps: flow.steps.filter((candidate) => !candidate.optional).map((candidate) => candidate.key),
      additionalRuleIds: [...(flow.globalRuleIds ?? []), ...(step.ruleIds ?? [])],
      stepIndex: index,
    });
    setFieldErrors(summary.fieldErrors);
    setRuleResults(summary.results);
    if (!summary.allowed) toast.error(summary.errors[0]?.message ?? "The workflow step did not pass validation.");
    else if (summary.warnings.length) toast.warning(summary.warnings[0].message);
    return summary;
  }

  async function goNext() {
    const validation = await validateCurrentStep();
    if (!validation.allowed) return;
    setCompleted((current) => new Set(current).add(index));
    if (!isLast) setIndex((current) => current + 1);
  }

  function goPrevious() {
    if (index > 0) setIndex((current) => current - 1);
  }

  function saveDraft() {
    draftsService.save({
      key: draftKey,
      values,
      stepIndex: index,
      completedSteps: [...completed],
      updatedAt: new Date().toISOString(),
    });
    toast.success("Draft saved for this session.");
  }

  async function submit() {
    setBusy(true);
    try {
      const currentValidation = await validateCurrentStep();
      if (!currentValidation.allowed) return;

      const completedStepKeys = new Set([...completed, index].map((stepIndex) => flow.steps[stepIndex]?.key));
      const completionPermission = managePermission;
      const completion = await validateModuleInput({
        moduleKey: flow.moduleKey,
        action: "complete",
        fields: flow.steps.flatMap((candidateStep, candidateIndex) => (candidateStep.fields ?? []).map((field) => ({ name: field.name, label: field.label, type: field.type, required: field.required, stepIndex: candidateIndex }))),
        values,
        user: principal,
        facility: values.facility || globalFacility,
        patientId: values.patientId || currentPatientId,
        patientRequired: flow.patientRequired,
        permission: completionPermission,
        completedSteps: [...completedStepKeys].filter((value): value is string => Boolean(value)),
        mandatorySteps: flow.steps.filter((candidate) => !candidate.optional).map((candidate) => candidate.key),
        additionalRuleIds: ["common.all-steps-complete", ...(flow.globalRuleIds ?? [])],
      });
      setRuleResults(completion.results);
      setFieldErrors(completion.fieldErrors);
      if (!completion.allowed) {
        toast.error(completion.errors[0]?.message ?? "The workflow cannot be completed.");
        return;
      }

      const title =
        flow.titleFrom?.(values) ?? values.patient ?? values.name ?? flow.completionLabel ?? flow.title;
      const subtitle =
        flow.subtitleFrom?.(values) ??
        [values.facility, values.procedure, values.ward].filter(Boolean).join(" · ");
      const fields: Record<string, string | number> = { Kind: flow.completionKind };
      for (const candidateStep of flow.steps) {
        for (const field of candidateStep.fields ?? []) {
          if (values[field.name] !== undefined && values[field.name] !== "") {
            fields[field.label] = field.type === "number" ? Number(values[field.name]) : values[field.name];
          }
        }
      }

      const result = await getModuleService(flow.moduleKey).createRecord({
        title,
        subtitle,
        status: flow.completionStatus,
        fields,
      });
      toast.success(`${flow.completionLabel ?? flow.title} completed`, {
        description: `${result.data.id} · ${result.correlationId}`,
      });
      draftsService.remove(draftKey);
      setValues({});
      setCompleted(new Set());
      setFieldErrors({});
      setRuleResults([]);
      setIndex(0);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "The workflow could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  const progress = Math.round((completed.size / total) * 100);
  const canOverrideFacility = hasPermission(principal, Permissions.FacilityOverride);
  const blockedText = quickBlockedReasons.join("; ");

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {flow.patientRequired && <PatientBanner values={values} onSelectPatient={() => setPatientPickerOpen(true)} />}

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card/50 px-3 py-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold">{flow.title}</span>
            <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium">Draft</span>
            <span className="text-muted-foreground">Step {index + 1} of {total}</span>
            <span className="text-muted-foreground">{progress}% complete</span>
          </div>
          <div className="flex items-center gap-2"><span className="text-[11px] text-muted-foreground">{completed.size} of {total} steps signed</span><CurrentStateModuleButton moduleKey={flow.moduleKey} compact /></div>
        </div>

        <div
          ref={stepperRef}
          className="relative flex snap-x gap-0 overflow-x-auto rounded-2xl border border-border bg-card/60 px-4 py-4 scrollbar-hidden"
          aria-label="Workflow steps"
        >
          {flow.steps.map((candidate, candidateIndex) => {
            const done = completed.has(candidateIndex);
            const active = candidateIndex === index;
            const furthest = Math.max(...[...completed, -1]) + 1;
            const canJump = done || candidateIndex <= furthest;
            const isFirst = candidateIndex === 0;
            const prevDone = completed.has(candidateIndex - 1);
            return (
              <div key={candidate.key} data-step-idx={candidateIndex} className="flex min-w-[140px] flex-1 snap-start items-start">
                {!isFirst && (
                  <div
                    aria-hidden
                    className={
                      "mt-4 h-[2px] flex-1 rounded-full transition-colors " +
                      (prevDone ? "bg-primary" : "bg-border")
                    }
                  />
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      disabled={!canJump}
                      onClick={() => canJump && setIndex(candidateIndex)}
                      aria-current={active ? "step" : undefined}
                      className={
                        "group flex min-w-[140px] flex-col items-center gap-1.5 px-2 text-center focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 " +
                        (isFirst ? "" : "-ml-2")
                      }
                    >
                      <span
                        className={
                          "flex h-9 w-9 items-center justify-center rounded-full border-2 text-[12px] font-semibold transition-all group-focus-visible:ring-2 group-focus-visible:ring-primary/40 " +
                          (done
                            ? "border-primary bg-primary text-primary-foreground shadow-soft"
                            : active
                              ? "border-primary bg-background text-primary ring-4 ring-primary/15"
                              : "border-border bg-background text-muted-foreground group-hover:border-primary/40")
                        }
                      >
                        {done ? <Check className="h-4 w-4" /> : candidateIndex + 1}
                      </span>
                      <span
                        className={
                          "line-clamp-2 max-w-[140px] text-[11px] leading-tight transition-colors " +
                          (active
                            ? "font-semibold text-foreground"
                            : done
                              ? "font-medium text-foreground/80"
                              : "text-muted-foreground")
                        }
                      >
                        {candidate.title}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{candidate.description}</TooltipContent>
                </Tooltip>
              </div>
            );
          })}
        </div>


        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <Card className="p-5 sm:p-6">
            <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-primary">
              Step {String(index + 1).padStart(2, "0")} · {flow.title}
            </div>
            <h2 className="mt-1 font-display text-xl font-semibold">{step.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>

            {ruleResults.length > 0 && (
              <div className="mt-4">
                <RuleResults results={ruleResults} />
              </div>
            )}

            {groupedFields.map(([groupLabel, fields], groupIndex) => (
              <section key={groupLabel || groupIndex} className={groupIndex === 0 ? "mt-5" : "mt-6 border-t border-border pt-5"}>
                {groupLabel && (
                  <div className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {groupLabel}
                  </div>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  {fields.map((field) => {
                    const fieldAllowed = hasPermission(principal, field.permission);
                    const facilityField = field.name === "facility";
                    const disabled = field.readOnly || !fieldAllowed || (facilityField && !canOverrideFacility && Boolean(globalFacility));
                    return (
                      <div key={field.name} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                        <Label htmlFor={field.name}>
                          {field.label}{field.required && <span className="text-destructive"> *</span>}
                        </Label>
                        {field.type === "textarea" ? (
                          <Textarea
                            id={field.name}
                            rows={4}
                            value={values[field.name] ?? ""}
                            placeholder={field.placeholder}
                            disabled={disabled}
                            aria-invalid={Boolean(fieldErrors[field.name])}
                            onChange={(event) => setValue(field.name, event.target.value)}
                          />
                        ) : field.type === "select" ? (
                          (() => {
                            const opts = (facilityField && !(field.options?.length) ? [...FACILITIES] : field.options ?? []);
                            const searchable = opts.length > 8;
                            const listId = `${field.name}-options`;
                            if (searchable) {
                              return (
                                <>
                                  <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                      id={field.name}
                                      list={listId}
                                      value={values[field.name] ?? ""}
                                      placeholder={field.placeholder ?? "Search…"}
                                      disabled={disabled}
                                      aria-invalid={Boolean(fieldErrors[field.name])}
                                      onChange={(event) => setValue(field.name, event.target.value)}
                                      className="pl-9"
                                    />
                                  </div>
                                  <datalist id={listId}>
                                    {opts.map((option) => (<option key={option} value={option} />))}
                                  </datalist>
                                </>
                              );
                            }
                            return (
                              <select
                                id={field.name}
                                value={values[field.name] ?? ""}
                                disabled={disabled}
                                aria-invalid={Boolean(fieldErrors[field.name])}
                                onChange={(event) => setValue(field.name, event.target.value)}
                                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <option value="">Select…</option>
                                {opts.map((option) => (<option key={option} value={option}>{option}</option>))}
                              </select>
                            );
                          })()

                        ) : (
                          <Input
                            id={field.name}
                            type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "datetime-local" ? "datetime-local" : "text"}
                            value={values[field.name] ?? ""}
                            placeholder={field.placeholder}
                            disabled={disabled}
                            aria-invalid={Boolean(fieldErrors[field.name])}
                            onChange={(event) => setValue(field.name, event.target.value)}
                          />
                        )}
                        {fieldErrors[field.name] ? (
                          <p className="mt-1 text-xs text-destructive">{fieldErrors[field.name]}</p>
                        ) : field.hint ? (
                          <p className="mt-1 text-[11px] text-muted-foreground">{field.hint}</p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}

            {step.checklist && step.checklist.length > 0 && (
              <div className="mt-5 rounded-xl border border-border bg-muted/30 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Verify before continuing</div>
                <ul className="mt-2 space-y-1.5">
                  {step.checklist.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {step.events && step.events.length > 0 && (
              <div className="mt-4 rounded-xl border border-info/20 bg-info/5 p-3">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-info">
                  <Radio className="h-3 w-3" /> Events on completion
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {step.events.map((eventName) => (
                    <span key={eventName} className="rounded-md border border-info/30 bg-info/10 px-2 py-0.5 font-mono text-[11px] text-info">
                      {eventName}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <aside className="hidden lg:block">
            <Card className="sticky top-20 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Workflow status</div>
              <dl className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between"><dt className="text-muted-foreground">Progress</dt><dd className="font-medium">{progress}%</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Signed steps</dt><dd className="font-medium">{completed.size} / {total}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Required</dt><dd className={quickBlockedReasons.length ? "font-medium text-destructive" : "font-medium text-success"}>{quickBlockedReasons.length ? `${quickBlockedReasons.length} outstanding` : "All complete"}</dd></div>
              </dl>
              {(step.rules?.length || flow.globalRules.length) ? (
                <div className="mt-5">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Business guidance</div>
                  <ul className="mt-2 space-y-1.5">
                    {[...flow.globalRules, ...(step.rules ?? [])].map((rule) => (
                      <li key={rule} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" /> {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {!facilityAllowed && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Facility access is not authorised.
                </div>
              )}
            </Card>
          </aside>
        </div>

        <div className="sticky bottom-3 z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/95 px-4 py-3 shadow-elevated backdrop-blur">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goPrevious} disabled={index === 0 || busy}>
                <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back
              </Button>
              <Button variant="ghost" size="sm" onClick={saveDraft} disabled={busy}>Save draft</Button>
            </div>
            <div className="flex items-center gap-3">
              {quickBlockedReasons.length > 0 && (
                <span className="hidden max-w-[380px] truncate text-[11px] text-destructive sm:inline">{blockedText}</span>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      size="sm"
                      className="bg-gradient-primary hover:opacity-90"
                      disabled={quickBlockedReasons.length > 0 || busy}
                      onClick={() => void (isLast ? submit() : goNext())}
                    >
                      {isLast ? <><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> {busy ? "Completing…" : "Complete flow"}</> : <>Next step <ArrowRight className="ml-1 h-3.5 w-3.5" /></>}
                    </Button>
                  </span>
                </TooltipTrigger>
                {quickBlockedReasons.length > 0 && <TooltipContent>{blockedText}</TooltipContent>}
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={patientPickerOpen} onOpenChange={(open) => { setPatientPickerOpen(open); if (!open) setPatientSearch(""); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select patient and active context</DialogTitle>
            <DialogDescription>Search by name, MRN, ID number, scheme or facility.</DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={patientSearch}
              onChange={(event) => setPatientSearch(event.target.value)}
              placeholder="Search patients…"
              className="pl-9"
              aria-label="Search patients"
            />
          </div>
          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {(() => {
              const query = patientSearch.trim().toLowerCase();
              const filtered = query
                ? availablePatients.filter((patient) =>
                    [patient.name, patient.mrn, patient.dob, patient.scheme, patient.facility, patient.id]
                      .filter(Boolean)
                      .some((value) => String(value).toLowerCase().includes(query)),
                  )
                : availablePatients;
              if (filtered.length === 0) {
                return (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    No patients match “{patientSearch}”.
                  </div>
                );
              }
              return filtered.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => {
                    setPatient(patient.id);
                    setPatientPickerOpen(false);
                    setPatientSearch("");
                    toast.success("Patient context loaded", { description: patient.name });
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  <span>
                    <span className="block font-medium">{patient.name}</span>
                    <span className="block text-xs text-muted-foreground">{patient.mrn} · {patient.dob} · {patient.scheme}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{patient.facility}</span>
                </button>
              ));
            })()}
          </div>
        </DialogContent>
      </Dialog>

    </TooltipProvider>
  );
}
