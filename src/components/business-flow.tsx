import { useMemo, useRef, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Radio,
  ClipboardCheck, User, HeartPulse, Building2, Wallet, AlertTriangle,
  UserPlus, ChevronRight,
} from "lucide-react";
import { Card } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useWorkflow, type ModuleKey } from "@/lib/workflow-store";
import { usePatientContext, availablePatients } from "@/lib/patient-context";

// ---------- Types ----------

export type StepField = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "select";
  options?: string[];
  required?: boolean;
  placeholder?: string;
  hint?: string;
  group?: string; // NEW: group label for form section
};

export type FlowStep = {
  key: string;
  title: string;
  description: string;
  fields?: StepField[];
  checklist?: string[];
  events?: string[];
  rules?: string[];
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
  handoffs?: string[];
  events: string[];
  acceptance: string[];
  completionKind: string;
  completionStatus: string;
  completionLabel?: string;
  titleFrom?: (values: Record<string, string>) => string;
  subtitleFrom?: (values: Record<string, string>) => string;
};

// ---------- Patient Banner ----------

export function PatientBanner({
  values,
  onSelectPatient,
}: {
  values: Record<string, string>;
  onSelectPatient?: () => void;
}) {
  const hasPatient = !!(values.patient || values.name);
  const name = values.patient || values.name || "";
  const mrn = values.mrn || values.idNumber || "—";
  const dob = values.dob || "—";
  const gender = values.gender || "—";
  const facility = values.facility || "—";
  const ward = values.ward || values.unit || "";
  const allergies = values.allergies?.trim();
  const scheme = values.scheme || values.funder || "—";

  if (!hasPatient) {
    return (
      <div className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground">
            <User className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-medium text-foreground">No patient selected</div>
            <div className="text-xs text-muted-foreground">
              Select a patient to begin the workflow and load the active episode of care.
            </div>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={onSelectPatient}>
          <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Select patient
        </Button>
      </div>
    );
  }

  return (
    <div className="mb-5 rounded-xl border border-primary/25 bg-gradient-to-r from-primary/10 via-accent/5 to-transparent px-4 py-2.5 shadow-soft">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
            <User className="h-4 w-4" />
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate font-display text-[15px] font-semibold text-foreground">{name}</div>
            <div className="truncate text-[11px] text-muted-foreground">
              <span className="font-mono">{mrn}</span> · {dob} · {gender}
            </div>
          </div>
        </div>
        <div className="hidden h-6 w-px bg-border sm:block" />
        <BannerCell icon={Building2} label="Facility" value={facility} />
        {ward && <BannerCell icon={HeartPulse} label="Ward" value={ward} />}
        <BannerCell icon={Wallet} label="Scheme" value={scheme} />
        {allergies && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-0.5 text-[11px] font-medium text-destructive">
            <AlertTriangle className="h-3 w-3" /> {allergies}
          </span>
        )}
        {onSelectPatient && (
          <button
            onClick={onSelectPatient}
            className="ml-auto text-[11px] font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded"
          >
            Change patient
          </button>
        )}
      </div>
    </div>
  );
}

function BannerCell({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3 w-3 text-muted-foreground" />
      <div className="leading-tight">
        <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-[11px] font-medium text-foreground">{value}</div>
      </div>
    </div>
  );
}

// ---------- Wizard ----------

export function BusinessFlowWizard({ flow }: { flow: BusinessFlow }) {
  const create = useWorkflow((s) => s.create);
  const currentPatientId = usePatientContext((s) => s.currentPatientId);
  const setPatient = usePatientContext((s) => s.setPatient);
  const [index, setIndex] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const stepperRef = useRef<HTMLOListElement | null>(null);

  const total = flow.steps.length;
  const step = flow.steps[index];
  const isLast = index === total - 1;

  // Sync patient context into flow values
  useEffect(() => {
    if (currentPatientId) {
      const p = availablePatients.find((x) => x.id === currentPatientId);
      if (p) {
        setValues((s) => ({
          ...s,
          patient: s.patient || p.name,
          mrn: s.mrn || p.mrn,
          scheme: s.scheme || p.scheme,
        }));
      }
    }
  }, [currentPatientId]);

  // Keep active step in view on stepper scroll
  useEffect(() => {
    const el = stepperRef.current?.querySelector<HTMLElement>(`[data-step-idx="${index}"]`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [index]);

  const setValue = (name: string, v: string) => setValues((s) => ({ ...s, [name]: v }));

  const missingRequired = useMemo(
    () => (step.fields ?? []).filter((f) => f.required && !values[f.name]?.trim()),
    [step.fields, values],
  );

  const validateStep = (): boolean => {
    if (missingRequired.length) {
      toast.error(`Complete required fields: ${missingRequired.map((m) => m.label).join(", ")}`);
      return false;
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep()) return;
    setCompleted((c) => new Set(c).add(index));
    if (!isLast) setIndex(index + 1);
  };

  const goPrev = () => index > 0 && setIndex(index - 1);

  const submit = () => {
    if (!validateStep()) return;
    const title = flow.titleFrom?.(values) ?? (values.patient || values.name || flow.completionLabel || flow.title);
    const subtitle = flow.subtitleFrom?.(values) ?? [values.facility, values.procedure, values.ward].filter(Boolean).join(" · ");
    const fields: Record<string, string | number> = { Kind: flow.completionKind };
    for (const s of flow.steps) for (const f of s.fields ?? []) if (values[f.name]) fields[f.label] = f.type === "number" ? Number(values[f.name]) : values[f.name];
    const rec = create(flow.moduleKey, { title, subtitle, status: flow.completionStatus, fields });
    toast.success(`${flow.completionLabel ?? flow.title} completed`, { description: rec.id });
    setValues({});
    setCompleted(new Set());
    setIndex(0);
  };

  const progress = useMemo(() => Math.round((completed.size / total) * 100), [completed, total]);

  // Group fields by `group` (fallback single group)
  const grouped = useMemo(() => {
    const groups = new Map<string, StepField[]>();
    for (const f of step.fields ?? []) {
      const key = f.group ?? "";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(f);
    }
    return Array.from(groups.entries());
  }, [step.fields]);

  const openPatientPicker = () => {
    // simple prompt-free: pick first patient if none selected; otherwise clear then user chooses via topbar chip
    if (!currentPatientId && availablePatients[0]) {
      setPatient(availablePatients[0].id);
      toast.success("Patient loaded", { description: availablePatients[0].name });
    } else {
      toast.info("Use the patient chip in the top bar to switch patient.");
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      {flow.patientRequired && <PatientBanner values={values} onSelectPatient={openPatientPicker} />}

      {/* Workflow summary row */}
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px]">
        <span className="font-display text-sm font-semibold text-foreground">{flow.title}</span>
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          Draft
        </span>
        <span className="text-muted-foreground">·</span>
        <span className="font-medium text-foreground">Step {index + 1} of {total}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">{progress}% complete</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden h-1.5 w-40 overflow-hidden rounded-full bg-muted sm:block" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
            <div className="h-full bg-gradient-primary transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Single-row scrollable stepper */}
      <div className="mb-5 overflow-hidden rounded-xl border border-border bg-card/40 backdrop-blur-sm">
        <ol
          ref={stepperRef}
          className="scrollbar-hidden flex snap-x snap-mandatory items-center gap-1 overflow-x-auto px-2 py-2"
          role="group"
          aria-label="Workflow steps"
        >
          {flow.steps.map((s, i) => {
            const done = completed.has(i);
            const active = i === index;
            const canJump = done || i <= Math.max(...Array.from(completed).concat([-1])) + 1;
            return (
              <li key={s.key} data-step-idx={i} className="flex shrink-0 snap-start items-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => canJump && setIndex(i)}
                      disabled={!canJump}
                      aria-current={active ? "step" : undefined}
                      aria-label={`Step ${i + 1}: ${s.title}${done ? " (completed)" : active ? " (current)" : ""}`}
                      className={
                        "inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none " +
                        (active
                          ? "border-primary/60 bg-primary/10 text-foreground shadow-soft"
                          : done
                          ? "border-emerald-500/30 bg-emerald-500/5 text-foreground hover:border-emerald-500/50"
                          : "border-transparent bg-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground")
                      }
                    >
                      <span
                        aria-hidden
                        className={
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold " +
                          (done
                            ? "bg-emerald-500 text-white"
                            : active
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground")
                        }
                      >
                        {done ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
                      </span>
                      <span className="max-w-[140px] truncate font-medium">{s.title}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <div className="text-xs font-medium">{s.title}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{s.description}</div>
                  </TooltipContent>
                </Tooltip>
                {i < flow.steps.length - 1 && (
                  <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/60" aria-hidden />
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Content grid: form + optional side panel */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="p-5 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-3 border-b border-border pb-3">
            <div className="min-w-0">
              <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-primary">
                Step {String(index + 1).padStart(2, "0")} · {flow.title}
              </div>
              <h3 className="mt-1 font-display text-xl font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-1 text-[13px] leading-snug text-muted-foreground">{step.description}</p>
            </div>
          </div>

          {grouped.length > 0 && (
            <div className="space-y-5">
              {grouped.map(([groupLabel, fields], gi) => (
                <div key={groupLabel || `g-${gi}`}>
                  {groupLabel && (
                    <div className="mb-2 flex items-center gap-2">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/80">
                        {groupLabel}
                      </div>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                  )}
                  <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
                    {fields.map((f) => (
                      <div key={f.name} className={"grid gap-1 " + (f.type === "textarea" ? "sm:col-span-2" : "")}>
                        <Label htmlFor={f.name} className="text-[12px] font-medium">
                          {f.label}
                          {f.required && <span className="text-destructive"> *</span>}
                        </Label>
                        {f.type === "textarea" ? (
                          <Textarea id={f.name} value={values[f.name] ?? ""} rows={3} placeholder={f.placeholder}
                            onChange={(e) => setValue(f.name, e.target.value)} />
                        ) : f.type === "select" ? (
                          <select id={f.name} value={values[f.name] ?? ""}
                            onChange={(e) => setValue(f.name, e.target.value)}
                            className="h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                            <option value="">Select…</option>
                            {(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <Input id={f.name} type={f.type === "number" ? "number" : "text"} value={values[f.name] ?? ""}
                            placeholder={f.placeholder} className="h-10"
                            onChange={(e) => setValue(f.name, e.target.value)} />
                        )}
                        {f.hint && <p className="text-[11px] text-muted-foreground">{f.hint}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {step.checklist && step.checklist.length > 0 && (
            <div className="mt-5 rounded-xl border border-border bg-muted/30 p-3.5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Verify before continuing
              </div>
              <ul className="mt-2 space-y-1">
                {step.checklist.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-[13px]">
                    <ClipboardCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {step.events && step.events.length > 0 && (
            <div className="mt-4 rounded-xl border border-sky-500/20 bg-sky-500/5 p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                <Radio className="h-3 w-3" /> Events on complete
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {step.events.map((e) => (
                  <span key={e} className="rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[11px] font-mono text-sky-700 dark:text-sky-300">
                    {e}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Contextual side panel */}
        <aside className="hidden lg:block">
          <Card className="sticky top-20 p-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Workflow status
            </div>
            <div className="mt-2 space-y-2 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Signed steps</span>
                <span className="font-medium">{completed.size} / {total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Required</span>
                <span className={"font-medium " + (missingRequired.length ? "text-destructive" : "text-emerald-600")}>
                  {missingRequired.length ? `${missingRequired.length} missing` : "All complete"}
                </span>
              </div>
            </div>
            {step.rules && step.rules.length > 0 && (
              <>
                <div className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Rules
                </div>
                <ul className="mt-1.5 space-y-1">
                  {step.rules.map((r) => (
                    <li key={r} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-primary/60" />
                      {r}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>
        </aside>
      </div>

      {/* Sticky action bar */}
      <div className="sticky bottom-3 z-10 mt-5">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card/95 px-4 py-2.5 shadow-elevated backdrop-blur">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goPrev} disabled={index === 0}>
              <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back
            </Button>
            <Button variant="ghost" size="sm" onClick={() => toast.success("Draft saved")} className="text-muted-foreground hover:text-foreground">
              Save draft
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-[11px] text-muted-foreground sm:inline">
              {completed.size} of {total} signed
            </span>
            {isLast ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      size="sm"
                      onClick={submit}
                      disabled={missingRequired.length > 0}
                      className="bg-gradient-primary hover:opacity-90"
                    >
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Complete flow
                    </Button>
                  </span>
                </TooltipTrigger>
                {missingRequired.length > 0 && (
                  <TooltipContent side="top">
                    Complete required fields: {missingRequired.map((m) => m.label).join(", ")}
                  </TooltipContent>
                )}
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      size="sm"
                      onClick={goNext}
                      disabled={missingRequired.length > 0}
                      className="bg-gradient-primary hover:opacity-90"
                    >
                      Next step <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </span>
                </TooltipTrigger>
                {missingRequired.length > 0 && (
                  <TooltipContent side="top">
                    Complete required fields: {missingRequired.map((m) => m.label).join(", ")}
                  </TooltipContent>
                )}
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
