import { useMemo, useState } from "react";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Plus, Search, Filter, Download, Trash2, ChevronRight, Clock, MessageSquarePlus, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { Card, PageHeader, StatusChip } from "@/components/app-shell";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorkflow, type ModuleKey, type WorkflowItem } from "@/lib/workflow-store";

export type FieldDef = {
  key: string;
  label: string;
  type?: "text" | "number" | "select" | "textarea";
  options?: string[];
  required?: boolean;
  placeholder?: string;
};

export type ModuleConfig = {
  moduleKey: ModuleKey;
  eyebrow: string;
  title: string;
  description: string;
  workflow: string[]; // ordered stages
  outcomes?: string[]; // terminal alt outcomes (e.g. declined, failed)
  columns: { key: string; label: string }[]; // display columns from fields or "title"/"subtitle"/"status"/"updatedAt"
  fields: FieldDef[]; // form fields for create
  titleFrom?: (fields: Record<string, string | number>) => string;
  subtitleFrom?: (fields: Record<string, string | number>) => string;
  idPrefix?: string;
  kpis?: (items: WorkflowItem[]) => { label: string; value: string | number }[];
  extras?: React.ReactNode;
};

export function WorkflowModule({ config }: { config: ModuleConfig }) {
  const items = useWorkflow((s) => s.items[config.moduleKey]);
  const createItem = useWorkflow((s) => s.create);
  const advance = useWorkflow((s) => s.advance);
  const remove = useWorkflow((s) => s.remove);
  const addNote = useWorkflow((s) => s.addNote);

  const search = useSearch({ strict: false }) as { new?: string };
  const navigate = useNavigate();

  const [createOpen, setCreateOpen] = useState<boolean>(search?.new === "1");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const selected = items.find((i) => i.id === detailId) ?? null;

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (filter !== "all" && i.status !== filter) return false;
      if (query) {
        const hay = [i.id, i.title, i.subtitle ?? "", ...Object.values(i.fields).map(String)].join(" ").toLowerCase();
        return hay.includes(query.toLowerCase());
      }
      return true;
    });
  }, [items, query, filter]);

  const stages = [...config.workflow, ...(config.outcomes ?? [])];

  return (
    <>
      <PageHeader
        eyebrow={config.eyebrow}
        title={config.title}
        description={config.description}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => toast.info("Filters coming from Ops preset store")}>
              <Filter className="h-4 w-4" /> Filters
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${config.moduleKey}-export.json`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success("Export downloaded");
              }}
            >
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button onClick={() => setCreateOpen(true)} className="bg-gradient-primary shadow-glow hover:opacity-90">
              <Plus className="h-4 w-4" /> New
            </Button>
          </>
        }
      />

      {config.kpis && (
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {config.kpis(items).map((k) => (
            <Card key={k.label} className="relative overflow-hidden p-5">
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-primary/25 to-transparent opacity-70 blur-2xl" />
              <div className="relative text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{k.label}</div>
              <div className="relative mt-2 font-display text-3xl tracking-tight">{k.value}</div>
            </Card>
          ))}
        </div>
      )}

      {config.extras && <div className="mb-6">{config.extras}</div>}


      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background/50 px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search records…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {stages.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Reference</th>
                {config.columns.map((c) => (
                  <th key={c.key} className="px-5 py-3 font-medium">{c.label}</th>
                ))}
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={config.columns.length + 3} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    No records match your filters.
                  </td>
                </tr>
              )}
              {filtered.map((it) => (
                <tr
                  key={it.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => setDetailId(it.id)}
                >
                  <td className="px-5 py-3 font-mono text-xs">{it.id}</td>
                  {config.columns.map((c) => {
                    let v: string | number | undefined;
                    if (c.key === "title") v = it.title;
                    else if (c.key === "subtitle") v = it.subtitle;
                    else if (c.key === "updatedAt") v = new Date(it.updatedAt).toLocaleString();
                    else v = it.fields[c.key];
                    return <td key={c.key} className="px-5 py-3">{v ?? "—"}</td>;
                  })}
                  <td className="px-5 py-3"><StatusChip status={it.status} /></td>
                  <td className="px-3 py-3 text-muted-foreground"><ChevronRight className="h-4 w-4" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <CreateDialog
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o && search?.new) navigate({ to: ".", search: {} });
        }}
        config={config}
        onCreate={(item) => {
          const created = createItem(config.moduleKey, item);
          toast.success(`${config.title.replace(/s$/, "")} created`, { description: created.id });
          setCreateOpen(false);
          setDetailId(created.id);
        }}
      />

      <Sheet open={!!selected} onOpenChange={(o) => !o && setDetailId(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <DetailPanel
              item={selected}
              config={config}
              onAdvance={(to, note) => {
                advance(config.moduleKey, selected.id, to, note);
                toast.success(`Moved to ${to}`);
              }}
              onNote={(note) => {
                addNote(config.moduleKey, selected.id, note);
                toast.success("Note added");
              }}
              onDelete={() => {
                remove(config.moduleKey, selected.id);
                toast.success("Record removed");
                setDetailId(null);
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function CreateDialog({
  open,
  onOpenChange,
  config,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  config: ModuleConfig;
  onCreate: (item: Omit<WorkflowItem, "id" | "history" | "createdAt" | "updatedAt">) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const set = (k: string, v: string) => setValues((s) => ({ ...s, [k]: v }));

  const submit = () => {
    for (const f of config.fields) {
      if (f.required && !values[f.key]) {
        toast.error(`${f.label} is required`);
        return;
      }
    }
    const fields: Record<string, string | number> = {};
    config.fields.forEach((f) => {
      const v = values[f.key] ?? "";
      fields[f.label] = f.type === "number" ? Number(v || 0) : v;
    });
    const title = config.titleFrom ? config.titleFrom(fields) : (values[config.fields[0]?.key] ?? "New record");
    const subtitle = config.subtitleFrom?.(fields);
    onCreate({
      title,
      subtitle,
      status: config.workflow[0],
      fields,
    });
    setValues({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New {config.title.toLowerCase().replace(/s$/, "")}</DialogTitle>
          <DialogDescription>
            Fill in the details below to start a new {config.title.toLowerCase()} workflow.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          {config.fields.map((f) => (
            <div key={f.key} className="grid gap-1.5">
              <Label htmlFor={f.key}>
                {f.label}{f.required && <span className="text-destructive"> *</span>}
              </Label>
              {f.type === "select" ? (
                <Select value={values[f.key] ?? ""} onValueChange={(v) => set(f.key, v)}>
                  <SelectTrigger id={f.key}><SelectValue placeholder={f.placeholder ?? "Select…"} /></SelectTrigger>
                  <SelectContent>
                    {f.options?.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : f.type === "textarea" ? (
                <Textarea id={f.key} placeholder={f.placeholder} value={values[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} />
              ) : (
                <Input
                  id={f.key}
                  type={f.type === "number" ? "number" : "text"}
                  placeholder={f.placeholder}
                  value={values[f.key] ?? ""}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} className="bg-gradient-primary hover:opacity-90">Create & start workflow</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailPanel({
  item,
  config,
  onAdvance,
  onNote,
  onDelete,
}: {
  item: WorkflowItem;
  config: ModuleConfig;
  onAdvance: (to: string, note?: string) => void;
  onNote: (note: string) => void;
  onDelete: () => void;
}) {
  const [note, setNote] = useState("");
  const stageIdx = config.workflow.indexOf(item.status);
  const next = stageIdx >= 0 && stageIdx < config.workflow.length - 1 ? config.workflow[stageIdx + 1] : null;
  const isTerminalOutcome = config.outcomes?.includes(item.status);

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

      {/* Workflow stepper */}
      <div className="mt-6 rounded-xl border border-border bg-muted/20 p-4">
        <div className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Workflow</div>
        <ol className="space-y-2">
          {config.workflow.map((s, i) => {
            const done = stageIdx >= i && !isTerminalOutcome;
            const current = s === item.status;
            return (
              <li key={s} className="flex items-center gap-3">
                <div className={
                  "flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-semibold " +
                  (current
                    ? "border-primary bg-primary text-primary-foreground"
                    : done
                      ? "border-success/60 bg-success/20 text-success"
                      : "border-border text-muted-foreground")
                }>
                  {done && !current ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span className={"text-sm capitalize " + (current ? "font-medium text-foreground" : "text-muted-foreground")}>{s}</span>
              </li>
            );
          })}
        </ol>
        {isTerminalOutcome && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
            <XCircle className="h-4 w-4" /> Closed with outcome: <span className="font-medium capitalize">{item.status}</span>
          </div>
        )}
      </div>

      {/* Fields */}
      <div className="mt-6">
        <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Details</div>
        <dl className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-card/40 p-4 text-sm">
          {Object.entries(item.fields).map(([k, v]) => (
            <div key={k}>
              <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</dt>
              <dd className="mt-0.5 font-medium">{String(v)}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Actions */}
      <div className="mt-6 space-y-2">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</div>
        {next && (
          <Button className="w-full justify-between bg-gradient-primary hover:opacity-90" onClick={() => onAdvance(next)}>
            Advance to <span className="capitalize">{next}</span> <ArrowRight className="h-4 w-4" />
          </Button>
        )}
        <div className="flex flex-wrap gap-2">
          {config.workflow.map((s) => (
            <Button key={s} size="sm" variant={s === item.status ? "default" : "outline"} onClick={() => onAdvance(s)} className="capitalize">
              {s}
            </Button>
          ))}
          {config.outcomes?.map((o) => (
            <Button key={o} size="sm" variant="outline" className="capitalize border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => onAdvance(o, `Outcome: ${o}`)}>
              {o}
            </Button>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="mt-6">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <MessageSquarePlus className="h-3.5 w-3.5" /> Add note
        </div>
        <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Clinical note, escalation reason, or comment…" />
        <div className="mt-2 flex justify-end">
          <Button
            size="sm"
            disabled={!note.trim()}
            onClick={() => { onNote(note.trim()); setNote(""); }}
          >Save note</Button>
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-6">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <Clock className="h-3.5 w-3.5" /> Activity
        </div>
        <ol className="relative space-y-3 border-l border-border pl-4">
          {item.history.map((h, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
              <div className="text-sm font-medium">{h.action}</div>
              <div className="text-[11px] text-muted-foreground">{h.at} · {h.by}</div>
              {h.note && <div className="mt-1 rounded-md border border-border bg-muted/30 p-2 text-xs">{h.note}</div>}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-8 border-t border-border pt-4">
        <Button variant="outline" className="w-full border-destructive/30 text-destructive hover:bg-destructive/10" onClick={onDelete}>
          <Trash2 className="h-4 w-4" /> Delete record
        </Button>
      </div>
    </>
  );
}
