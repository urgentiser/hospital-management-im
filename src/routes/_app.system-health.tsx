import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatusChip, Card } from "@/components/app-shell";
import { MOCK_SERVICES } from "@/lib/mock/system-health";

export const Route = createFileRoute("/_app/system-health")({
  head: () => ({ meta: [{ title: "System Health — Impilo" }] }),
  component: SystemHealth,
});

function SystemHealth() {
  const healthy = MOCK_SERVICES.filter((s) => s.status === "healthy").length;
  const degraded = MOCK_SERVICES.filter((s) => s.status === "degraded").length;
  const down = MOCK_SERVICES.filter((s) => s.status === "down").length;

  return (
    <>
      <PageHeader eyebrow="Platform · System Health" title="System health" description="Live status, latency and uptime for every service in the platform." />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Kpi label="Healthy" value={healthy} tone="success" />
        <Kpi label="Degraded" value={degraded} tone="warning" />
        <Kpi label="Down" value={down} tone="danger" />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {MOCK_SERVICES.map((s) => (
          <Card key={s.name} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">{s.name}</div>
                <div className="text-[11px] text-muted-foreground">{s.region}</div>
              </div>
              <StatusChip status={s.status} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Latency</div>
                <div>{s.latencyMs} ms</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Uptime 30d</div>
                <div>{s.uptime30d.toFixed(2)}%</div>
              </div>
            </div>
            {s.lastIncident && (
              <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-[11px] text-amber-500">
                {s.lastIncident}
              </div>
            )}
          </Card>
        ))}
      </div>
    </>
  );
}

function Kpi({ label, value, tone }: { label: string; value: number; tone: "success" | "warning" | "danger" }) {
  const cls = { success: "text-emerald-500", warning: "text-warning", danger: "text-destructive" }[tone];
  return (
    <Card className="p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={"mt-1 font-display text-2xl " + cls}>{value}</div>
    </Card>
  );
}
