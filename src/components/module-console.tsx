import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, ArrowUpRight, ChevronRight, Search, Sparkles, Workflow } from "lucide-react";
import { Card, PageHeader, StatusChip } from "@/components/app-shell";
import { PatientBanner } from "@/components/patient-banner";
import { PlatformStrip } from "@/components/platform-strip";
import { AdminStrip } from "@/components/admin-strip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useWorkflow, type ModuleKey, type WorkflowItem } from "@/lib/workflow-store";
import { BusinessFlowWizard, type BusinessFlow } from "@/components/business-flow";
import { CurrentStateModuleButton } from "@/components/current-state/module-specification";
import { useFacilityContext } from "@/lib/facility-context";
import { useAuth } from "@/security/auth-provider";
import { getDefaultModulePermissions } from "@/security/module-permissions";
import { hasPermission } from "@/security/permissions";
import { getModuleService } from "@/services/modules/registry";
import { validateModuleInput } from "@/validation/engine";

// ---------------- Types ----------------

export type FieldSpec = {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea";
  required?: boolean;
  placeholder?: string;
};

export type ActionSpec = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  hint: string;
  kind: string;
  startStatus: string;
  fields: FieldSpec[];
  destructive?: boolean;
};

export type SectionSpec = {
  key: string;
  title: string;
  tagline: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string; // gradient util classes e.g. "from-primary/30 via-accent/20 to-transparent"
  ring: string;   // e.g. "ring-primary/30"
  actions: ActionSpec[];
};

export type KpiCard = {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  tone?: "primary" | "destructive" | "success" | "warning" | "muted";
  hint?: string;
};

export type ModuleConsoleConfig = {
  moduleKey: ModuleKey;
  eyebrow: string;
  title: string;
  description: string;
  heroHeadline: string;
  heroBlurb: string;
  heroBadge?: string;
  heroCtas?: { label: string; sectionKey: string; primary?: boolean }[];
  overviewKpis: (items: WorkflowItem[]) => KpiCard[];
  sectionKpis?: (section: SectionSpec, items: WorkflowItem[]) => KpiCard[];
  overviewExtras?: (items: WorkflowItem[]) => React.ReactNode;
  sections: SectionSpec[];
  businessFlow?: BusinessFlow;
  /** When true a persistent patient banner is rendered at the top of the module. */
  patientScoped?: boolean;
  /** When true a cross-module platform-operations strip is rendered at the top. */
  platformScoped?: boolean;
  /** When true an administration quick-nav strip is rendered at the top. */
  adminScoped?: boolean;
};

// ---------------- Console ----------------

export function ModuleConsole({ config }: { config: ModuleConsoleConfig }) {
  const items = useWorkflow((s) => s.items[config.moduleKey]);
  const { principal } = useAuth();
  const activeFacility = useFacilityContext((state) => state.facility);
  const permissions = getDefaultModulePermissions(config.moduleKey);
  const moduleService = getModuleService(config.moduleKey);
  const canExecuteActions = hasPermission(principal, permissions.create ?? permissions.manage);
  const hasFlow = !!config.businessFlow;
  // Worklist-first: every module opens on the Overview / worklist. The guided workflow
  // remains available as a separate tab for users who want the step-by-step path.
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [activeAction, setActiveAction] = useState<ActionSpec | null>(null);
  const [feedQuery, setFeedQuery] = useState("");
  const [busy, setBusy] = useState(false);

  const activeSection = useMemo(
    () => config.sections.find((s) => s.key === activeTab) ?? null,
    [config.sections, activeTab],
  );

  const totalActions = useMemo(
    () => config.sections.reduce((n, s) => n + s.actions.length, 0),
    [config.sections],
  );

  const overviewKpis = useMemo(() => config.overviewKpis(items), [config, items]);

  const submit = async (spec: ActionSpec, values: Record<string, string>): Promise<boolean> => {
    setBusy(true);
    try {
      const permission = permissions.create ?? permissions.manage;
      const facility = values.facility || activeFacility;
      const validation = await validateModuleInput({
        moduleKey: config.moduleKey,
        action: spec.key,
        fields: spec.fields.map((field) => ({ name: field.name, label: field.label, type: field.type, required: field.required })),
        values,
        user: principal,
        facility,
        permission,
        reason: values.reason || values.notes || values.note,
      });
      if (!validation.allowed) {
        toast.error(validation.errors[0]?.message ?? "The action did not pass business validation.");
        return false;
      }

      const fields: Record<string, string | number> = { Kind: spec.kind };
      spec.fields.forEach((field) => {
        const raw = values[field.name] ?? "";
        if (!raw) return;
        fields[field.label] = field.type === "number" ? Number(raw) : raw;
      });
      const title = String(
        values.title || values.name || values.patient || values.facility || values.scheme ||
        values.fund || values.carrier || values.reference || values.id || spec.label,
      );
      const subtitle = [values.owner, values.priority, values.ward, values.plan, values.rate, values.period, values.scope, values.employer]
        .filter(Boolean).join(" · ") || spec.kind;
      const result = await moduleService.createRecord({ title, subtitle, status: spec.startStatus, fields });
      toast.success(`${spec.label} captured`, { description: `${result.data.id} · ${result.correlationId}` });
      setActiveAction(null);
      return true;
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "The action could not be completed.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const isFlow = hasFlow && activeTab === "flow";

  return (
    <>
      <PageHeader
        eyebrow={isFlow ? `${config.eyebrow} · Guided workflow` : activeSection ? `${config.eyebrow} · ${activeSection.title}` : config.eyebrow}
        title={isFlow ? `${config.businessFlow!.title} — Guided workflow` : activeSection ? activeSection.title : config.title}
        description={isFlow ? config.description : activeSection ? activeSection.description : config.description}
        actions={<CurrentStateModuleButton moduleKey={config.moduleKey} compact />}
      />

      {config.patientScoped && <PatientBanner />}
      {config.platformScoped && <PlatformStrip activeKey={config.moduleKey} />}
      {config.adminScoped && <AdminStrip activeKey={config.moduleKey} />}

      {/* Tab bar — Worklist / Overview is the primary landing view for every module.
          Guided workflow (if defined) is offered last as an optional step-by-step path. */}
      <nav className="mb-6 -mx-1 flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hidden">
        <TabPill label="Overview" active={activeTab === "overview"} onClick={() => setActiveTab("overview")} />
        {config.sections.map((s) => (
          <TabPill key={s.key} label={s.title} active={activeTab === s.key} onClick={() => setActiveTab(s.key)} />
        ))}
        {hasFlow && (
          <TabPill
            label={
              <span className="inline-flex items-center gap-1.5">
                <Workflow className="h-3.5 w-3.5" /> Guided workflow
              </span>
            }
            active={activeTab === "flow"}
            onClick={() => setActiveTab("flow")}
          />
        )}
      </nav>

      {activeSection && (
        <div className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <button className="hover:text-foreground" onClick={() => setActiveTab("overview")}>
            {config.title}
          </button>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{activeSection.title}</span>
        </div>
      )}

      {isFlow ? (
        <BusinessFlowWizard flow={config.businessFlow!} />

      ) : !activeSection ? (
        <OverviewPane
          config={config}
          items={items}
          overviewKpis={overviewKpis}
          totalActions={totalActions}
          onOpenSection={(key) => setActiveTab(key)}
        />
      ) : (
        <SectionPane
          config={config}
          section={activeSection}
          items={items}
          feedQuery={feedQuery}
          setFeedQuery={setFeedQuery}
          onOpenAction={(a) => setActiveAction(a)}
          canExecute={canExecuteActions}
          onBack={() => setActiveTab("overview")}
        />
      )}

      <ActionDialog spec={activeAction} busy={busy} onOpenChange={(o) => !o && setActiveAction(null)} onSubmit={submit} />
    </>
  );
}

function TabPill({ label, active, onClick }: { label: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={
        "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
        (active
          ? "border-primary/40 bg-primary/10 text-primary shadow-[inset_0_-2px_0_0_theme(colors.primary.DEFAULT)/60]"
          : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground")
      }
    >
      {label}
    </button>
  );
}

// ---------------- Overview ----------------

function OverviewPane({
  config, items, overviewKpis, totalActions, onOpenSection,
}: {
  config: ModuleConsoleConfig;
  items: WorkflowItem[];
  overviewKpis: KpiCard[];
  totalActions: number;
  onOpenSection: (key: string) => void;
}) {
  const recent = items.slice(0, 6);
  return (
    <>
      <div className="mb-8 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="relative overflow-hidden p-6">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-primary/30 via-accent/20 to-transparent blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-gradient-to-tr from-accent/20 to-transparent blur-3xl" />
          <div className="relative">
            {config.heroBadge && (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-primary">
                <Sparkles className="h-3 w-3" /> {config.heroBadge}
              </div>
            )}
            <h2 className="mt-3 max-w-xl font-display text-2xl leading-tight tracking-tight sm:text-3xl">
              {config.heroHeadline}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">{config.heroBlurb}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {(config.heroCtas ?? []).map((cta) => (
                <button
                  key={cta.label}
                  onClick={() => onOpenSection(cta.sectionKey)}
                  className={
                    cta.primary
                      ? "inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
                      : "inline-flex items-center gap-2 rounded-lg border border-border bg-card/70 px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40"
                  }
                >
                  {cta.label} {cta.primary && <ArrowRight className="h-4 w-4" />}
                </button>
              ))}
            </div>
            <div className="mt-4 text-[11px] text-muted-foreground">
              {totalActions} actions across {config.sections.length} sections
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          {overviewKpis.slice(0, 4).map((k) => (
            <StatCard key={k.label} kpi={k} />
          ))}
        </div>
      </div>

      <div className="mb-3 flex items-end justify-between">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary">Sections</div>
          <h2 className="mt-1 font-display text-xl tracking-tight">{config.title} pillars</h2>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {config.sections.map((s) => {
          const Icon = s.icon;
          const previewActions = s.actions.slice(0, 4);
          return (
            <button
              key={s.key}
              onClick={() => onOpenSection(s.key)}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card/60 bg-gradient-surface p-5 text-left shadow-soft backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <div className={"pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br opacity-70 blur-2xl transition-opacity group-hover:opacity-100 " + s.accent} />
              <div className="relative flex items-start justify-between">
                <div className={"flex h-11 w-11 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary ring-1 " + s.ring}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {s.actions.length === 1 ? "1 action" : `${s.actions.length} actions`}
                </span>
              </div>
              <div className="relative mt-4">
                <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  {s.tagline}
                </div>
                <div className="mt-1 font-display text-lg tracking-tight">{s.title}</div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{s.description}</p>
              </div>
              <div className="relative mt-4 flex flex-wrap gap-1.5">
                {previewActions.map((a) => (
                  <span key={a.key} className="rounded-md border border-border bg-background/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {a.label.replace(/^(Maintain|Manage|Edit) /, "")}
                  </span>
                ))}
                {s.actions.length > previewActions.length && (
                  <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    +{s.actions.length - previewActions.length}
                  </span>
                )}
              </div>
              <div className="relative mt-5 flex items-center justify-between border-t border-border pt-3 text-xs">
                <span className="text-muted-foreground">Open section</span>
                <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-10">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Feed</div>
            <h2 className="mt-1 font-display text-xl tracking-tight">Latest activity</h2>
          </div>
        </div>
        <Card className="divide-y divide-border">
          {recent.length === 0 && (
            <div className="p-10 text-center">
              <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-muted text-muted-foreground">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="mt-3 text-sm font-medium text-foreground">No activity yet</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Trigger an action from any section to populate the feed.
              </div>
            </div>
          )}
          {recent.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{r.title}</div>
                <div className="truncate text-xs text-muted-foreground">
                  <span className="font-mono">{r.id}</span>
                  {r.subtitle ? ` · ${r.subtitle}` : ""}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="hidden rounded-md border border-border bg-background/50 px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
                  {String(r.fields["Kind"] ?? "—")}
                </span>
                <StatusChip status={r.status} />
              </div>
            </div>
          ))}
        </Card>
        {config.overviewExtras && (
          <div className="mt-6">{config.overviewExtras(items)}</div>
        )}
      </div>
    </>
  );
}

// ---------------- Section ----------------

function SectionPane({
  config, section, items, feedQuery, setFeedQuery, onOpenAction, canExecute, onBack,
}: {
  config: ModuleConsoleConfig;
  section: SectionSpec;
  items: WorkflowItem[];
  feedQuery: string;
  setFeedQuery: (v: string) => void;
  onOpenAction: (a: ActionSpec) => void;
  canExecute: boolean;
  onBack: () => void;
}) {
  const actionKinds = useMemo(
    () => new Set(section.actions.map((a) => a.kind)),
    [section.actions],
  );

  const scopedItems = useMemo(
    () => items.filter((i) => actionKinds.has(String(i.fields["Kind"] ?? ""))),
    [items, actionKinds],
  );

  const kpis = useMemo(
    () => (config.sectionKpis ? config.sectionKpis(section, items) : defaultSectionKpis(section, scopedItems)),
    [config, section, items, scopedItems],
  );

  const recent = useMemo(
    () =>
      scopedItems
        .filter((i) => {
          if (!feedQuery) return true;
          const q = feedQuery.toLowerCase();
          return (i.title + " " + (i.subtitle ?? "") + " " + i.id).toLowerCase().includes(q);
        })
        .slice(0, 10),
    [scopedItems, feedQuery],
  );

  return (
    <>
      {kpis.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {kpis.slice(0, 4).map((k) => (
            <StatCard key={k.label} kpi={k} />
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
                {section.tagline}
              </div>
              <h2 className="mt-1 font-display text-xl tracking-tight">Actions</h2>
            </div>
            <span className="rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-[11px] text-muted-foreground">
              {section.actions.length === 1 ? "1 action" : `${section.actions.length} actions`}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {section.actions.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.key}
                  onClick={() => onOpenAction(a)}
                  disabled={!canExecute}
                  title={!canExecute ? `Permission ${config.moduleKey} manage is required` : undefined}
                  className={
                    "group relative overflow-hidden rounded-2xl border border-border bg-card/60 bg-gradient-surface p-4 text-left shadow-soft backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0 " +
                    (a.destructive ? "hover:border-destructive/50 focus-visible:ring-destructive/40" : "")
                  }
                >
                  <div className={"pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br opacity-60 blur-2xl transition-opacity group-hover:opacity-100 " + section.accent} />
                  <div className="relative flex items-start justify-between gap-3">
                    <div className={
                      "flex h-10 w-10 items-center justify-center rounded-xl border " +
                      (a.destructive
                        ? "border-destructive/30 bg-destructive/10 text-destructive"
                        : "border-primary/25 bg-primary/10 text-primary")
                    }>
                      <Icon className="h-5 w-5" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <div className="relative mt-3">
                    <div className="text-sm font-medium leading-tight">{a.label}</div>
                    <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.hint}</div>
                  </div>
                  {a.destructive && (
                    <span className="relative mt-3 inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-destructive">
                      Sensitive
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Recent · {section.title}
              </div>
              <h2 className="mt-1 font-display text-xl tracking-tight">Activity</h2>
            </div>
            <button className="text-xs text-muted-foreground hover:text-foreground" onClick={onBack}>
              All →
            </button>
          </div>
          <Card className="p-3">
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-border bg-background/60 px-2.5 py-1.5">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={feedQuery}
                onChange={(e) => setFeedQuery(e.target.value)}
                placeholder="Search this section…"
                className="h-7 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0"
              />
            </div>
            {recent.length === 0 && (
              <div className="rounded-lg border border-dashed border-border/80 bg-muted/20 p-6 text-center text-xs text-muted-foreground">
                No activity yet. Trigger an action from the panel on the left to see it appear here.
              </div>
            )}
            <ul className="space-y-1.5">
              {recent.map((r) => (
                <li key={r.id}>
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-transparent px-2 py-1.5 hover:border-border hover:bg-muted/40">
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium">{r.title}</div>
                      <div className="truncate text-[11px] text-muted-foreground">
                        <span className="font-mono">{r.id}</span> · {String(r.fields["Kind"] ?? "")}
                      </div>
                    </div>
                    <StatusChip status={r.status} />
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-[11px] text-muted-foreground">
              <span>{recent.length} shown</span>
              <button onClick={onBack} className="inline-flex items-center gap-1 text-primary hover:underline">
                Hub <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function defaultSectionKpis(section: SectionSpec, scoped: WorkflowItem[]): KpiCard[] {
  const Icon = section.icon;
  return [
    { label: "Records", value: scoped.length, icon: Icon, accent: "from-primary/30 to-transparent" },
  ];
}

// ---------------- Stat card ----------------

function StatCard({ kpi }: { kpi: KpiCard }) {
  const Icon = kpi.icon;
  const tone = kpi.tone ?? "primary";
  const railCls: Record<string, string> = {
    primary: "before:bg-primary/70",
    destructive: "before:bg-destructive/70",
    success: "before:bg-success/70",
    warning: "before:bg-warning/70",
    muted: "before:bg-muted-foreground/50",
  };
  const iconCls: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    destructive: "bg-destructive/10 text-destructive",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <div
      className={
        "relative overflow-hidden rounded-2xl border border-border bg-card/60 bg-gradient-surface p-5 shadow-soft backdrop-blur-sm " +
        "before:absolute before:inset-y-4 before:left-0 before:w-[3px] before:rounded-r-full " +
        railCls[tone]
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {kpi.label}
          </div>
          <div className="mt-3 font-display text-3xl leading-none tracking-tight text-foreground sm:text-[2rem]">
            {kpi.value}
          </div>
          {kpi.hint && <div className="mt-2 truncate text-xs text-muted-foreground">{kpi.hint}</div>}
        </div>
        <div className={"grid h-9 w-9 shrink-0 place-items-center rounded-xl " + iconCls[tone]}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

// ---------------- Action dialog ----------------

function ActionDialog({
  spec, busy = false, onOpenChange, onSubmit,
}: {
  spec: ActionSpec | null;
  busy?: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (spec: ActionSpec, values: Record<string, string>) => Promise<boolean>;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const open = !!spec;

  const handleClose = (o: boolean) => {
    if (!o) setValues({});
    onOpenChange(o);
  };

  const submit = async () => {
    if (!spec || busy) return;
    for (const f of spec.fields) {
      if (f.required && !values[f.name]?.trim()) {
        toast.error(`${f.label} is required`);
        return;
      }
    }
    const accepted = await onSubmit(spec, values);
    if (accepted) setValues({});
  };

  if (!spec) return null;
  const Icon = spec.icon;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-lg overflow-hidden p-0 sm:w-full">
        <DialogHeader className="border-b border-border px-6 pb-4 pt-6">
          <div className="flex items-center gap-3">
            <div className={"flex h-10 w-10 items-center justify-center rounded-xl " + (spec.destructive ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>{spec.label}</DialogTitle>
              <DialogDescription>{spec.hint}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="max-h-[calc(90vh-11rem)] space-y-3 overflow-y-auto px-6 py-4">
          {spec.fields.map((f) => (
            <div key={f.name} className="grid gap-1.5">
              <Label htmlFor={`${spec.key}-${f.name}`}>
                {f.label}{f.required && <span className="text-destructive"> *</span>}
              </Label>
              {f.type === "textarea" ? (
                <Textarea
                  id={`${spec.key}-${f.name}`}
                  value={values[f.name] ?? ""}
                  onChange={(e) => setValues((s) => ({ ...s, [f.name]: e.target.value }))}
                  placeholder={f.placeholder}
                  rows={3}
                />
              ) : (
                <Input
                  id={`${spec.key}-${f.name}`}
                  type={f.type === "number" ? "number" : "text"}
                  value={values[f.name] ?? ""}
                  onChange={(e) => setValues((s) => ({ ...s, [f.name]: e.target.value }))}
                  placeholder={f.placeholder}
                />
              )}
            </div>
          ))}
        </div>
        <DialogFooter className="border-t border-border px-6 py-4">
          <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
          <Button
            onClick={() => void submit()}
            disabled={busy}
            className={spec.destructive ? "bg-destructive text-destructive-foreground hover:opacity-90" : "bg-gradient-primary hover:opacity-90"}
          >
            {busy ? "Validating…" : `Save ${spec.label}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
