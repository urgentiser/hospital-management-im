import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Activity, Users, Building, ShieldAlert } from "lucide-react";
import { Card, StatusChip } from "@/components/app-shell";
import { useWorkflow } from "@/lib/workflow-store";
import { SECTIONS, ACTIONS } from "@/components/admin/actions";

export const Route = createFileRoute("/_app/admin/")({
  head: () => ({
    meta: [
      { title: "Administration — Impilo" },
      { name: "description", content: "Control plane for identity, facilities, reference data, billing operations and platform monitoring." },
    ],
  }),
  component: AdminIndex,
});

function AdminIndex() {
  const items = useWorkflow((s) => s.items.admin);

  const stats = useMemo(() => {
    const total = items.length;
    const users = items.filter((i) => String(i.fields["Kind"] ?? "") === "User").length;
    const facilities = items.filter((i) => ["Facility", "Hospital", "Ward", "Theatre"].includes(String(i.fields["Kind"] ?? ""))).length;
    const sensitive = items.filter((i) => ["Sanction", "Unlock Resources", "Logs Clear"].includes(String(i.fields["Kind"] ?? ""))).length;
    return { total, users, facilities, sensitive };
  }, [items]);

  const recent = items.slice(0, 6);

  const totalActions = SECTIONS.reduce((n, s) => n + s.actions.length, 0);

  return (
    <>
      {/* Hero + KPIs */}
      <div className="mb-8 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="relative overflow-hidden p-6">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-primary/30 via-accent/20 to-transparent blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-gradient-to-tr from-accent/20 to-transparent blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-primary">
              <Activity className="h-3 w-3" /> Live
            </div>
            <h2 className="mt-3 max-w-xl font-display text-2xl leading-tight tracking-tight sm:text-3xl">
              Everything your platform needs, in one calm command centre.
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              {totalActions} curated actions across {SECTIONS.length} pillars — organised so operators can move quickly without losing an audit trail.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                to="/admin/users"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
              >
                Manage users <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/admin/facilities"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/70 px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40"
              >
                Configure facilities
              </Link>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <StatCard icon={Activity} label="Total actions" value={stats.total} accent="from-primary/30 to-transparent" />
          <StatCard icon={Users} label="User records" value={stats.users} accent="from-indigo-500/30 to-transparent" />
          <StatCard icon={Building} label="Facility ops" value={stats.facilities} accent="from-emerald-500/30 to-transparent" />
          <StatCard icon={ShieldAlert} label="Sensitive" value={stats.sensitive} accent="from-rose-500/30 to-transparent" tone="destructive" />
        </div>
      </div>

      {/* Section grid */}
      <div className="mb-3 flex items-end justify-between">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary">Pillars</div>
          <h2 className="mt-1 font-display text-xl tracking-tight">Administration sections</h2>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const previewActions = s.actions.slice(0, 4);
          return (
            <Link
              key={s.key}
              to={`/admin/${s.slug}` as "/admin"}
              aria-label={`Open ${s.title}`}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card/60 bg-gradient-surface p-5 shadow-soft backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <div className={"pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br opacity-70 blur-2xl transition-opacity group-hover:opacity-100 " + s.accent} />
              <div className="relative flex items-start justify-between">
                <div className={"flex h-11 w-11 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary ring-1 " + s.ring}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {s.actions.length} actions
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
                {previewActions.map((k) => (
                  <span key={k} className="rounded-md border border-border bg-background/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {ACTIONS[k].label.replace(/^Maintain |^Manage |^Edit /, "")}
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
            </Link>
          );
        })}
      </div>

      {/* Recent activity */}
      <div className="mt-10">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Audit</div>
            <h2 className="mt-1 font-display text-xl tracking-tight">Latest admin activity</h2>
          </div>
        </div>
        <Card className="divide-y divide-border">
          {recent.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No admin activity yet.
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
                  {String(r.fields["Kind"] ?? "Admin")}
                </span>
                <StatusChip status={r.status} />
              </div>
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}

function StatCard({
  icon: Icon, label, value, accent, tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  accent: string;
  tone?: "destructive";
}) {
  return (
    <Card className="relative overflow-hidden p-4">
      <div className={"pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br opacity-70 blur-2xl " + accent} />
      <div className="relative flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className={"h-3.5 w-3.5 " + (tone === "destructive" ? "text-destructive" : "text-primary")} />
        {label}
      </div>
      <div className="relative mt-2 font-display text-3xl tracking-tight">{value}</div>
    </Card>
  );
}
