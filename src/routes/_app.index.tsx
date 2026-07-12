import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, PageHeader, StatusChip } from "@/components/app-shell";
import { KpiCard, Section, EmptyState } from "@/components/ui-kit";
import { formatZAR } from "@/lib/format";
import {
  admissions,
  admissionsTrend,
  authorisations,
  events,
  patients,
  workflowLoad,
} from "@/lib/mock-data";
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
import {
  Activity,
  ArrowRight,
  BedDouble,
  Clock,
  Pill,
  Radio,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  Receipt,
  ClipboardList,
  Inbox,
} from "lucide-react";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "Operations Dashboard — Impilo" },
      {
        name: "description",
        content:
          "Executive operations command centre — admissions, authorisations, ward, theatre, pharmacy, billing and integration health at a glance.",
      },
    ],
  }),
  component: Dashboard,
});

// ---------------------------------------------------------------------------
// Derived operational snapshots (from existing mock data — no logic changes).
// ---------------------------------------------------------------------------

const wards = [
  { name: "Ward 3B · Medical", beds: 24, occupied: 21 },
  { name: "Maternity", beds: 18, occupied: 12 },
  { name: "ICU", beds: 10, occupied: 9 },
  { name: "Cardiology", beds: 16, occupied: 11 },
];

const pharmacyToday = {
  dispensed: 214,
  awaiting: 18,
  onHold: 4,
  compounding: 7,
};

const billingToday = {
  billed: 1_284_400,
  awaitingAuth: 312_000,
  awaitingSubmission: 174_500,
  rejected: 42_800,
};

const slaBreaches = [
  {
    id: "AUTH-40922",
    label: "Authorisation response overdue",
    detail: "Aisha Patel · Momentum · 6h past SLA",
    to: "/authorisations",
  },
  {
    id: "ADM-88213",
    label: "Case review pending",
    detail: "Nomvula Dlamini · High-value review · 2h past SLA",
    to: "/case-management",
  },
  {
    id: "EVT-1004",
    label: "Dead-letter queue growing",
    detail: "billing.claim.submitted.v1 · 6 attempts",
    to: "/service-bus",
  },
];

// ---------------------------------------------------------------------------

function Dashboard() {
  const totalBeds = wards.reduce((s, w) => s + w.beds, 0);
  const occupiedBeds = wards.reduce((s, w) => s + w.occupied, 0);
  const occupancyPct = Math.round((occupiedBeds / totalBeds) * 100);
  const failed = events.filter((e) => e.status === "deadletter" || e.status === "retry").length;

  return (
    <>
      <PageHeader
        eyebrow="Operations · Live"
        title="Good morning, Dr. Naidoo"
        description="A unified command centre for clinical, operational, funding and integration workflows across every facility."
        actions={
          <>
            <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/60 px-3.5 py-2 text-sm text-foreground transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Last 24 hours
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-glow transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              <Sparkles className="h-4 w-4" />
              Ask Impilo AI
            </button>
          </>
        }
      />

      {/* Executive KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Active Admissions"
          value={128}
          delta="+4.2%"
          trend="up"
          hint="vs. last week"
          icon={BedDouble}
          tone="default"
          to="/admissions"
        />
        <KpiCard
          label="Pending Authorisations"
          value={42}
          delta="-8.1%"
          trend="down"
          hint="SLA on track"
          icon={ShieldCheck}
          tone="warning"
          to="/authorisations"
        />
        <KpiCard
          label="Theatre Utilisation"
          value="87%"
          delta="+2.4%"
          trend="up"
          hint="Past 24 hours"
          icon={Activity}
          tone="info"
          to="/theatre"
        />
        <KpiCard
          label="Failed Messages"
          value={failed}
          delta="-2"
          trend="down"
          hint="Dead-letter queue"
          icon={AlertTriangle}
          tone="destructive"
          to="/failed-messages"
        />
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Section
          title="Admissions vs Discharges"
          description="Rolling 7-day window across all facilities"
          className="xl:col-span-2"
          actions={<StatusChip status="active" />}
        >
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
        </Section>

        <Section title="Workflow load" description="Active records per domain service">
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
        </Section>
      </div>

      {/* Operations grid */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {/* Ward occupancy */}
        <Section
          title="Ward occupancy"
          description={`${occupiedBeds} of ${totalBeds} beds occupied · ${occupancyPct}%`}
          viewAllTo="/ward"
        >
          <ul className="divide-y divide-border">
            {wards.map((w) => {
              const pct = Math.round((w.occupied / w.beds) * 100);
              const tone =
                pct >= 90 ? "bg-destructive" : pct >= 75 ? "bg-warning" : "bg-success";
              return (
                <li key={w.name} className="px-5 py-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate font-medium text-foreground">{w.name}</span>
                    <span className="text-muted-foreground">
                      {w.occupied}/{w.beds}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={"h-full rounded-full " + tone}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Section>

        {/* Pharmacy */}
        <Section title="Pharmacy activity" description="Today · all facilities" viewAllTo="/pharmacy">
          <ul className="divide-y divide-border text-sm">
            <PharmRow icon={Pill} label="Dispensed" value={pharmacyToday.dispensed} />
            <PharmRow icon={Clock} label="Awaiting collection" value={pharmacyToday.awaiting} tone="warning" />
            <PharmRow icon={AlertTriangle} label="On hold" value={pharmacyToday.onHold} tone="destructive" />
            <PharmRow icon={ClipboardList} label="Compounding" value={pharmacyToday.compounding} />
          </ul>
        </Section>

        {/* Billing */}
        <Section title="Billing & funding" description="Value in flight · today" viewAllTo="/billing">
          <ul className="divide-y divide-border text-sm">
            <MoneyRow label="Billed today" value={billingToday.billed} tone="success" />
            <MoneyRow label="Awaiting authorisation" value={billingToday.awaitingAuth} tone="warning" />
            <MoneyRow label="Awaiting submission" value={billingToday.awaitingSubmission} />
            <MoneyRow label="Rejected" value={billingToday.rejected} tone="destructive" />
          </ul>
        </Section>

        {/* SLA breaches */}
        <Section title="SLA alerts" description="Requires attention" viewAllTo="/workflow-inbox">
          {slaBreaches.length === 0 ? (
            <div className="p-4">
              <EmptyState icon={Inbox} title="All clear" description="No SLA breaches right now." />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {slaBreaches.map((b) => (
                <li key={b.id}>
                  <Link
                    to={b.to as never}
                    className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-muted/40 focus-visible:bg-muted/50 focus-visible:outline-none"
                  >
                    <span className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive">
                      <AlertTriangle className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">{b.label}</div>
                      <div className="truncate text-xs text-muted-foreground">{b.detail}</div>
                    </div>
                    <ArrowRight className="mt-1 h-3.5 w-3.5 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      {/* Recent patient activity + integration events */}
      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Section
          title="Recent patient activity"
          description="Latest changes across all facilities"
          viewAllTo="/patients"
          className="xl:col-span-2"
        >
          <div className="divide-y divide-border">
            {patients.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center gap-4 px-5 py-3.5 text-sm">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary text-xs font-medium">
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
                <div className="hidden w-16 text-right text-xs text-muted-foreground md:block">
                  {p.updatedAt}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Integration events"
          description="Azure Service Bus · live"
          viewAllTo="/service-bus"
          actions={<Radio className="h-4 w-4 text-primary" />}
        >
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
        </Section>
      </div>

      {/* Authorisations preview */}
      <Card className="mt-6">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <div className="text-sm font-semibold">Authorisations in flight</div>
            <div className="text-xs text-muted-foreground">Cross-scheme submissions requiring review</div>
          </div>
          <Link
            to="/authorisations"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10"
          >
            Open queue <ArrowRight className="h-3 w-3" />
          </Link>
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
                  <td className="px-5 py-3 text-right font-mono">{formatZAR(a.amount)}</td>
                  <td className="px-5 py-3">
                    <StatusChip status={a.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Silence unused-import warning: admissions is retained for future drill-through */}
      <span className="sr-only" data-count={admissions.length} />
    </>
  );
}

function PharmRow({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone?: "default" | "warning" | "destructive";
}) {
  const iconCls =
    tone === "warning"
      ? "bg-warning/10 text-warning"
      : tone === "destructive"
      ? "bg-destructive/10 text-destructive"
      : "bg-primary/10 text-primary";
  return (
    <li className="flex items-center gap-3 px-5 py-3">
      <span className={"grid h-7 w-7 place-items-center rounded-lg " + iconCls}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="flex-1 truncate text-sm text-foreground">{label}</span>
      <span className="font-display text-lg tracking-tight text-foreground">{value}</span>
    </li>
  );
}

function MoneyRow({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "success" | "warning" | "destructive";
}) {
  const dot =
    tone === "success"
      ? "bg-success"
      : tone === "warning"
      ? "bg-warning"
      : tone === "destructive"
      ? "bg-destructive"
      : "bg-muted-foreground/50";
  return (
    <li className="flex items-center gap-3 px-5 py-3">
      <span className={"h-2 w-2 shrink-0 rounded-full " + dot} />
      <span className="flex-1 truncate text-sm text-foreground">{label}</span>
      <span className="font-mono text-sm text-foreground">{formatZAR(value)}</span>
    </li>
  );
}

// keep Receipt import used to avoid tree-shake warnings when re-imported later
void Receipt;
