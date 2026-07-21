import type { WorkflowItem, ModuleKey } from "@/lib/workflow-store";
import type { WorklistConfig, WorklistColumn, WorklistFilter, WorklistTone, WorklistStatusMap } from "./types";
import { getBespokeOverrides } from "./bespoke-overrides";

/**
 * Generates a production-oriented worklist config for any module.
 * Bespoke per-module overrides (columns, filters, summary tiles, saved views,
 * status map) are auto-merged from `bespoke-overrides` when registered so
 * every call site picks up the same tailored config without changing routes.
 *
 * `overrideKey` lets callers request a sub-variant (e.g. a pharmacy queue) —
 * pass `"pharmacy:dispensing"` etc.
 */
export function makeDefaultWorklist(
  moduleKey: ModuleKey,
  name: string,
  overrides: Partial<WorklistConfig> = {},
  overrideKey?: string,
): WorklistConfig {
  const bespoke = getBespokeOverrides(overrideKey ?? moduleKey) ?? {};
  const merged: Partial<WorklistConfig> = { ...bespoke, ...overrides };

  const statusMap: WorklistStatusMap = {
    draft: { label: "Draft", tone: "muted" },
    pending: { label: "Pending", tone: "warning" },
    submitted: { label: "Submitted", tone: "info" },
    active: { label: "Active", tone: "primary" },
    approved: { label: "Approved", tone: "success" },
    completed: { label: "Completed", tone: "success" },
    finalised: { label: "Finalised", tone: "success" },
    resolved: { label: "Resolved", tone: "success" },
    rejected: { label: "Rejected", tone: "destructive" },
    cancelled: { label: "Cancelled", tone: "destructive" },
    failed: { label: "Failed", tone: "destructive" },
    error: { label: "Error", tone: "destructive" },
    review: { label: "Review", tone: "warning" },
    ...merged.statusMap,
  };

  const toneFor = (status: string): WorklistTone =>
    statusMap[status]?.tone ?? "muted";

  const columns: WorklistColumn[] = merged.columns ?? [
    {
      key: "id",
      label: "Reference",
      sortable: true,
      width: "150px",
      render: (r) => <span className="font-mono text-xs">{r.id}</span>,
    },
    {
      key: "title",
      label: "Subject",
      sortable: true,
      render: (r) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{r.title}</div>
          {r.subtitle && (
            <div className="truncate text-[11px] text-muted-foreground">{r.subtitle}</div>
          )}
        </div>
      ),
    },
    {
      key: "Kind",
      label: "Type",
      render: (r) => <span className="text-xs">{String(r.fields["Kind"] ?? "—")}</span>,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (r) => {
        const cfg = statusMap[r.status] ?? { label: r.status, tone: "muted" as const };
        const tones: Record<WorklistTone, string> = {
          primary: "border-primary/30 bg-primary/10 text-primary",
          success:
            "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
          warning:
            "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
          info: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
          muted: "border-border bg-muted/60 text-muted-foreground",
          destructive:
            "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
        };
        return (
          <span
            className={
              "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium " +
              tones[toneFor(r.status)]
            }
          >
            {cfg.label}
          </span>
        );
      },
    },
    {
      key: "updatedAt",
      label: "Updated",
      sortable: true,
      render: (r) => (
        <span className="text-[11px] text-muted-foreground">
          {new Date(r.updatedAt || r.createdAt).toLocaleString("en-ZA")}
        </span>
      ),
    },
  ];

  const filters: WorklistFilter[] = merged.filters ?? [
    {
      key: "status",
      label: "Status",
      kind: "select",
      options: Object.keys(statusMap).map((s) => ({ value: s, label: statusMap[s].label })),
    },
    { key: "Kind", label: "Type", kind: "text", placeholder: "Filter by kind" },
    { key: "updated", label: "Updated between", kind: "date-range" },
  ];

  const summary =
    merged.summary ??
    ((items: WorkflowItem[]) => {
      const open = items.filter(
        (i) => !["completed", "finalised", "resolved", "cancelled", "rejected"].includes(i.status),
      ).length;
      const done = items.filter((i) =>
        ["completed", "finalised", "resolved", "approved"].includes(i.status),
      ).length;
      const attention = items.filter((i) =>
        ["failed", "error", "rejected", "review"].includes(i.status),
      ).length;
      return [
        { label: "Open", value: open, tone: "primary" as const },
        { label: "Completed", value: done, tone: "success" as const },
        { label: "Needs attention", value: attention, tone: "destructive" as const },
        { label: "Total", value: items.length, tone: "muted" as const },
      ];
    });

  return {
    moduleKey,
    name,
    tagline: `All ${name.toLowerCase()} activity across the active facility.`,
    exportable: true,
    defaultSortBy: "updatedAt",
    defaultSortDir: "desc",
    pageSize: 25,
    statusMap,
    columns,
    filters,
    summary,
    savedViews: merged.savedViews ?? [
      { key: "open", label: "Open items", description: "Anything not yet closed.", filters: {} },
      { key: "attention", label: "Needs attention", description: "Failures, rejections and review flags.", filters: { status: "failed" } },
    ],
    rowActions: merged.rowActions ?? [
      { key: "open", label: "Open in guided workflow", launchesGuidedWorkflow: true, permission: "view" },
      { key: "note", label: "Add note", permission: "note" },
    ],
    ...merged,
  };
}
