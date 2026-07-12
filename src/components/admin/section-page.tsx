import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, ChevronRight, Search, Sparkles } from "lucide-react";
import { Card, StatusChip } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { useWorkflow } from "@/lib/workflow-store";
import {
  ACTIONS, ActionDialog, useSubmitAction,
  type ActionSpec, type SectionKey, SECTIONS,
} from "./actions";

export function AdminSectionPage({ sectionKey }: { sectionKey: SectionKey }) {
  const section = SECTIONS.find((s) => s.key === sectionKey)!;
  const submit = useSubmitAction();
  const items = useWorkflow((s) => s.items.admin);
  const [active, setActive] = useState<ActionSpec | null>(null);
  const [query, setQuery] = useState("");

  const actionKinds = useMemo(
    () => new Set(section.actions.map((k) => ACTIONS[k].kind)),
    [section.actions],
  );

  const recent = useMemo(
    () =>
      items
        .filter((i) => actionKinds.has(String(i.fields["Kind"] ?? "")))
        .filter((i) => {
          if (!query) return true;
          const q = query.toLowerCase();
          return (i.title + " " + (i.subtitle ?? "") + " " + i.id).toLowerCase().includes(q);
        })
        .slice(0, 8),
    [items, actionKinds, query],
  );

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Actions grid */}
        <div>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
                {section.tagline}
              </div>
              <h2 className="mt-1 font-display text-xl tracking-tight">Actions</h2>
            </div>
            <span className="rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-[11px] text-muted-foreground">
              {section.actions.length} actions
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {section.actions.map((k) => {
              const a = ACTIONS[k];
              const Icon = a.icon;
              return (
                <button
                  key={a.key}
                  onClick={() => setActive(a)}
                  aria-label={a.label}
                  className={
                    "group relative overflow-hidden rounded-2xl border border-border bg-card/60 bg-gradient-surface p-4 text-left shadow-soft backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:translate-y-0 " +
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

        {/* Recent activity for section */}
        <div>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Recent · {section.title}
              </div>
              <h2 className="mt-1 font-display text-xl tracking-tight">Activity</h2>
            </div>
            <Link
              to="/admin"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              All admin →
            </Link>
          </div>
          <Card className="p-3">
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-border bg-background/60 px-2.5 py-1.5">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search this section…"
                className="h-7 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0"
              />
            </div>
            {recent.length === 0 && (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                No activity yet. Trigger an action to see it here.
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
              <Link to="/admin" className="inline-flex items-center gap-1 text-primary hover:underline">
                Hub <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </Card>
        </div>
      </div>

      <ActionDialog
        spec={active}
        onOpenChange={(o) => !o && setActive(null)}
        onSubmit={(a, values) => {
          submit(a, values);
          setActive(null);
        }}
      />
    </>
  );
}

export function sectionHead(section: (typeof SECTIONS)[number]) {
  return {
    meta: [
      { title: `${section.title} — Administration · Impilo` },
      { name: "description", content: section.description },
    ],
  };
}
