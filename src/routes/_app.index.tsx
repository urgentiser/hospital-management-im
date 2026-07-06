import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHeader, StatusChip } from "@/components/app-shell";
import { admissions, admissionsTrend, authorisations, events, kpis, patients, workflowLoad } from "@/lib/mock-data";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, Activity, Clock, Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Impilo Modern Platform" },
      { name: "description", content: "Unified healthcare operations dashboard for the Impilo modern platform." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <>
      <PageHeader
        eyebrow="Operations · Live"
        title="Good morning, Dr. Naidoo"
        description="Unified view across clinical, operational, and integration workflows. All data is streamed through BFF endpoints."
        actions={
          <>
            <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/60 px-3.5 py-2 text-sm text-foreground hover:bg-card">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Last 24 hours
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-glow hover:opacity-90">
              <Sparkles className="h-4 w-4" />
              Ask Impilo AI
            </button>
          </>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{k.label}</div>
                <div className="mt-3 font-display text-4xl tracking-tight">{k.value}</div>
              </div>
              <div
                className={
                  "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium " +
                  (k.trend === "up" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive")
                }
              >
                {k.trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {k.delta}
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">{k.hint}</div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <div className="text-sm font-medium">Admissions vs Discharges</div>
              <div className="text-xs text-muted-foreground">Rolling 7-day window across all facilities</div>
            </div>
            <StatusChip status="active" />
          </div>
          <div className="h-72 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={admissionsTrend} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.82 0.14 182)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.82 0.14 182)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.7 0.13 235)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.7 0.13 235)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(0.28 0.02 250)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" stroke="oklch(0.68 0.02 250)" fontSize={12} axisLine={false} tickLine={false} />
                <YAxis stroke="oklch(0.68 0.02 250)" fontSize={12} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.21 0.022 250)",
                    border: "1px solid oklch(0.28 0.02 250)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="admitted" stroke="oklch(0.82 0.14 182)" strokeWidth={2} fill="url(#gA)" />
                <Area type="monotone" dataKey="discharged" stroke="oklch(0.7 0.13 235)" strokeWidth={2} fill="url(#gB)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="border-b border-border px-5 py-4">
            <div className="text-sm font-medium">Workflow load</div>
            <div className="text-xs text-muted-foreground">Active records per domain service</div>
          </div>
          <div className="h-72 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workflowLoad} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="oklch(0.28 0.02 250)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="oklch(0.68 0.02 250)" fontSize={11} axisLine={false} tickLine={false} />
                <YAxis stroke="oklch(0.68 0.02 250)" fontSize={11} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.21 0.022 250)",
                    border: "1px solid oklch(0.28 0.02 250)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" fill="oklch(0.82 0.14 182)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Two-column: recent patients + integration events */}
      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <div className="text-sm font-medium">Recent patient activity</div>
              <div className="text-xs text-muted-foreground">Latest changes across all facilities</div>
            </div>
            <a href="/patients" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </a>
          </div>
          <div className="divide-y divide-border">
            {patients.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center gap-4 px-5 py-3.5 text-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-xs font-medium">
                  {p.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.mrn} · {p.facility}
                  </div>
                </div>
                <div className="hidden text-xs text-muted-foreground md:block">{p.practitioner}</div>
                <StatusChip status={p.status} />
                <div className="hidden w-16 text-right text-xs text-muted-foreground md:block">{p.updatedAt}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <div className="text-sm font-medium">Integration events</div>
              <div className="text-xs text-muted-foreground">Azure Service Bus · live</div>
            </div>
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div className="divide-y divide-border">
            {events.map((e) => (
              <div key={e.id} className="px-5 py-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate font-mono text-[12px] text-foreground">{e.topic}</div>
                  <StatusChip status={e.status} />
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="font-mono">{e.correlationId}</span>
                  <span>
                    {e.attempts} attempt{e.attempts === 1 ? "" : "s"} · {e.latencyMs}ms
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Authorisations preview */}
      <Card className="mt-6">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <div className="text-sm font-medium">Authorisations in flight</div>
            <div className="text-xs text-muted-foreground">Cross-scheme submissions requiring review</div>
          </div>
          <a href="/authorisations" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            Open queue <ArrowRight className="h-3 w-3" />
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Ref</th>
                <th className="px-5 py-3 font-medium">Patient</th>
                <th className="px-5 py-3 font-medium">Scheme</th>
                <th className="px-5 py-3 font-medium">Procedure</th>
                <th className="px-5 py-3 text-right font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {authorisations.map((a) => (
                <tr key={a.id} className="hover:bg-muted/30">
                  <td className="px-5 py-3 font-mono text-xs">{a.id}</td>
                  <td className="px-5 py-3">{a.patient}</td>
                  <td className="px-5 py-3 text-muted-foreground">{a.scheme}</td>
                  <td className="px-5 py-3">{a.procedure}</td>
                  <td className="px-5 py-3 text-right font-mono">R {a.amount.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <StatusChip status={a.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
