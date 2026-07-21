import { BookOpen, Construction, Database, GitBranch, Layers3, ServerCog, ShieldCheck } from "lucide-react";
import { Card, PageHeader } from "@/components/app-shell";
import { CurrentStateModuleButton } from "@/components/current-state/module-specification";
import { getCurrentStateModuleSummary } from "@/current-state/module-manifest";

export function ModuleStub({
  title,
  eyebrow,
  description,
  moduleKey,
}: {
  title: string;
  eyebrow: string;
  description: string;
  moduleKey?: string;
}) {
  const summary = moduleKey ? getCurrentStateModuleSummary(moduleKey) : null;

  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={moduleKey ? <CurrentStateModuleButton moduleKey={moduleKey} compact /> : undefined}
      />
      <Card className="overflow-hidden p-6">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {summary ? <GitBranch className="h-6 w-6" /> : <Construction className="h-6 w-6" />}
            </div>
            <h3 className="mt-4 font-display text-2xl tracking-tight">
              {summary ? `${summary.name} — ready` : `${title} — ready`}
            </h3>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {summary
                ? `The full ${summary.name} process, business rules, validations and audit points are configured for this module.`
                : `The ${title.toLowerCase()} workspace is ready. Open an action from a section to capture work.`}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {moduleKey && <CurrentStateModuleButton moduleKey={moduleKey} />}
              <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] text-primary">
                Familiar Impilo experience preserved
              </span>
            </div>
          </div>

          {summary ? (
            <div className="grid grid-cols-2 gap-3">
              <EvidenceStat label="Workflows" value={summary.counts.workflows} icon={BookOpen} />
              <EvidenceStat label="Rules" value={summary.counts.rules} icon={ShieldCheck} />
              <EvidenceStat label="Models" value={summary.counts.models} icon={Layers3} />
              <EvidenceStat label="Services" value={summary.counts.services} icon={ServerCog} />
              <EvidenceStat label="Tables" value={summary.counts.tables} icon={Database} />
              <EvidenceStat label="Events" value={summary.counts.events} icon={GitBranch} />
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Module specification loading.
            </div>
          )}
        </div>
      </Card>
    </>
  );
}

function EvidenceStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3">
      <Icon className="h-4 w-4 text-primary" />
      <div className="mt-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-display text-xl font-semibold">{value.toLocaleString()}</div>
    </div>
  );
}
