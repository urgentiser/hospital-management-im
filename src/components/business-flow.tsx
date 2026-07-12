import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Radio,
  ClipboardCheck, User, HeartPulse, Building2, Wallet, AlertTriangle,
} from "lucide-react";
import { Card, StatusChip } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useWorkflow, type ModuleKey } from "@/lib/workflow-store";

// ---------- Types ----------

export type StepField = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "select";
  options?: string[];
  required?: boolean;
  placeholder?: string;
  hint?: string;
};

export type FlowStep = {
  key: string;
  title: string;
  description: string;
  fields?: StepField[];
  checklist?: string[];
  events?: string[]; // events that fire on completing this step
  rules?: string[];  // step-specific rules
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

export function PatientBanner({ values }: { values: Record<string, string> }) {
  const name = values.patient || values.name || "No patient selected";
  const mrn = values.mrn || values.idNumber || "—";
  const dob = values.dob || "—";
  const gender = values.gender || "—";
  const facility = values.facility || "—";
  const allergies = values.allergies?.trim();
  const scheme = values.scheme || values.funder || "—";
  const hasPatient = !!(values.patient || values.name);

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 via-accent/5 to-transparent p-4 shadow-soft">
      <div className="flex flex-wrap items-center gap-3 sm:gap-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
            <User className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Patient banner
            </div>
            <div className={"font-display text-lg tracking-tight " + (hasPatient ? "text-foreground" : "text-muted-foreground")}>
              {name}
            </div>
          </div>
        </div>
        <div className="hidden h-8 w-px bg-border sm:block" />
        <BannerCell icon={ClipboardCheck} label="MRN / ID" value={mrn} />
        <BannerCell icon={HeartPulse} label="DOB · Sex" value={`${dob} · ${gender}`} />
        <BannerCell icon={Building2} label="Facility" value={facility} />
        <BannerCell icon={Wallet} label="Scheme" value={scheme} />
        {allergies && (
          <div className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-[11px] font-medium text-destructive">
            <AlertTriangle className="h-3.5 w-3.5" /> Allergies: {allergies}
          </div>
        )}
      </div>
    </div>
  );
}

function BannerCell({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <div className="leading-tight">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-xs font-medium text-foreground">{value}</div>
      </div>
    </div>
  );
}

// ---------- Wizard ----------

export function BusinessFlowWizard({ flow }: { flow: BusinessFlow }) {
  const create = useWorkflow((s) => s.create);
  const [index, setIndex] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  const total = flow.steps.length;
  const step = flow.steps[index];
  const isLast = index === total - 1;

  const setValue = (name: string, v: string) => setValues((s) => ({ ...s, [name]: v }));

  const validateStep = (): boolean => {
    const missing = (step.fields ?? []).filter((f) => f.required && !values[f.name]?.trim());
    if (missing.length) {
      toast.error(`Complete required fields: ${missing.map((m) => m.label).join(", ")}`);
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

  const progress = useMemo(() => Math.round(((completed.size) / total) * 100), [completed, total]);

  return (
    <>
      {flow.patientRequired && <PatientBanner values={values} />}

      {/* Progress strip */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 font-medium text-primary">
          {flow.title}
        </span>
        <span className="ml-auto rounded-full border border-border bg-background/60 px-2.5 py-1 font-medium text-muted-foreground">
          Step {index + 1} of {total} · {progress}%
        </span>
      </div>

      {/* Stepper — wraps, never cuts off */}
      <div className="mb-6">
        <ol className="flex flex-wrap gap-1.5">
          {flow.steps.map((s, i) => {
            const done = completed.has(i);
            const active = i === index;
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  title={s.title}
                  className={
                    "group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors " +
                    (active
                      ? "border-primary/50 bg-primary/10 text-foreground shadow-soft"
                      : done
                      ? "border-emerald-500/30 bg-emerald-500/5 text-foreground hover:border-emerald-500/50"
                      : "border-border bg-card/60 text-muted-foreground hover:border-primary/30 hover:text-foreground")
                  }
                >
                  <span
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
                  <span className="max-w-[160px] truncate font-medium">{s.title}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div>
        {/* Step body */}
        <Card className="p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-primary">
                Step {String(index + 1).padStart(2, "0")}
              </div>
              <h3 className="mt-1 font-display text-2xl tracking-tight">{step.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
            </div>
          </div>

          {step.fields && step.fields.length > 0 && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {step.fields.map((f) => (
                <div key={f.name} className={"grid gap-1.5 " + (f.type === "textarea" ? "sm:col-span-2" : "")}>
                  <Label htmlFor={f.name}>
                    {f.label}{f.required && <span className="text-destructive"> *</span>}
                  </Label>
                  {f.type === "textarea" ? (
                    <Textarea id={f.name} value={values[f.name] ?? ""} rows={3} placeholder={f.placeholder}
                      onChange={(e) => setValue(f.name, e.target.value)} />
                  ) : f.type === "select" ? (
                    <select id={f.name} value={values[f.name] ?? ""}
                      onChange={(e) => setValue(f.name, e.target.value)}
                      className="h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <option value="">Select…</option>
                      {(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <Input id={f.name} type={f.type === "number" ? "number" : "text"} value={values[f.name] ?? ""}
                      placeholder={f.placeholder} onChange={(e) => setValue(f.name, e.target.value)} />
                  )}
                  {f.hint && <p className="text-[11px] text-muted-foreground">{f.hint}</p>}
                </div>
              ))}
            </div>
          )}

          {step.checklist && step.checklist.length > 0 && (
            <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Verify before continuing
              </div>
              <ul className="mt-2 space-y-1.5">
                {step.checklist.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-sm">
                    <ClipboardCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {step.events && step.events.length > 0 && (
            <div className="mt-6 rounded-xl border border-sky-500/20 bg-sky-500/5 p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-sky-600 dark:text-sky-400">
                <Radio className="h-3.5 w-3.5" /> Events on complete
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {step.events.map((e) => (
                  <span key={e} className="rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[11px] font-mono text-sky-700 dark:text-sky-300">
                    {e}
                  </span>
                ))}
              </div>
            </div>
          )}


          {/* Nav */}
          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <Button variant="outline" onClick={goPrev} disabled={index === 0}>
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">
                {completed.size} of {total} steps signed
              </span>
              {isLast ? (
                <Button onClick={submit} className="bg-gradient-primary hover:opacity-90">
                  <CheckCircle2 className="mr-1.5 h-4 w-4" /> Complete flow
                </Button>
              ) : (
                <Button onClick={goNext} className="bg-gradient-primary hover:opacity-90">
                  Next step <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

