import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { Download, Filter, BookmarkPlus, ArrowRight } from "lucide-react";
import { PageHeader, Card } from "@/components/app-shell";
import { PermissionGate } from "@/components/permission-gate";
import { MOCK_REPORTS } from "@/lib/mock/reports";
import { MOCK_ADMISSIONS } from "@/lib/mock/admissions";
import { MOCK_ACCOUNTS } from "@/lib/mock/payments";
import { MOCK_MESSAGES } from "@/lib/mock/integrations";
import { FACILITIES } from "@/rules/facilities";
import { formatSADateTime, formatZAR } from "@/rules/formatting";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({ meta: [{ title: "Reports & BI — Impilo" }] }),
  component: ReportsBI,
});

function ReportsBI() {
  const [facility, setFacility] = useState<string>("");
  const [range, setRange] = useState<string>("7d");
  const [exporting, setExporting] = useState<{ report: string; progress: number } | null>(null);

  const admissionsByFacility = useMemo(() => {
    const map = new Map<string, number>();
    MOCK_ADMISSIONS.forEach((a) => map.set(a.facility, (map.get(a.facility) ?? 0) + 1));
    return Array.from(map.entries()).map(([facility, count]) => ({ facility: facility.replace("Life ", ""), count }));
  }, []);

  const outstandingTrend = Array.from({ length: 7 }).map((_, i) => ({
    day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
    outstanding: 480000 + i * 42000 + (i % 2 === 0 ? 30000 : -10000),
  }));

  const messageMix = useMemo(() => {
    const map = new Map<string, number>();
    MOCK_MESSAGES.forEach((m) => map.set(m.status, (map.get(m.status) ?? 0) + 1));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, []);
  const PIE = ["#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#94a3b8"];

  const runExport = (report: string) => {
    setExporting({ report, progress: 0 });
    const iv = setInterval(() => {
      setExporting((s) => {
        if (!s) return s;
        if (s.progress >= 100) { clearInterval(iv); toast.success("Export ready", { description: report }); return null; }
        return { ...s, progress: s.progress + 10 };
      });
    }, 120);
  };

  return (
    <>
      <PageHeader
        eyebrow="Overview · Reports & BI"
        title="Operational BI"
        description="Facility- and date-scoped KPIs, charts, saved reports and drill-through into worklists."
        actions={
          <PermissionGate permission="reports:save-view">
            <button onClick={() => toast.success("View saved")} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs">
              <BookmarkPlus className="h-3.5 w-3.5" /> Save view
            </button>
          </PermissionGate>
        }
      />

      <Card className="mb-4 flex flex-wrap items-center gap-2 p-3 text-xs">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        <select value={facility} onChange={(e) => setFacility(e.target.value)} className="rounded-lg border border-border bg-background/60 px-2 py-1.5">
          <option value="">All facilities</option>
          {FACILITIES.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <select value={range} onChange={(e) => setRange(e.target.value)} className="rounded-lg border border-border bg-background/60 px-2 py-1.5">
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </Card>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Active admissions" value={String(MOCK_ADMISSIONS.filter((a) => a.state === "admitted").length)} />
        <Kpi label="Outstanding" value={formatZAR(MOCK_ACCOUNTS.reduce((s, a) => s + a.outstanding, 0), { decimals: false })} tone="warning" />
        <Kpi label="Dead-letter" value={String(MOCK_MESSAGES.filter((m) => m.status === "deadletter").length)} tone="danger" />
        <Kpi label="Delivered" value={String(MOCK_MESSAGES.filter((m) => m.status === "delivered").length)} tone="success" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Admissions by facility</div>
            <Link to="/admissions" className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline">Drill through <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={admissionsByFacility}>
                <XAxis dataKey="facility" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-4">
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Message mix</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={messageMix} dataKey="value" nameKey="name" outerRadius={70}>
                  {messageMix.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-4 lg:col-span-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Outstanding balance trend</div>
            <Link to="/billing" className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline">Open billing <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={outstandingTrend}>
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R ${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(v: number) => formatZAR(v)} />
                <Line type="monotone" dataKey="outstanding" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Saved reports</div>
        </div>
        <ul className="divide-y divide-border">
          {MOCK_REPORTS.map((r) => (
            <li key={r.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <div className="font-medium">{r.name}</div>
                <div className="text-xs text-muted-foreground">{r.category} · owner {r.owner} · last run {formatSADateTime(r.lastRun)}{r.scheduled ? ` · ${r.scheduled}` : ""}</div>
              </div>
              <PermissionGate permission="reports:export">
                <button onClick={() => runExport(r.name)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs">
                  <Download className="h-3.5 w-3.5" /> Export
                </button>
              </PermissionGate>
            </li>
          ))}
        </ul>
      </Card>

      {exporting && (
        <div className="fixed bottom-6 right-6 z-40 w-72 rounded-xl border border-border bg-card p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span>Exporting {exporting.report}…</span>
            <span className="text-muted-foreground">{exporting.progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div style={{ width: `${exporting.progress}%` }} className="h-full bg-primary transition-all" />
          </div>
        </div>
      )}
    </>
  );
}

function Kpi({ label, value, tone = "muted" }: { label: string; value: string; tone?: "muted" | "success" | "warning" | "danger" }) {
  const toneClass = { muted: "text-foreground", success: "text-emerald-500", warning: "text-warning", danger: "text-destructive" }[tone];
  return (
    <Card className="p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={"mt-1 font-display text-2xl " + toneClass}>{value}</div>
    </Card>
  );
}
