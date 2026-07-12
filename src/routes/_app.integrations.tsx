import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Copy, RefreshCw, EyeOff, Download, GitBranch, Filter, Activity } from "lucide-react";
import { PageHeader, StatusChip, Card } from "@/components/app-shell";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { PermissionGate } from "@/components/permission-gate";
import { MOCK_MESSAGES, type ServiceBusMessage } from "@/lib/mock/integrations";
import { formatSADateTime } from "@/rules/formatting";

export const Route = createFileRoute("/_app/integrations")({
  head: () => ({
    meta: [
      { title: "Integration Monitor — Impilo" },
      { name: "description", content: "Azure Service Bus messages with retry, correlation and payload inspection." },
    ],
  }),
  component: IntegrationsMonitor,
});

function IntegrationsMonitor() {
  const [status, setStatus] = useState<string>("");
  const [topic, setTopic] = useState<string>("");
  const [selected, setSelected] = useState<ServiceBusMessage | null>(null);

  const topics = useMemo(() => Array.from(new Set(MOCK_MESSAGES.map((m) => m.topic))).sort(), []);
  const rows = useMemo(
    () => MOCK_MESSAGES.filter((m) => (!status || m.status === status) && (!topic || m.topic === topic)),
    [status, topic],
  );

  const kpis = useMemo(() => {
    const total = MOCK_MESSAGES.length;
    const delivered = MOCK_MESSAGES.filter((m) => m.status === "delivered").length;
    const retry = MOCK_MESSAGES.filter((m) => m.status === "retry").length;
    const dead = MOCK_MESSAGES.filter((m) => m.status === "deadletter").length;
    return { total, delivered, retry, dead };
  }, []);

  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copied", { description: text }); };

  const columns: DataTableColumn<ServiceBusMessage>[] = [
    {
      key: "messageId", header: "Message ID",
      sortValue: (r) => r.messageId, filterValue: (r) => `${r.messageId} ${r.correlationId}`,
      render: (r) => (
        <button onClick={() => setSelected(r)} className="text-left">
          <div className="font-mono text-[11px] text-foreground">{r.messageId}</div>
          <div className="font-mono text-[10px] text-muted-foreground">corr {r.correlationId}</div>
        </button>
      ),
    },
    { key: "topic", header: "Topic / Queue", sortValue: (r) => r.topic, render: (r) => <span className="text-xs">{r.topic}</span> },
    { key: "sub", header: "Subscription", sortValue: (r) => r.subscription, render: (r) => <span className="text-xs text-muted-foreground">{r.subscription}</span> },
    { key: "route", header: "Source → Target", render: (r) => <span className="text-xs">{r.source} → {r.target}</span> },
    { key: "entity", header: "Entity", sortValue: (r) => r.entityType, render: (r) => <span className="text-xs">{r.entityType}</span> },
    { key: "ts", header: "Timestamp", sortValue: (r) => r.timestamp, render: (r) => <span className="text-xs text-muted-foreground">{formatSADateTime(r.timestamp)}</span> },
    { key: "retry", header: "Retries", sortValue: (r) => r.retryCount, render: (r) => <span className="text-xs">{r.retryCount}</span> },
    { key: "latency", header: "Latency", sortValue: (r) => r.latencyMs, render: (r) => <span className="text-xs">{r.latencyMs} ms</span> },
    { key: "error", header: "Error", render: (r) => r.errorType ? (
      <div>
        <div className="text-[11px] font-medium text-destructive">{r.errorType}</div>
        <div className="text-[10px] text-muted-foreground">{r.errorSummary}</div>
      </div>
    ) : <span className="text-xs text-muted-foreground">—</span> },
    { key: "status", header: "Status", sortValue: (r) => r.status, render: (r) => <StatusChip status={r.status} /> },
    {
      key: "actions", header: "Actions",
      render: (r) => (
        <div className="flex items-center gap-1">
          <button onClick={() => setSelected(r)} title="Review" className="rounded-md border border-border p-1 hover:bg-muted/50"><Activity className="h-3 w-3" /></button>
          <PermissionGate permission="integrations:retry">
            <button onClick={() => toast.success("Retry queued", { description: r.messageId })} title="Retry" className="rounded-md border border-border p-1 hover:bg-muted/50"><RefreshCw className="h-3 w-3" /></button>
          </PermissionGate>
          <PermissionGate permission="integrations:ignore">
            <button onClick={() => toast.info("Message ignored")} title="Ignore" className="rounded-md border border-border p-1 hover:bg-muted/50"><EyeOff className="h-3 w-3" /></button>
          </PermissionGate>
          <button onClick={() => copy(r.correlationId)} title="Copy correlation ID" className="rounded-md border border-border p-1 hover:bg-muted/50"><Copy className="h-3 w-3" /></button>
          <PermissionGate permission="integrations:download-error">
            <button
              onClick={() => {
                const blob = new Blob([JSON.stringify(r, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a"); a.href = url; a.download = `${r.messageId}.json`; a.click();
                URL.revokeObjectURL(url);
              }}
              title="Download error payload" className="rounded-md border border-border p-1 hover:bg-muted/50"
            ><Download className="h-3 w-3" /></button>
          </PermissionGate>
          <button onClick={() => setSelected(r)} title="View timeline" className="rounded-md border border-border p-1 hover:bg-muted/50"><GitBranch className="h-3 w-3" /></button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Platform · Integration Monitor"
        title="Azure Service Bus Monitor"
        description="Track messages, retries and dead-letters across topics and subscriptions."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total messages" value={kpis.total} />
        <Kpi label="Delivered" value={kpis.delivered} tone="success" />
        <Kpi label="Retrying" value={kpis.retry} tone="warning" />
        <Kpi label="Dead-letter" value={kpis.dead} tone="danger" />
      </div>

      <DataTable
        id="integrations"
        columns={columns}
        rows={rows}
        rowKey={(m) => m.messageId}
        searchPlaceholder="Search by message ID, correlation ID or topic…"
        toolbarFilters={
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-border bg-background/60 px-2 py-1.5 text-xs">
              <option value="">All statuses</option>
              {["delivered", "pending", "retry", "deadletter", "ignored"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={topic} onChange={(e) => setTopic(e.target.value)} className="rounded-lg border border-border bg-background/60 px-2 py-1.5 text-xs">
              <option value="">All topics</option>
              {topics.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        }
      />

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setSelected(null)}>
          <div onClick={(e) => e.stopPropagation()} className="h-full w-full max-w-lg overflow-y-auto border-l border-border bg-background p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Message</div>
                <div className="font-mono text-xs">{selected.messageId}</div>
              </div>
              <StatusChip status={selected.status} />
            </div>

            <dl className="grid grid-cols-2 gap-3 text-xs">
              <Detail label="Correlation ID" value={selected.correlationId} />
              <Detail label="Topic" value={selected.topic} />
              <Detail label="Subscription" value={selected.subscription} />
              <Detail label="Source" value={selected.source} />
              <Detail label="Target" value={selected.target} />
              <Detail label="Entity" value={selected.entityType} />
              <Detail label="Timestamp" value={formatSADateTime(selected.timestamp)} />
              <Detail label="Retry count" value={String(selected.retryCount)} />
              <Detail label="Latency" value={`${selected.latencyMs} ms`} />
              {selected.errorType && <Detail label="Error" value={`${selected.errorType} — ${selected.errorSummary}`} />}
            </dl>

            <div className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Payload metadata</div>
            <pre className="mt-1 max-h-96 overflow-auto rounded-lg border border-border bg-muted/30 p-3 text-[11px]">{JSON.stringify(selected.payload, null, 2)}</pre>

            <div className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Timeline</div>
            <ol className="relative mt-2 space-y-3 border-l border-border pl-4 text-xs">
              <li className="relative"><span className="absolute -left-[19px] top-1.5 h-2 w-2 rounded-full bg-primary" />Enqueued at {formatSADateTime(selected.timestamp)} by {selected.source}</li>
              {selected.retryCount > 0 && <li className="relative"><span className="absolute -left-[19px] top-1.5 h-2 w-2 rounded-full bg-amber-500" />Retried {selected.retryCount} time(s)</li>}
              {selected.status === "delivered" && <li className="relative"><span className="absolute -left-[19px] top-1.5 h-2 w-2 rounded-full bg-emerald-500" />Delivered to {selected.target} in {selected.latencyMs} ms</li>}
              {selected.status === "deadletter" && <li className="relative"><span className="absolute -left-[19px] top-1.5 h-2 w-2 rounded-full bg-destructive" />Moved to dead-letter</li>}
            </ol>
          </div>
        </div>
      )}
    </>
  );
}

function Kpi({ label, value, tone = "muted" }: { label: string; value: number; tone?: "muted" | "success" | "warning" | "danger" }) {
  const toneClass = { muted: "text-foreground", success: "text-success", warning: "text-warning", danger: "text-destructive" }[tone];
  return (
    <Card className="p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={"mt-1 font-display text-2xl " + toneClass}>{value}</div>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-mono text-[11px]">{value}</div>
    </div>
  );
}
