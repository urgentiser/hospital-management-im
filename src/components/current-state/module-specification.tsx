import { useEffect, useMemo, useState } from "react";
import { BookOpen, ExternalLink, FileCheck2, GitBranch, Search, ShieldCheck, Workflow } from "lucide-react";
import { Card } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { currentStateModules, getCurrentStateModuleSummary } from "@/current-state/module-manifest";
import { loadCurrentStateModule } from "@/current-state/loader";
import type { CurrentStateModuleSpecification, CurrentStateRecord } from "@/current-state/types";
import { OperationalProcessConsole } from "@/components/compatibility/operational-process";

const sections = ["Processes", "Business Rules", "Validations"] as const;
type Section = typeof sections[number];

function text(value: unknown): string { return value === null || value === undefined ? "—" : String(value); }
function searchable(row: CurrentStateRecord): string { return Object.values(row).map(text).join(" ").toLowerCase(); }

function GuidanceTable({ rows, query, section }: { rows: CurrentStateRecord[]; query: string; section: Section }) {
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? rows.filter((row) => searchable(row).includes(needle)) : rows;
  }, [rows, query]);
  const visible = filtered.slice(0, 250);
  if (!rows.length) return <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No guidance is available for this section.</div>;

  return (
    <div className="space-y-2">
      <div className="text-[11px] text-muted-foreground">Showing {visible.length} of {filtered.length} matching items</div>
      {visible.map((row, index) => (
        <Card key={index} className="p-4">
          <div className="text-sm font-medium">
            {section === "Business Rules" ? text(row.description || row.rule_name) : text(row.summary || row.description || "Validation applied during the relevant process step")}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {section === "Business Rules"
              ? text(row.category || "Business rule")
              : text(row.conditions || "Applied during the relevant process step")}
          </div>
        </Card>
      ))}
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: number; icon: React.ComponentType<{ className?: string }> }) {
  return <Card className="p-3"><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /><div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div><div className="font-display text-xl font-semibold">{value.toLocaleString()}</div></div></div></Card>;
}

export function CurrentStateModuleButton({ moduleKey, compact = false }: { moduleKey: string; compact?: boolean }) {
  const summary = getCurrentStateModuleSummary(moduleKey);
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<Section>("Processes");
  const [query, setQuery] = useState("");
  const [spec, setSpec] = useState<CurrentStateModuleSpecification | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!open || !summary) return;
    setLoading(true);
    void loadCurrentStateModule(summary.key).then(setSpec).finally(() => setLoading(false));
  }, [open, summary?.key]);
  if (!summary) return null;
  const rows: CurrentStateRecord[] = !spec ? [] : section === "Business Rules" ? spec.rules : section === "Validations" ? spec.validations : spec.menus;

  return <>
    <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} title={`Open the process guide for ${summary.name}`}><BookOpen className="mr-1.5 h-3.5 w-3.5" />{compact ? "Process guide" : "Operational process guide"}</Button>
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="w-[96vw] max-w-[1180px] overflow-y-auto sm:max-w-[1180px]">
        <SheetHeader><SheetTitle>{summary.name} — process guide</SheetTitle><SheetDescription>Standard Impilo actions, process sequence, business rules and user-entered validations.</SheetDescription></SheetHeader>
        {loading || !spec ? <div className="py-16 text-center text-sm text-muted-foreground">Loading process guidance…</div> : <div className="mt-5 space-y-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><Stat label="Processes" value={spec.counts.menus || spec.counts.workflows} icon={Workflow} /><Stat label="Workflow steps" value={spec.operatingFlows.reduce((sum, flow) => sum + flow.steps.length, 0)} icon={FileCheck2} /><Stat label="Business rules" value={spec.counts.rules} icon={ShieldCheck} /><Stat label="Validations" value={spec.counts.validations} icon={FileCheck2} /></div>
          <div className="flex gap-2 overflow-x-auto pb-1">{sections.map((candidate) => <button key={candidate} type="button" onClick={() => setSection(candidate)} className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-medium ${candidate === section ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:bg-muted/30"}`}>{candidate}</button>)}</div>
          {section === "Processes" ? <OperationalProcessConsole moduleKey={summary.key} embedded /> : <><div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3"><Search className="h-4 w-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${section.toLowerCase()}…`} className="border-0 shadow-none focus-visible:ring-0" /></div><GuidanceTable rows={rows} query={query} section={section} /></>}
        </div>}
      </SheetContent>
    </Sheet>
  </>;
}

export function CurrentStatePortfolioLauncher({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = currentStateModules.filter((module) => !query.trim() || `${module.name} ${module.category}`.toLowerCase().includes(query.toLowerCase()));
  return <><button type="button" onClick={() => setOpen(true)} className="mt-2 flex w-full items-center gap-2 rounded-lg border border-sidebar-border/70 px-3 py-2 text-xs text-sidebar-foreground/80 hover:bg-sidebar-accent"><GitBranch className="h-4 w-4" /><span>{compact ? "Processes" : "Impilo operational processes"}</span><ExternalLink className="ml-auto h-3.5 w-3.5" /></button><Sheet open={open} onOpenChange={setOpen}><SheetContent className="w-[94vw] max-w-3xl overflow-y-auto sm:max-w-3xl"><SheetHeader><SheetTitle>Impilo process portfolio</SheetTitle><SheetDescription>Operational processes for core modules, MultiTouch and connected applications.</SheetDescription></SheetHeader><div className="mt-4 flex items-center gap-2 rounded-xl border border-border px-3"><Search className="h-4 w-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search module or application…" className="border-0 shadow-none focus-visible:ring-0" /></div><div className="mt-4 space-y-4">{[...new Set(filtered.map((item) => item.category))].map((category) => <section key={category}><div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{category}</div><div className="grid gap-2 sm:grid-cols-2">{filtered.filter((item) => item.category === category).map((item) => <Card key={item.key} className="flex items-center justify-between gap-3 p-3"><div><div className="text-sm font-medium">{item.name}</div><div className="text-[11px] text-muted-foreground">{item.counts.workflows || item.counts.menus} processes · {item.counts.rules} rules</div></div><CurrentStateModuleButton moduleKey={item.key} compact /></Card>)}</div></section>)}</div></SheetContent></Sheet></>;
}
