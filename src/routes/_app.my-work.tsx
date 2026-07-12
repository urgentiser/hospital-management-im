import { createFileRoute } from "@tanstack/react-router";
import { Briefcase } from "lucide-react";
import { PageHeader, StatusChip, Card } from "@/components/app-shell";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { MOCK_TASKS, type TaskItem } from "@/lib/mock/tasks";
import { formatSADateTime } from "@/rules/formatting";
import { useAuth } from "@/lib/auth/auth-context";

export const Route = createFileRoute("/_app/my-work")({
  head: () => ({ meta: [{ title: "My Work — Impilo" }] }),
  component: MyWork,
});

function MyWork() {
  const { session } = useAuth();
  const rows = MOCK_TASKS;

  const columns: DataTableColumn<TaskItem>[] = [
    { key: "title", header: "Task", filterValue: (r) => `${r.title} ${r.module}`, render: (r) => (
      <div>
        <div className="font-medium">{r.title}</div>
        <div className="text-[11px] text-muted-foreground">{r.module}{r.patient ? ` · ${r.patient}` : ""}</div>
      </div>
    ) },
    { key: "priority", header: "Priority", sortValue: (r) => ["Low","Medium","High","Urgent"].indexOf(r.priority), render: (r) => <span className="text-xs">{r.priority}</span> },
    { key: "due", header: "Due", sortValue: (r) => r.dueAt, render: (r) => <span className="text-xs">{formatSADateTime(r.dueAt)}</span> },
    { key: "status", header: "Status", render: (r) => <StatusChip status={r.status} /> },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Overview · My Work"
        title="My Work"
        description={`Tasks and queues assigned to ${session?.user.displayName ?? "you"}.`}
      />
      <Card className="mb-4 flex items-center gap-2 p-3 text-xs text-muted-foreground">
        <Briefcase className="h-4 w-4 text-primary" />
        <span>{rows.length} tasks in your queue</span>
      </Card>
      <DataTable id="mywork" columns={columns} rows={rows} rowKey={(t) => t.id} searchPlaceholder="Search tasks…" />
    </>
  );
}
