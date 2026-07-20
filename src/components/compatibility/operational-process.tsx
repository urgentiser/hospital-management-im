import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  PlayCircle,
  Search,
  Send,
  ShieldCheck,
  UserRoundCheck,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/app-shell";
import { RuleResults } from "@/components/workflow/rule-results";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buildCompatibilityModule, createCompatibilityPayload } from "@/compatibility/operation-builder";
import type { CompatibilityModule, CompatibilityOperation } from "@/compatibility/types";
import { ApiProblemError } from "@/contracts/common/problem-details";
import { loadCurrentStateModule } from "@/current-state/loader";
import { useFacilityContext } from "@/lib/facility-context";
import { availablePatients, usePatientContext } from "@/lib/patient-context";
import type { RuleResult } from "@/rules/types";
import { useAuth } from "@/security/auth-provider";
import { createCorrelationId } from "@/services/correlation";
import { getModuleService } from "@/services/modules/registry";
import { validateModuleInput } from "@/validation/engine";

function normalise(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function friendlyContext(value: string | null): string {
  const context = normalise(value ?? "");
  if (!context || context === "non context specific") return "General process";
  if (context.includes("hospital unit")) return "Hospital process";
  if (context.includes("facility")) return "Facility process";
  if (context.includes("country")) return "Country process";
  if (context.includes("patient")) return "Patient process";
  if (context.includes("application")) return "Application process";
  return value?.replace(/([a-z0-9])([A-Z])/g, "$1 $2") ?? "Application process";
}

function patientContextRequired(moduleKey: string): boolean {
  return new Set([
    "member-validation", "patient-maintenance", "triage", "clinical-assessment", "preadmission", "admissions",
    "authorisations", "medical-events", "pharmacy", "theatre-management", "ward-management", "case-management",
    "clinical-coding", "billing", "accounting", "reimbursements", "coid", "documents-and-printing",
  ]).has(moduleKey);
}

export function OperationalProcessConsole({
  moduleKey,
  embedded = false,
}: {
  moduleKey: string;
  embedded?: boolean;
}) {
  const [module, setModule] = useState<CompatibilityModule | null>(null);
  const [selected, setSelected] = useState<CompatibilityOperation | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    void loadCurrentStateModule(moduleKey)
      .then((specification) => {
        if (!alive) return;
        setModule(specification ? buildCompatibilityModule(specification) : null);
      })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [moduleKey]);

  const filtered = useMemo(() => {
    if (!module) return [];
    const needle = normalise(query);
    if (!needle) return module.operations;
    return module.operations.filter((operation) => normalise([
      operation.action,
      operation.privilege ?? "",
      operation.contextType ?? "",
      operation.steps.join(" "),
    ].join(" ")).includes(needle));
  }, [module, query]);

  if (loading) {
    return <div className="flex min-h-56 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading operational processes…</div>;
  }

  if (!module) {
    return <Card className="p-8 text-center text-sm text-muted-foreground">No operational process is available for this module.</Card>;
  }

  return (
    <>
      <div className={embedded ? "space-y-4" : "space-y-5"}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Processes" value={module.operations.length} icon={Workflow} />
          <Metric label="Workflow steps" value={module.operations.reduce((sum, item) => sum + item.steps.length, 0)} icon={CheckCircle2} />
          <Metric label="Form validations" value={module.operations.reduce((sum, item) => sum + item.frontendValidationRules.length, 0)} icon={ClipboardCheck} />
          <Metric label="Business rules" value={module.specification.counts.rules} icon={ShieldCheck} />
        </div>

        <Card className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-primary">Operational processes</div>
              <h2 className="mt-1 font-display text-xl tracking-tight">{module.specification.name}</h2>
              <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
                Uses the standard Impilo actions, access controls, context and process sequence so existing users can continue working in a familiar way.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2 sm:w-80">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a process…" className="h-7 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0" />
            </div>
          </div>
        </Card>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((operation) => (
            <button
              key={operation.id}
              type="button"
              onClick={() => setSelected(operation)}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card/60 bg-gradient-surface p-4 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:hover:translate-y-0"
            >
              <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-br from-primary/20 via-accent/10 to-transparent blur-2xl" />
              <div className="relative grid h-10 w-10 place-items-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
                <PlayCircle className="h-5 w-5" />
              </div>
              <div className="relative mt-3">
                <div className="font-medium leading-tight">{operation.action}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {operation.steps.length} steps · {friendlyContext(operation.contextType)}
                </div>
                <div className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                  {operation.steps.join(" → ")}
                </div>
              </div>
              <div className="relative mt-4 flex items-center justify-between border-t border-border pt-3 text-[11px]">
                <span className="truncate text-muted-foreground">Available according to your assigned role</span>
                <span className="inline-flex items-center gap-1 font-medium text-primary">Open <ArrowRight className="h-3.5 w-3.5" /></span>
              </div>
            </button>
          ))}
        </div>

        {filtered.length === 0 && <Card className="p-10 text-center text-sm text-muted-foreground">No process matches the current search.</Card>}
      </div>

      <OperationalProcessDialog operation={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>
        <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div><div className="font-display text-2xl font-semibold">{value.toLocaleString()}</div></div>
      </div>
    </Card>
  );
}

function OperationalProcessDialog({
  operation,
  onOpenChange,
}: {
  operation: CompatibilityOperation | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { principal } = useAuth();
  const facility = useFacilityContext((state) => state.facility);
  const patientId = usePatientContext((state) => state.currentPatientId);
  const patient = availablePatients.find((candidate) => candidate.id === patientId) ?? null;
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [validationResults, setValidationResults] = useState<RuleResult[]>([]);

  useEffect(() => {
    if (!operation) return;
    const next: Record<string, string | boolean> = {};
    for (const field of operation.fields) {
      const key = field.path.toLowerCase();
      if (key.includes("facility") || key.includes("hospitalunit")) next[field.name] = facility;
      else if (patient && (key.includes("patient") || key.includes("person"))) {
        if (key.endsWith("id") || key.includes("patientid") || key.includes("entityid")) next[field.name] = patient.id;
        else if (key.includes("mrn") || key.includes("lifenumber")) next[field.name] = patient.mrn;
        else if (key.includes("name")) next[field.name] = patient.name;
      }
    }
    setValues(next);
    setStepIndex(0);
    setCompleted(new Set());
    setFieldErrors({});
    setValidationResults([]);
  }, [operation, facility, patient]);

  if (!operation) return null;
  const activeOperation = operation;

  // Consolidate single-field steps into combined groups so the wizard doesn't
  // waste a stepper page on selections with only one dropdown or note field.
  const groups = useMemo(() => {
    const stepFieldMap = activeOperation.steps.map((_, index) =>
      activeOperation.fields.filter((field) => field.stepIndex === index),
    );
    type Group = { title: string; stepIndices: number[]; fields: typeof activeOperation.fields };
    const result: Group[] = [];
    let bucket: Group | null = null;
    activeOperation.steps.forEach((title, index) => {
      const fields = stepFieldMap[index];
      const light = fields.length <= 1;
      if (light) {
        if (!bucket) bucket = { title: "", stepIndices: [], fields: [] };
        bucket.stepIndices.push(index);
        bucket.fields.push(...fields);
      } else {
        if (bucket) { result.push(bucket); bucket = null; }
        result.push({ title, stepIndices: [index], fields });
      }
    });
    if (bucket) result.push(bucket);
    return result.map((group) => ({
      ...group,
      title: group.stepIndices.length === 1
        ? activeOperation.steps[group.stepIndices[0]]
        : group.stepIndices.length <= 3
          ? group.stepIndices.map((i) => activeOperation.steps[i]).join(" · ")
          : `Context & selections (${group.stepIndices.length} items)`,
    }));
  }, [activeOperation]);

  const group = groups[stepIndex] ?? groups[0];
  const isLast = stepIndex === groups.length - 1;
  const stepFields = group?.fields ?? [];
  const freeNavigation = (activeOperation.navigationType ?? "").toLowerCase().includes("free");
  const payload = createCompatibilityPayload(activeOperation, values);
  const contextValues = {
    ...values,
    facility,
    patientId: patientId ?? "",
    patient: patient?.name ?? "",
    mrn: patient?.mrn ?? "",
  };
  const quickMissing = stepFields.filter((field) => field.required && (values[field.name] === undefined || values[field.name] === "" || values[field.name] === false));


  function setValue(name: string, value: string | boolean): void {
    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  async function validate(targetStep?: number) {
    const reasonField = activeOperation.fields.find((field) => /reason|note|comment/i.test(`${field.name} ${field.label}`));
    const summary = await validateModuleInput({
      moduleKey: activeOperation.moduleKey,
      action: activeOperation.action,
      fields: activeOperation.fields.map((field) => ({
        name: field.name,
        label: field.label,
        type: field.inputType,
        required: field.required,
        stepIndex: field.stepIndex,
      })),
      values: contextValues,
      user: principal,
      facility,
      patientId,
      permission: activeOperation.privilege && !/^(inherited|none|not required)$/i.test(activeOperation.privilege)
        ? activeOperation.privilege
        : undefined,
      reason: reasonField ? String(values[reasonField.name] ?? "") : undefined,
      patientRequired: patientContextRequired(activeOperation.moduleKey),
      completedSteps: [...completed].flatMap((groupIndex) => (groups[groupIndex]?.stepIndices ?? []).map((i) => activeOperation.steps[i])).filter(Boolean),
      mandatorySteps: activeOperation.steps,
      stepIndex: targetStep,
    });
    const results = summary.results.filter((candidate) => !candidate.allowed);
    setValidationResults(results);
    setFieldErrors(summary.fieldErrors);
    return summary;
  }

  function moveTo(index: number): void {
    if (freeNavigation || index <= stepIndex || completed.has(index - 1)) setStepIndex(index);
  }

  async function next(): Promise<void> {
    const validation = await validate(stepIndex);
    if (!validation.allowed) {
      toast.error(validation.errors[0]?.message ?? "Complete the required information before continuing.");
      return;
    }
    setCompleted((current) => new Set(current).add(stepIndex));
    setValidationResults([]);
    if (!isLast) setStepIndex((current) => current + 1);
  }

  async function submit(): Promise<void> {
    const validation = await validate();
    if (!validation.allowed) {
      const firstRule = activeOperation.frontendValidationRules.find((rule) => rule.field && validation.fieldErrors[rule.field]);
      if (firstRule?.stepIndex !== undefined) setStepIndex(firstRule.stepIndex);
      toast.error(validation.errors[0]?.message ?? "The process did not pass validation.");
      return;
    }
    if (patientContextRequired(activeOperation.moduleKey) && !patientId) {
      toast.error("Select a patient before completing this process.");
      return;
    }
    setSubmitting(true);
    const correlationId = createCorrelationId();
    try {
      const moduleService = getModuleService(activeOperation.moduleKey);
      const response = await moduleService.executeProcess(activeOperation, payload, {
        moduleKey: activeOperation.moduleKey,
        action: activeOperation.action,
        privilege: activeOperation.privilege,
        contextType: activeOperation.contextType,
        facilityId: facility,
        patientId,
        userId: principal?.subject ?? null,
        correlationId,
      });
      toast.success(`${activeOperation.action} completed`, { description: `${response.reference} · ${response.correlationId}` });
      onOpenChange(false);
    } catch (cause) {
      if (cause instanceof ApiProblemError && cause.problem.errors) {
        const next: Record<string, string> = {};
        for (const [key, messages] of Object.entries(cause.problem.errors)) {
          const field = activeOperation.fields.find((candidate) => normalise(candidate.name) === normalise(key) || normalise(candidate.path) === normalise(key));
          const messageList = Array.isArray(messages) ? messages : [String(messages)];
          if (field) next[field.name] = messageList.join(" ");
        }
        setFieldErrors(next);
      }
      toast.error(cause instanceof Error ? cause.message : "The process could not be completed.");
    } finally {
      setSubmitting(false);
    }
  }

  const blockingResults = validationResults.filter((candidate) => !candidate.allowed);

  return (
    <Dialog open={Boolean(operation)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94vh] w-[calc(100vw-1rem)] max-w-6xl overflow-hidden p-0 sm:w-full">
        <DialogHeader className="border-b border-border px-6 pb-4 pt-6">
          <DialogTitle className="font-display text-2xl">{activeOperation.action}</DialogTitle>
          <DialogDescription className="mt-1">
            Follow the familiar Impilo process using your selected patient and facility context.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(94vh-10rem)] overflow-y-auto px-6 py-4">
          <ol className="mb-5 flex gap-2 overflow-x-auto pb-2">
            {groups.map((candidate, index) => {
              const active = index === stepIndex;
              const done = completed.has(index);
              const enabled = freeNavigation || index <= stepIndex || completed.has(index - 1);
              return (
                <li key={`${candidate.title}-${index}`} className="shrink-0">
                  <button
                    type="button"
                    disabled={!enabled}
                    onClick={() => moveTo(index)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors ${active ? "border-primary/40 bg-primary/10 text-primary" : done ? "border-success/30 bg-success/10 text-success" : "border-border bg-card text-muted-foreground"} disabled:cursor-not-allowed disabled:opacity-50`}
                    title={candidate.title}
                  >
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-background/70 text-[10px] font-semibold">{done ? "✓" : index + 1}</span>
                    <span className="max-w-[220px] truncate">{candidate.title}</span>
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <Card className="p-5">
              <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-primary">Step {stepIndex + 1} of {groups.length}</div>

              <h3 className="mt-1 font-display text-xl">{group?.title ?? ""}</h3>
              <p className="mt-1 text-xs text-muted-foreground">Follow the standard Impilo operational sequence.</p>

              {blockingResults.length > 0 && <div className="mt-4"><RuleResults results={blockingResults} /></div>}

              {stepFields.length > 0 ? (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {stepFields.map((field) => (
                    <div key={field.name} className={field.inputType === "textarea" || field.inputType === "json" ? "sm:col-span-2" : ""}>
                      <Label htmlFor={`${activeOperation.id}-${field.name}`}>{field.label}{field.required && <span className="text-destructive"> *</span>}</Label>
                      {field.inputType === "textarea" || field.inputType === "json" ? (
                        <Textarea
                          id={`${activeOperation.id}-${field.name}`}
                          rows={field.inputType === "json" ? 6 : 3}
                          value={String(values[field.name] ?? "")}
                          aria-invalid={Boolean(fieldErrors[field.name])}
                          onChange={(event) => setValue(field.name, event.target.value)}
                          placeholder={field.placeholder}
                        />
                      ) : field.inputType === "checkbox" ? (
                        <label className={`mt-2 flex items-center gap-2 rounded-lg border p-3 text-sm ${fieldErrors[field.name] ? "border-destructive" : "border-border"}`}>
                          <input type="checkbox" checked={Boolean(values[field.name])} onChange={(event) => setValue(field.name, event.target.checked)} />
                          Confirm {field.label.toLowerCase()}
                        </label>
                      ) : (
                        <Input
                          id={`${activeOperation.id}-${field.name}`}
                          type={field.inputType}
                          value={String(values[field.name] ?? "")}
                          aria-invalid={Boolean(fieldErrors[field.name])}
                          onChange={(event) => setValue(field.name, event.target.value)}
                          placeholder={field.placeholder}
                        />
                      )}
                      {fieldErrors[field.name] && <p className="mt-1 text-xs text-destructive">{fieldErrors[field.name]}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
                  <UserRoundCheck className="mx-auto h-8 w-8 text-primary" />
                  <div className="mt-2 text-sm font-medium">Confirm the selected context</div>
                  <div className="mt-1 text-xs text-muted-foreground">Patient, facility and access context will be used for this step.</div>
                </div>
              )}
            </Card>

            <div className="space-y-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 text-sm font-medium"><ClipboardCheck className="h-4 w-4 text-primary" /> Validation status</div>
                <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                  {blockingResults.length ? (
                    <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> Resolve {blockingResults.length} validation {blockingResults.length === 1 ? "issue" : "issues"} before continuing.</div>
                  ) : (
                    <div className="flex items-start gap-2 rounded-lg border border-success/30 bg-success/5 p-3 text-success"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> This step is ready for validation.</div>
                  )}
                  <div>{activeOperation.frontendValidationRules.length} form and process checks are applied to this action.</div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 text-sm font-medium"><ShieldCheck className="h-4 w-4 text-primary" /> Process guidance</div>
                <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                  <li>• Facility: {facility || "Select a facility"}</li>
                  <li>• Patient: {patient?.name ?? (patientContextRequired(activeOperation.moduleKey) ? "Select a patient" : "Not required")}</li>
                  <li>• Required fields and user-entered business rules are checked before each step.</li>
                  <li>• Live availability, membership, stock and record-status checks are confirmed when you submit the process.</li>
                </ul>
              </Card>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-border px-6 py-4">
          <div className="flex w-full items-center justify-between gap-3">
            <Button variant="outline" disabled={stepIndex === 0 || submitting} onClick={() => setStepIndex((current) => Math.max(0, current - 1))}>
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
            </Button>
            <div className="text-xs text-muted-foreground">{quickMissing.length ? `${quickMissing.length} required ${quickMissing.length === 1 ? "field" : "fields"} missing` : `${completed.size} of ${groups.length} steps completed`}</div>
            {isLast ? (
              <Button disabled={submitting || quickMissing.length > 0} onClick={() => void submit()} className="bg-gradient-primary hover:opacity-90">
                {submitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />} Submit
              </Button>
            ) : (
              <Button disabled={quickMissing.length > 0} onClick={() => void next()} className="bg-gradient-primary hover:opacity-90">
                Next <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
