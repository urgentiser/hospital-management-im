import { useMemo, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  MessageSquarePlus,
  Plus,
  Search,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Card, PageHeader, StatusChip } from "@/components/app-shell";
import { RuleResults } from "@/components/workflow/rule-results";
import { CurrentStateModuleButton } from "@/components/current-state/module-specification";
import { OperationalProcessConsole } from "@/components/compatibility/operational-process";
import { getCurrentStateModuleSummary } from "@/current-state/module-manifest";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useFacilityContext } from "@/lib/facility-context";
import { useWorkflow, type ModuleKey, type WorkflowItem } from "@/lib/workflow-store";
import {
  deriveSequentialStateMachine,
  getAvailableTransitions,
  isTerminalState,
  type StateMachineDefinition,
  type StateTransition,
} from "@/rules/state-machines/types";
import type { RuleResult, RuleValues } from "@/rules/types";
import { useAuth } from "@/security/auth-provider";
import { canAccessFacility } from "@/security/facility-scope";
import { hasPermission, Permissions } from "@/security/permissions";
import { getDefaultModulePermissions } from "@/security/module-permissions";
import type { Permission } from "@/security/types";
import { getModuleService } from "@/services/modules/registry";
import { validateModuleInput } from "@/validation/engine";

export type FieldDef = {
  key: string;
  label: string;
  type?: "text" | "number" | "select" | "textarea" | "date" | "datetime-local";
  options?: string[];
  required?: boolean;
  placeholder?: string;
  permission?: Permission;
};

export type ModulePermissions = {
  view?: Permission;
  create?: Permission;
  manage?: Permission;
  export?: Permission;
  note?: Permission;
  transition?: Record<string, Permission>;
};

export type ModuleConfig = {
  moduleKey: ModuleKey;
  eyebrow: string;
  title: string;
  description: string;
  workflow: string[];
  outcomes?: string[];
  stateMachine?: StateMachineDefinition;
  permissions?: ModulePermissions;
  createRuleIds?: string[];
  transitionRuleIds?: string[];
  columns: { key: string; label: string }[];
  fields: FieldDef[];
  titleFrom?: (fields: Record<string, string | number>) => string;
  subtitleFrom?: (fields: Record<string, string | number>) => string;
  idPrefix?: string;
  kpis?: (items: WorkflowItem[]) => { label: string; value: string | number }[];
  extras?: React.ReactNode;
};

type TransitionDialogState = {
  transition: StateTransition;
  reason: string;
  results: RuleResult[];
} | null;

export function WorkflowModule({ config }: { config: ModuleConfig }) {
  const { principal } = useAuth();
  const activeFacility = useFacilityContext((state) => state.facility);
  const moduleService = getModuleService(config.moduleKey);
  const items = useWorkflow((state) => state.items[config.moduleKey]);
  const search = useSearch({ strict: false }) as { new?: string };
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(search?.new === "1");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const defaultPermissions = getDefaultModulePermissions(config.moduleKey);
  const permissions = useMemo(
    () => ({ ...defaultPermissions, ...config.permissions, transition: { ...(config.permissions?.transition ?? {}) } }),
    [config.permissions, defaultPermissions],
  );
  const effectiveConfig = useMemo(() => ({ ...config, permissions }), [config, permissions]);

  const machine = useMemo(
    () =>
      config.stateMachine ??
      deriveSequentialStateMachine(config.workflow, config.outcomes, (target) => permissions.transition?.[target]),
    [config, permissions],
  );
  const selected = items.find((item) => item.id === detailId) ?? null;
  const statuses = [...new Set([...config.workflow, ...(config.outcomes ?? [])])];
  const filtered = useMemo(
    () =>
      items.filter((item) => {
        if (filter !== "all" && item.status !== filter) return false;
        if (!query.trim()) return true;
        const searchable = [
          item.id,
          item.title,
          item.subtitle ?? "",
          ...Object.values(item.fields).map(String),
        ]
          .join(" ")
          .toLowerCase();
        return searchable.includes(query.trim().toLowerCase());
      }),
    [filter, items, query],
  );

  const canCreate = hasPermission(principal, permissions.create);
  const canExport = hasPermission(principal, permissions.export ?? Permissions.ExportData);

  async function createRecord(input: Omit<WorkflowItem, "id" | "history" | "createdAt" | "updatedAt">) {
    setBusy(true);
    try {
      const result = await moduleService.createRecord(input);
      toast.success(`${config.title.replace(/s$/, "")} created`, {
        description: `${result.data.id} · ${result.correlationId}`,
      });
      setCreateOpen(false);
      setDetailId(result.data.id);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "The record could not be created.");
    } finally {
      setBusy(false);
    }
  }

  async function addNote(item: WorkflowItem, note: string) {
    if (!hasPermission(principal, permissions.note ?? permissions.manage)) {
      toast.error("You do not have permission to add a note.");
      return;
    }
    try {
      await moduleService.addNote(item.id, note);
      toast.success("Note added");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "The note could not be saved.");
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={config.eyebrow}
        title={config.title}
        description={config.description}
        actions={
          <>
            {null}

            <CurrentStateModuleButton moduleKey={config.moduleKey} compact />
            <Button variant="outline" size="sm" onClick={() => toast.info("Saved filter presets are prepared for the API worklist.")}>
              <Filter className="mr-1.5 h-3.5 w-3.5" /> Filters
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!canExport}
              title={!canExport ? "Data.Export permission is required" : undefined}
              onClick={() => {
                const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const anchor = document.createElement("a");
                anchor.href = url;
                anchor.download = `${config.moduleKey}-export.json`;
                anchor.click();
                URL.revokeObjectURL(url);
                toast.success("Export downloaded. The activity will be recorded when connected to the live service.");
              }}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" /> Export
            </Button>
            <Button
              size="sm"
              disabled={!canCreate}
              title={!canCreate ? `Permission ${permissions.create ?? "Create"} is required` : undefined}
              onClick={() => setCreateOpen(true)}
              className="bg-gradient-primary shadow-glow hover:opacity-90"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> New
            </Button>
          </>
        }
      />

      <>

      {config.kpis && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {config.kpis(items).map((kpi) => (
            <Card key={kpi.label} className="p-4">
              <div className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">{kpi.label}</div>
              <div className="mt-1 font-display text-2xl font-semibold">{kpi.value}</div>
            </Card>
          ))}
        </div>
      )}

      {config.extras && <div className="mb-4">{config.extras}</div>}

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-3">
          <div className="flex min-w-[260px] flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search records…"
              className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[190px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/40 text-left text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Reference</th>
                {config.columns.map((column) => <th key={column.key} className="px-4 py-3">{column.label}</th>)}
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  tabIndex={0}
                  className="cursor-pointer hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30"
                  onClick={() => setDetailId(item.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setDetailId(item.id);
                    }
                  }}
                >
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{item.id}</td>
                  {config.columns.map((column) => {
                    let value: string | number | undefined;
                    if (column.key === "title") value = item.title;
                    else if (column.key === "subtitle") value = item.subtitle;
                    else if (column.key === "updatedAt") value = new Date(item.updatedAt).toLocaleString("en-ZA");
                    else value = item.fields[column.key];
                    return <td key={column.key} className="max-w-[260px] truncate px-4 py-3">{value ?? "—"}</td>;
                  })}
                  <td className="px-4 py-3"><StatusChip status={item.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-10 text-center">
              <div className="font-medium">No records match your filters</div>
              <p className="mt-1 text-sm text-muted-foreground">Clear the search or create a permitted record.</p>
            </div>
          )}
        </div>
      </Card>

      <CreateDialog
        open={createOpen}
        busy={busy}
        config={effectiveConfig}
        principalCanCreate={canCreate}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open && search?.new) void navigate({ to: ".", search: {} });
        }}
        onCreate={createRecord}
      />

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setDetailId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {selected && (
            <DetailPanel
              item={selected}
              config={effectiveConfig}
              machine={machine}
              activeFacility={activeFacility}
              onTransitioned={() => undefined}
              onNote={(note) => void addNote(selected, note)}
            />
          )}
        </SheetContent>
      </Sheet>
      </>
    </>
  );
}

function CreateDialog({
  open,
  busy,
  config,
  principalCanCreate,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  busy: boolean;
  config: ModuleConfig;
  principalCanCreate: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (item: Omit<WorkflowItem, "id" | "history" | "createdAt" | "updatedAt">) => Promise<void>;
}) {
  const { principal } = useAuth();
  const activeFacility = useFacilityContext((state) => state.facility);
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [results, setResults] = useState<RuleResult[]>([]);

  async function submit() {
    const permission = config.permissions?.create;
    const facility = values.facility || values.Facility || activeFacility;
    const validation = await validateModuleInput({
      moduleKey: config.moduleKey,
      action: "create",
      fields: config.fields.map((field) => ({ name: field.key, label: field.label, type: field.type, required: field.required })),
      values,
      user: principal,
      facility,
      permission,
      additionalRuleIds: config.createRuleIds,
    });
    setErrors(validation.fieldErrors);
    setResults(validation.results);
    if (!validation.allowed) {
      toast.error(validation.errors[0]?.message ?? "The record did not pass validation.");
      return;
    }

    const fields: Record<string, string | number> = {};
    for (const field of config.fields) {
      const value = values[field.key] ?? "";
      fields[field.label] = field.type === "number" ? Number(value || 0) : value;
    }
    const title = config.titleFrom ? config.titleFrom(fields) : values[config.fields[0]?.key] || "New record";
    const subtitle = config.subtitleFrom?.(fields);
    await onCreate({ title, subtitle, status: config.stateMachine?.initialState ?? config.workflow[0], fields });
    setValues({});
    setErrors({});
    setResults([]);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New {config.title.toLowerCase().replace(/s$/, "")}</DialogTitle>
          <DialogDescription>Complete the required information to start a controlled workflow.</DialogDescription>
        </DialogHeader>
        {results.length > 0 && <RuleResults results={results} />}
        <div className="grid max-h-[60vh] gap-4 overflow-y-auto pr-1 md:grid-cols-2">
          {config.fields.map((field) => {
            const allowed = hasPermission(principal, field.permission);
            return (
              <div key={field.key} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                <Label htmlFor={`create-${field.key}`}>{field.label}{field.required && <span className="text-destructive"> *</span>}</Label>
                {field.type === "select" ? (
                  <Select value={values[field.key] ?? ""} disabled={!allowed} onValueChange={(value) => setValues((current) => ({ ...current, [field.key]: value }))}>
                    <SelectTrigger id={`create-${field.key}`} aria-invalid={Boolean(errors[field.key])}><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>{field.options?.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
                  </Select>
                ) : field.type === "textarea" ? (
                  <Textarea id={`create-${field.key}`} rows={4} disabled={!allowed} value={values[field.key] ?? ""} placeholder={field.placeholder} aria-invalid={Boolean(errors[field.key])} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))} />
                ) : (
                  <Input id={`create-${field.key}`} type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "datetime-local" ? "datetime-local" : "text"} disabled={!allowed} value={values[field.key] ?? ""} placeholder={field.placeholder} aria-invalid={Boolean(errors[field.key])} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))} />
                )}
                {errors[field.key] && <p className="mt-1 text-xs text-destructive">{errors[field.key]}</p>}
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={busy || !principalCanCreate} onClick={() => void submit()} className="bg-gradient-primary hover:opacity-90">
            {busy ? "Creating…" : "Create & start workflow"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailPanel({
  item,
  config,
  machine,
  activeFacility,
  onTransitioned,
  onNote,
}: {
  item: WorkflowItem;
  config: ModuleConfig;
  machine: StateMachineDefinition;
  activeFacility: string;
  onTransitioned: () => void;
  onNote: (note: string) => void;
}) {
  const { principal } = useAuth();
  const [note, setNote] = useState("");
  const [transitionDialog, setTransitionDialog] = useState<TransitionDialogState>(null);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<RuleResult[]>([]);
  const transitions = getAvailableTransitions(machine, item.status);
  const terminal = isTerminalState(machine, item.status);
  const facility = String(item.fields.Facility ?? item.fields.facility ?? activeFacility);
  const stageIndex = config.workflow.indexOf(item.status);

  async function validateTransition(transition: StateTransition, reason?: string) {
    const permission = transition.permission ?? config.permissions?.transition?.[transition.to] ?? config.permissions?.manage;
    const values = item.fields as RuleValues;
    return validateModuleInput({
      moduleKey: config.moduleKey,
      action: `transition:${transition.to}`,
      fields: Object.keys(item.fields).map((key) => ({ name: key, label: key })),
      values,
      user: principal,
      facility,
      permission,
      reason,
      currentState: item.status,
      targetState: transition.to,
      additionalRuleIds: [
        ...(transition.requiresReason ? ["common.reason-required"] : []),
        ...(config.transitionRuleIds ?? []),
        ...(transition.ruleIds ?? []),
      ],
    });
  }

  async function requestTransition(transition: StateTransition) {
    const permission = transition.permission ?? config.permissions?.transition?.[transition.to] ?? config.permissions?.manage;
    if (!hasPermission(principal, permission)) {
      toast.error(`Permission ${permission} is required.`);
      return;
    }
    if (!canAccessFacility(principal, facility)) {
      toast.error(`You are not authorised to work in ${facility}.`);
      return;
    }
    if (transition.requiresReason || transition.confirmation) {
      setTransitionDialog({ transition, reason: "", results: [] });
      return;
    }
    await executeTransition(transition);
  }

  async function executeTransition(transition: StateTransition, reason?: string) {
    setBusy(true);
    try {
      const validation = await validateTransition(transition, reason);
      setResults(validation.results);
      if (!validation.allowed) {
        setTransitionDialog((current) => current ? { ...current, results: validation.results } : current);
        toast.error(validation.errors[0]?.message ?? "The transition is not allowed.");
        return;
      }
      const result = await getModuleService(config.moduleKey).transitionRecord(item.id, transition.to, reason);
      toast.success(`Moved to ${transition.to}`, { description: result.correlationId });
      setTransitionDialog(null);
      onTransitioned();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "The transition could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <SheetHeader className="text-left">
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-primary">{config.eyebrow}</div>
        <SheetTitle className="font-display text-2xl">{item.title}</SheetTitle>
        <SheetDescription>{item.subtitle}</SheetDescription>
        <div className="mt-2 flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">{item.id}</span>
          <StatusChip status={item.status} />
        </div>
      </SheetHeader>

      {results.length > 0 && <div className="mt-4"><RuleResults results={results} /></div>}

      <div className="mt-6 rounded-xl border border-border bg-muted/20 p-4">
        <div className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Controlled workflow</div>
        <ol className="space-y-2">
          {config.workflow.map((stage, index) => {
            const completed = stageIndex >= index && !terminal;
            const current = stage === item.status;
            return (
              <li key={stage} className="flex items-center gap-3">
                <div className={"flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-semibold " + (current ? "border-primary bg-primary text-primary-foreground" : completed ? "border-success/60 bg-success/20 text-success" : "border-border text-muted-foreground")}>
                  {completed && !current ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
                </div>
                <span className={current ? "text-sm font-medium capitalize" : "text-sm capitalize text-muted-foreground"}>{stage}</span>
              </li>
            );
          })}
        </ol>
        {terminal && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-muted p-2 text-xs text-muted-foreground">
            <XCircle className="h-4 w-4" /> Terminal state: <span className="font-medium capitalize">{item.status}</span>
          </div>
        )}
      </div>

      <div className="mt-6">
        <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Details</div>
        <dl className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-card/40 p-4 text-sm">
          {Object.entries(item.fields).map(([key, value]) => (
            <div key={key} className={key.toLowerCase().includes("message") || key.toLowerCase().includes("timeline") ? "col-span-2" : ""}>
              <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{key}</dt>
              <dd className="mt-0.5 break-words font-medium">{String(value)}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-6 space-y-2">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Available actions</div>
        {terminal ? (
          <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
            <ShieldAlert className="mt-0.5 h-4 w-4" /> This record is closed. Corrections require a configured reversal or reopening workflow.
          </div>
        ) : transitions.length ? (
          <div className="grid gap-2">
            {transitions.map((transition, index) => {
              const permission = transition.permission ?? config.permissions?.transition?.[transition.to] ?? config.permissions?.manage;
              const allowed = hasPermission(principal, permission) && canAccessFacility(principal, facility);
              return (
                <Button
                  key={`${transition.from}-${transition.to}`}
                  variant={index === 0 ? "default" : "outline"}
                  className={index === 0 ? "justify-between bg-gradient-primary hover:opacity-90" : "justify-between"}
                  disabled={busy || !allowed}
                  title={!allowed ? "Your permission or facility scope does not allow this transition." : undefined}
                  onClick={() => void requestTransition(transition)}
                >
                  <span className="capitalize">{transition.to}</span><ArrowRight className="h-4 w-4" />
                </Button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-warning/30 bg-warning/5 p-3 text-sm text-warning">No valid transition is configured from {item.status}.</div>
        )}
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <MessageSquarePlus className="h-3.5 w-3.5" /> Add note
        </div>
        <Textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Clinical note, escalation reason, or comment…" />
        <div className="mt-2 flex justify-end">
          <Button size="sm" disabled={!note.trim()} onClick={() => { onNote(note.trim()); setNote(""); }}>Save note</Button>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <Clock className="h-3.5 w-3.5" /> Activity
        </div>
        <ol className="relative space-y-3 border-l border-border pl-4">
          {item.history.map((history, index) => (
            <li key={`${history.at}-${index}`} className="relative">
              <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
              <div className="text-sm font-medium">{history.action}</div>
              <div className="text-[11px] text-muted-foreground">{history.at} · {history.by}</div>
              {history.note && <div className="mt-1 rounded-md border border-border bg-muted/30 p-2 text-xs">{history.note}</div>}
            </li>
          ))}
        </ol>
      </div>

      <Dialog open={Boolean(transitionDialog)} onOpenChange={(open) => !open && setTransitionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">Move to {transitionDialog?.transition.to}</DialogTitle>
            <DialogDescription>
              {transitionDialog?.transition.confirmation ?? "Confirm this controlled workflow transition."}
            </DialogDescription>
          </DialogHeader>
          {transitionDialog?.results.length ? <RuleResults results={transitionDialog.results} /> : null}
          {transitionDialog?.transition.requiresReason && (
            <div>
              <Label htmlFor="transition-reason">Reason <span className="text-destructive">*</span></Label>
              <Textarea id="transition-reason" rows={4} value={transitionDialog.reason} onChange={(event) => setTransitionDialog((current) => current ? { ...current, reason: event.target.value } : current)} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransitionDialog(null)}>Cancel</Button>
            <Button disabled={busy || Boolean(transitionDialog?.transition.requiresReason && !transitionDialog.reason.trim())} onClick={() => transitionDialog && void executeTransition(transitionDialog.transition, transitionDialog.reason)} className="bg-gradient-primary hover:opacity-90">
              {busy ? "Processing…" : "Confirm transition"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
