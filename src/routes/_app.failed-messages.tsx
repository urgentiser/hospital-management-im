import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { RefreshCw, Trash2 } from "lucide-react";
import { PageHeader, StatusChip, Card } from "@/components/app-shell";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { PermissionGate } from "@/components/permission-gate";
import { MOCK_MESSAGES, type ServiceBusMessage } from "@/lib/mock/integrations";
import { formatSADateTime } from "@/rules/formatting";

export const Route = createFileRoute("/_app/failed-messages")({
  head: () => ({ meta: [{ title: "Failed Messages — Impilo" }] }),
  component: FailedMessages,
});

function FailedMessages() {
  const rows = MOCK_MESSAGES.filter((m) => m.status === "deadletter" || (m.status === "retry" && m.retryCount >= 3));

  const columns: DataTableColumn<ServiceBusMessage>[] = [
    { key: "id", header: "Message", filterValue: (r) => `${r.messageId} ${r.correlationId}`, render: (r) => (
      <div className="font-mono text-[11px]">
        <div>{r.messageId}</div>
        <div className="text-muted-foreground">corr {r.correlationId}</div>
      </div>
    ) },
    { key: "topic", header: "Topic", sortValue: (r) => r.topic, render: (r) => <span className="text-xs">{r.topic}</span> },
    { key: "retry", header: "Retries", sortValue: (r) => r.retryCount, render: (r) => <span className="text-xs">{r.retryCount}</span> },
    { key: "error", header: "Error", render: (r) => (
      <div>
        <div className="text-[11px] font-medium text-destructive">{r.errorType}</div>
        <div className="text-[10px] text-muted-foreground">{r.errorSummary}</div>
      </div>
    ) },
    { key: "at", header: "Enqueued", sortValue: (r) => r.timestamp, render: (r) => <span className="text-xs text-muted-foreground">{formatSADateTime(r.timestamp)}</span> },
    { key: "state", header: "Status", render: (r) => <StatusChip status={r.status} /> },
    { key: "actions", header: "Actions", render: (r) => (
      <div className="flex items-center gap-1">
        <PermissionGate permission="failed-messages:retry">
          <button onClick={() => toast.success("Retry queued", { description: r.messageId })} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px]"><RefreshCw className="h-3 w-3" /> Retry</button>
        </PermissionGate>
        <PermissionGate permission="failed-messages:purge">
          <button onClick={() => toast.info("Purged", { description: r.messageId })} className="inline-flex items-center gap-1 rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1 text-[11px] text-destructive"><Trash2 className="h-3 w-3" /> Purge</button>
        </PermissionGate>
      </div>
    ) },
  ];

  return (
    <>
      <PageHeader eyebrow="Platform · Failed Messages" title="Failed messages" description="Retry, inspect or purge messages that reached the dead-letter queue." />
      <Card className="mb-4 flex items-center gap-2 p-3 text-xs text-muted-foreground">
        {rows.length} failed / dead-lettered message{rows.length === 1 ? "" : "s"}
      </Card>
      <DataTable id="failed" columns={columns} rows={rows} rowKey={(r) => r.messageId} searchPlaceholder="Search by message ID, correlation ID or topic…" />
    </>
  );
}
