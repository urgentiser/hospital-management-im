import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHeader, StatusChip } from "@/components/app-shell";
import { events } from "@/lib/mock-data";
import { Activity, AlertTriangle, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_app/integrations")({
  head: () => ({
    meta: [
      { title: "Integrations — Impilo" },
      { name: "description", content: "Azure Service Bus topics, subscriptions, and dead-letter monitoring." },
    ],
  }),
  component: IntegrationsPage,
});

function IntegrationsPage() {
  const stats = [
    { label: "Topics", value: 24, icon: Activity },
    { label: "Retries (1h)", value: 12, icon: RefreshCw },
    { label: "Dead-letter", value: 3, icon: AlertTriangle },
  ];
  return (
    <>
      <PageHeader
        eyebrow="Platform · Azure Service Bus"
        title="Integrations"
        description="Observe integration and domain events flowing through the modern platform. Correlation IDs link back to workflows."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
                  <div className="mt-2 font-display text-4xl tracking-tight">{s.value}</div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <div className="border-b border-border px-5 py-4 text-sm font-medium">Recent events</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Event</th>
                <th className="px-5 py-3 font-medium">Topic</th>
                <th className="px-5 py-3 font-medium">Correlation</th>
                <th className="px-5 py-3 font-medium">Attempts</th>
                <th className="px-5 py-3 font-medium">Latency</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Age</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {events.map((e) => (
                <tr key={e.id} className="hover:bg-muted/30">
                  <td className="px-5 py-3 font-mono text-xs">{e.id}</td>
                  <td className="px-5 py-3 font-mono text-xs">{e.topic}</td>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{e.correlationId}</td>
                  <td className="px-5 py-3">{e.attempts}</td>
                  <td className="px-5 py-3">{e.latencyMs}ms</td>
                  <td className="px-5 py-3">
                    <StatusChip status={e.status} />
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{e.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
