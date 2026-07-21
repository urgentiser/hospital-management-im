import { useMemo, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Search, Filter, RefreshCw, Download, LayoutGrid, ChevronDown, ChevronUp,
  MoreHorizontal, AlertCircle, Inbox, Bookmark, X, Loader2,
} from "lucide-react";
import { Card } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getModuleService } from "@/services/modules/registry";
import { useFacilityContext } from "@/lib/facility-context";
import { useAuth } from "@/security/auth-provider";
import { getDefaultModulePermissions } from "@/security/module-permissions";
import { hasPermission } from "@/security/permissions";
import { useWorklistSelection } from "@/lib/worklist-selection";
import { useWorklistViewStore } from "@/lib/worklist-view-store";
import type { WorkflowItem } from "@/lib/workflow-store";
import type { WorklistAction, WorklistConfig, WorklistFilter, WorklistTone } from "./types";

// -------- utilities --------

const toneClasses: Record<WorklistTone, string> = {
  primary: "border-primary/30 bg-primary/10 text-primary",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  destructive: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  muted: "border-border bg-muted/60 text-muted-foreground",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
};

export function WorklistStatusChip({ status, config }: { status: string; config?: WorklistConfig }) {
  const mapped = config?.statusMap?.[status];
  const tone: WorklistTone = mapped?.tone ?? "muted";
  const label = mapped?.label ?? status;
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium " +
        toneClasses[tone]
      }
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}

function useDebounced<T>(value: T, delay = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

function matchesText(row: WorkflowItem, q: string): boolean {
  if (!q) return true;
  const hay = [row.id, row.title, row.subtitle ?? "", row.status,
    ...Object.values(row.fields ?? {}).map(String)].join(" ").toLowerCase();
  return hay.includes(q.toLowerCase());
}

function matchesFilters(row: WorkflowItem, filters: Record<string, unknown>, defs: WorklistFilter[]): boolean {
  for (const def of defs) {
    const v = filters[def.key];
    if (v === undefined || v === "" || v === null) continue;
    if (def.kind === "select") {
      const rowVal = String(row.fields[def.label] ?? row.fields[def.key] ?? row.status).toLowerCase();
      if (rowVal !== String(v).toLowerCase()) return false;
    } else if (def.kind === "multiselect" && Array.isArray(v) && v.length) {
      const rowVal = String(row.fields[def.label] ?? row.fields[def.key] ?? row.status).toLowerCase();
      if (!v.map((x) => String(x).toLowerCase()).includes(rowVal)) return false;
    } else if (def.kind === "text") {
      const rowVal = String(row.fields[def.label] ?? row.fields[def.key] ?? "").toLowerCase();
      if (!rowVal.includes(String(v).toLowerCase())) return false;
    } else if (def.kind === "date-range" && typeof v === "object") {
      const range = v as { from?: string; to?: string };
      const at = new Date(row.updatedAt || row.createdAt).getTime();
      if (range.from && at < new Date(range.from).getTime()) return false;
      if (range.to && at > new Date(range.to).getTime()) return false;
    } else if (def.kind === "boolean" && v === true) {
      const rowVal = row.fields[def.label] ?? row.fields[def.key];
      if (!rowVal) return false;
    }
  }
  return true;
}

// -------- component --------

type Props = {
  config: WorklistConfig;
  onOpenGuidedWorkflow?: () => void;
};

export function ModuleWorklist({ config, onOpenGuidedWorkflow }: Props) {
  const queryClient = useQueryClient();
  const { principal } = useAuth();
  const activeFacility = useFacilityContext((s) => s.facility);
  const perms = getDefaultModulePermissions(config.moduleKey);
  const service = getModuleService(config.moduleKey);
  const selectSelection = useWorklistSelection((s) => s.select);

  const pageSize = config.pageSize ?? 25;
  const viewState = useWorklistViewStore((s) => s.byModule[config.moduleKey]);
  const updateView = useWorklistViewStore((s) => s.update);
  const resetView = useWorklistViewStore((s) => s.reset);

  const search = viewState?.search ?? "";
  const filters = viewState?.filters ?? {};
  const page = viewState?.page ?? 1;
  const sortBy = viewState?.sortBy ?? config.defaultSortBy;
  const sortDir: "asc" | "desc" = viewState?.sortDir ?? config.defaultSortDir ?? "desc";
  const density: "comfortable" | "compact" = viewState?.density ?? "comfortable";

  const debouncedSearch = useDebounced(search, 300);

  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [detailRow, setDetailRow] = useState<WorkflowItem | null>(null);
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [pendingAction, setPendingAction] = useState<{ row: WorkflowItem; action: WorklistAction } | null>(null);

  const [visibleCols, setVisibleCols] = useState<Set<string>>(
    () => new Set(
      viewState?.visibleCols
        ?? config.columns.filter((c) => c.defaultVisible !== false).map((c) => c.key),
    ),
  );

  const setSearch = (v: string) => updateView(config.moduleKey, { search: v, page: 1 });
  const setPage = (updater: number | ((p: number) => number)) => {
    const next = typeof updater === "function" ? (updater as (p: number) => number)(page) : updater;
    updateView(config.moduleKey, { page: next });
  };
  const setSortBy = (v: string | undefined) => updateView(config.moduleKey, { sortBy: v, page: 1 });
  const setSortDir = (updater: "asc" | "desc" | ((d: "asc" | "desc") => "asc" | "desc")) => {
    const next = typeof updater === "function" ? (updater as (d: "asc" | "desc") => "asc" | "desc")(sortDir) : updater;
    updateView(config.moduleKey, { sortDir: next });
  };
  const setFilters = (
    updater: Record<string, unknown> | ((prev: Record<string, unknown>) => Record<string, unknown>),
  ) => {
    const next = typeof updater === "function" ? (updater as (p: Record<string, unknown>) => Record<string, unknown>)(filters) : updater;
    updateView(config.moduleKey, { filters: next, page: 1 });
  };
  const setDensity = (updater: "comfortable" | "compact" | ((d: "comfortable" | "compact") => "comfortable" | "compact")) => {
    const next = typeof updater === "function" ? (updater as (d: "comfortable" | "compact") => "comfortable" | "compact")(density) : updater;
    updateView(config.moduleKey, { density: next });
  };

  useEffect(() => {
    updateView(config.moduleKey, { visibleCols: Array.from(visibleCols) });
  }, [visibleCols, config.moduleKey, updateView]);

  const queryKey = useMemo(
    () => ["worklist", config.moduleKey, {
      search: debouncedSearch, filters, page, pageSize, sortBy, sortDir, facility: activeFacility,
    }] as const,
    [config.moduleKey, debouncedSearch, filters, page, pageSize, sortBy, sortDir, activeFacility],
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: ({ signal }) => service.listRecords(
      {
        search: debouncedSearch || undefined,
        page, pageSize, sortBy, sortDirection: sortDir,
        facilityId: activeFacility || undefined,
      },
      signal,
    ),
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  });

  const paged: WorkflowItem[] = data?.items ?? [];
  const totalItems = data?.totalItems ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const safePage = Math.min(Math.max(1, page), totalPages);

  useEffect(() => { if (page !== safePage) setPage(safePage); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [page, safePage]);

  const summary = config.summary?.(paged) ?? [];
  const visibleColumns = config.columns.filter((c) => visibleCols.has(c.key));

  const toggleSort = (key: string) => {
    if (sortBy !== key) { setSortBy(key); setSortDir("asc"); return; }
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  };

  const applySavedView = (viewKey: string) => {
    const view = config.savedViews?.find((v) => v.key === viewKey);
    if (!view) return;
    setFilters(view.filters as Record<string, unknown>);
    setPage(1);
    toast.success(`Applied view: ${view.label}`);
  };

  const runAction = async (row: WorkflowItem, action: WorklistAction, reason?: string) => {
    if (action.launchesGuidedWorkflow) {
      selectSelection({
        moduleKey: config.moduleKey,
        record: row,
        actionKey: action.key,
        targetStep: action.targetStep,
        prefill: extractPrefill(row),
      });
      onOpenGuidedWorkflow?.();
      return;
    }
    if (action.permission && !hasPermission(principal, perms[action.permission])) {
      toast.error("You don't have permission for this action.");
      return;
    }
    try {
      await service.transitionRecord(row.id, action.key, reason);
      toast.success(`${action.label} · ${row.id}`);
      queryClient.invalidateQueries({ queryKey: ["worklist", config.moduleKey] });
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "The action could not be completed.");
    }
  };

  const rowActionsFor = (row: WorkflowItem): WorklistAction[] => {
    return (config.rowActions ?? []).filter((a) => {
      if (a.visibleWhen && !a.visibleWhen(row)) return false;
      if (a.permission && !hasPermission(principal, perms[a.permission])) return false;
      return true;
    });
  };

  const exportCsv = () => {
    const cols = visibleColumns;
    const header = cols.map((c) => c.label).join(",");
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = paged.map((r) => cols.map((c) => escape(String(
      c.render ? textOf(c.render(r)) : (r.fields[c.key] ?? r[c.key as keyof WorkflowItem] ?? ""),
    ))).join(","));
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${config.moduleKey}-worklist.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header row: name + tagline + saved-views */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Worklist</div>
          <h3 className="mt-0.5 font-display text-lg tracking-tight">{config.name}</h3>
          {config.tagline && <p className="text-xs text-muted-foreground">{config.tagline}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {config.savedViews && config.savedViews.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Bookmark className="h-3.5 w-3.5" /> Saved views <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Apply a view</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {config.savedViews.map((v) => (
                  <DropdownMenuItem key={v.key} onSelect={() => applySavedView(v.key)}>
                    <div>
                      <div className="text-sm">{v.label}</div>
                      {v.description && <div className="text-[11px] text-muted-foreground">{v.description}</div>}
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => { setFilters({}); setPage(1); toast.success("Filters reset"); }}>
                  <X className="mr-2 h-3.5 w-3.5" /> Reset filters
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <LayoutGrid className="h-3.5 w-3.5" /> Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {config.columns.map((c) => (
                <DropdownMenuCheckboxItem
                  key={c.key}
                  checked={visibleCols.has(c.key)}
                  onCheckedChange={(checked) => {
                    setVisibleCols((prev) => {
                      const next = new Set(prev);
                      if (checked) next.add(c.key); else next.delete(c.key);
                      return next;
                    });
                  }}
                >
                  {c.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={() => setDensity((d) => (d === "compact" ? "comfortable" : "compact"))}>
            {density === "compact" ? "Comfortable" : "Compact"}
          </Button>
          {config.exportable && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCsv} disabled={!paged.length}>
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => refetch()}>
            <RefreshCw className={"h-3.5 w-3.5 " + (isFetching ? "animate-spin" : "")} /> Refresh
          </Button>
        </div>
      </div>

      {/* Summary tiles */}
      {summary.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {summary.map((s) => (
            <Card key={s.label} className="p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{s.label}</div>
              <div className="mt-1 font-display text-2xl tracking-tight">{s.value}</div>
              {s.tone && (
                <div className={"mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] " + toneClasses[s.tone]}>
                  live
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={`Search ${config.name.toLowerCase()}…`}
              className="h-9 pl-8"
              aria-label={`Search ${config.name}`}
            />
          </div>
          {config.filters && config.filters.length > 0 && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setFilterDrawerOpen(true)}>
              <Filter className="h-3.5 w-3.5" />
              Filters
              {Object.values(filters).filter((v) => v !== undefined && v !== "" && !(Array.isArray(v) && !v.length)).length > 0 && (
                <span className="ml-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  {Object.values(filters).filter((v) => v !== undefined && v !== "" && !(Array.isArray(v) && !v.length)).length}
                </span>
              )}
            </Button>
          )}
          {activeFacility && (
            <span className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground">
              Facility: <span className="text-foreground">{activeFacility}</span>
            </span>
          )}
          {selection.size > 0 && config.bulkActions && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">{selection.size} selected</span>
              {config.bulkActions.map((a) => (
                <Button key={a.key} size="sm" variant={a.destructive ? "destructive" : "outline"}
                  onClick={() => toast.info(`${a.label} · ${selection.size} rows`)}>
                  {a.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur">
              <tr>
                {config.bulkActions && (
                  <th className="w-10 px-3 py-2 text-left">
                    <Checkbox
                      aria-label="Select all"
                      checked={paged.length > 0 && paged.every((r) => selection.has(r.id))}
                      onCheckedChange={(checked) => {
                        setSelection((prev) => {
                          const next = new Set(prev);
                          if (checked) paged.forEach((r) => next.add(r.id));
                          else paged.forEach((r) => next.delete(r.id));
                          return next;
                        });
                      }}
                    />
                  </th>
                )}
                {visibleColumns.map((c) => (
                  <th key={c.key}
                    className={"px-3 py-2 text-left text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground " + (c.align === "right" ? "text-right" : "")}
                    style={c.width ? { width: c.width } : undefined}
                  >
                    {c.sortable ? (
                      <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort(c.key)}>
                        {c.label}
                        {sortBy === c.key && (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                      </button>
                    ) : c.label}
                  </th>
                ))}
                <th className="w-12 px-3 py-2" aria-label="Row actions" />
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`skel-${i}`} className="border-b border-border/60">
                    {config.bulkActions && <td className="px-3 py-3"><Skeleton className="h-4 w-4" /></td>}
                    {visibleColumns.map((c) => (
                      <td key={c.key} className="px-3 py-3"><Skeleton className="h-4 w-24" /></td>
                    ))}
                    <td className="px-3 py-3"><Skeleton className="h-4 w-4" /></td>
                  </tr>
                ))
              )}
              {!isLoading && isError && (
                <tr><td colSpan={visibleColumns.length + 2}>
                  <div className="flex flex-col items-center gap-2 py-14 text-center">
                    <AlertCircle className="h-7 w-7 text-destructive" />
                    <div className="text-sm font-medium">Could not load {config.name.toLowerCase()}.</div>
                    <div className="text-xs text-muted-foreground">{error instanceof Error ? error.message : "Please retry."}</div>
                    <Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
                  </div>
                </td></tr>
              )}
              {!isLoading && !isError && paged.length === 0 && (
                <tr><td colSpan={visibleColumns.length + 2}>
                  <div className="flex flex-col items-center gap-2 py-14 text-center">
                    <div className="grid h-11 w-11 place-items-center rounded-full bg-muted text-muted-foreground">
                      <Inbox className="h-5 w-5" />
                    </div>
                    <div className="text-sm font-medium">No records match your filters.</div>
                    <div className="text-xs text-muted-foreground">Adjust filters or start a new workflow.</div>
                    {onOpenGuidedWorkflow && (
                      <Button size="sm" variant="outline" onClick={onOpenGuidedWorkflow}>Open guided workflow</Button>
                    )}
                  </div>
                </td></tr>
              )}
              {!isLoading && !isError && paged.map((row) => {
                const actions = rowActionsFor(row);
                return (
                  <tr key={row.id}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter") setDetailRow(row); }}
                    className={"cursor-pointer border-b border-border/60 outline-none transition-colors hover:bg-muted/30 focus-visible:bg-muted/50 " +
                      (density === "compact" ? "" : "")}
                  >
                    {config.bulkActions && (
                      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selection.has(row.id)}
                          onCheckedChange={(checked) => {
                            setSelection((prev) => {
                              const next = new Set(prev);
                              if (checked) next.add(row.id); else next.delete(row.id);
                              return next;
                            });
                          }}
                          aria-label={`Select ${row.id}`}
                        />
                      </td>
                    )}
                    {visibleColumns.map((c) => (
                      <td key={c.key}
                        onClick={() => setDetailRow(row)}
                        className={"px-3 " + (density === "compact" ? "py-1.5" : "py-2.5") + " " + (c.align === "right" ? "text-right" : "")}
                      >
                        {c.render ? c.render(row) : String(row.fields[c.key] ?? row[c.key as keyof WorkflowItem] ?? "—")}
                      </td>
                    ))}
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" aria-label="Row actions">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onSelect={() => setDetailRow(row)}>Open</DropdownMenuItem>
                          {actions.length > 0 && <DropdownMenuSeparator />}
                          {actions.map((a) => (
                            <DropdownMenuItem
                              key={a.key}
                              className={a.destructive ? "text-destructive focus:text-destructive" : ""}
                              onSelect={() => {
                                if (a.requiresReason || a.destructive) setPendingAction({ row, action: a });
                                else runAction(row, a);
                              }}
                            >
                              {a.icon && <a.icon className="mr-2 h-3.5 w-3.5" />} {a.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2 text-xs text-muted-foreground">
          <div>
            {totalItems === 0 ? "0 results" : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, totalItems)} of ${totalItems}`}
            {isFetching && <Loader2 className="ml-2 inline h-3 w-3 animate-spin" />}
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => setPage(1)} disabled={safePage <= 1}>First</Button>
            <Button size="sm" variant="ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1}>Prev</Button>
            <span className="px-2">Page {safePage} of {totalPages}</span>
            <Button size="sm" variant="ghost" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}>Next</Button>
            <Button size="sm" variant="ghost" onClick={() => setPage(totalPages)} disabled={safePage >= totalPages}>Last</Button>
          </div>
        </div>
      </Card>

      {/* Filter drawer */}
      <Sheet open={filterDrawerOpen} onOpenChange={setFilterDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Filter {config.name}</SheetTitle>
            <SheetDescription>Refine the worklist to what you need to action.</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            {config.filters?.map((f) => (
              <FilterField key={f.key} def={f}
                value={filters[f.key]}
                onChange={(v) => setFilters((prev) => ({ ...prev, [f.key]: v }))}
              />
            ))}
          </div>
          <SheetFooter className="mt-6 flex-row justify-between gap-2">
            <Button variant="outline" onClick={() => { setFilters({}); setPage(1); }}>Reset</Button>
            <Button onClick={() => { setPage(1); setFilterDrawerOpen(false); }}>Apply</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Detail drawer */}
      <Sheet open={!!detailRow} onOpenChange={(o) => !o && setDetailRow(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          {detailRow && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <span>{detailRow.title}</span>
                  <WorklistStatusChip status={detailRow.status} config={config} />
                </SheetTitle>
                <SheetDescription>
                  <span className="font-mono">{detailRow.id}</span>
                  {detailRow.subtitle ? ` · ${detailRow.subtitle}` : ""}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Details</div>
                  <dl className="mt-2 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 text-sm">
                    {Object.entries(detailRow.fields).slice(0, 10).map(([k, v]) => (
                      <div key={k} className="contents">
                        <dt className="text-muted-foreground">{k}</dt>
                        <dd className="truncate">{String(v)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Timeline</div>
                  <ol className="mt-2 space-y-1.5 text-xs">
                    {(detailRow.history ?? []).map((h, i) => (
                      <li key={i} className="rounded-md border border-border/60 bg-muted/20 p-2">
                        <div className="font-medium text-foreground">{h.action}</div>
                        <div className="text-muted-foreground">{h.at} · {h.by}{h.note ? ` · ${h.note}` : ""}</div>
                      </li>
                    ))}
                  </ol>
                </div>
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Actions</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {rowActionsFor(detailRow).map((a) => (
                      <Button key={a.key} size="sm" variant={a.destructive ? "destructive" : "outline"}
                        onClick={() => {
                          setDetailRow(null);
                          if (a.requiresReason || a.destructive) setPendingAction({ row: detailRow, action: a });
                          else runAction(detailRow, a);
                        }}
                      >
                        {a.icon && <a.icon className="mr-1.5 h-3.5 w-3.5" />} {a.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Reason / confirmation dialog */}
      <ReasonDialog
        pending={pendingAction}
        onClose={() => setPendingAction(null)}
        onConfirm={async (reason) => {
          if (!pendingAction) return;
          await runAction(pendingAction.row, pendingAction.action, reason);
          setPendingAction(null);
        }}
      />
    </div>
  );
}

function extractPrefill(row: WorkflowItem): Record<string, string> {
  const out: Record<string, string> = { id: row.id, title: row.title };
  for (const [k, v] of Object.entries(row.fields ?? {})) out[k.toLowerCase().replace(/\s+/g, "")] = String(v);
  return out;
}

function textOf(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join(" ");
  if (typeof node === "object" && "props" in (node as { props?: { children?: React.ReactNode } })) {
    return textOf((node as { props: { children?: React.ReactNode } }).props.children);
  }
  return "";
}

function FilterField({ def, value, onChange }: { def: WorklistFilter; value: unknown; onChange: (v: unknown) => void }) {
  if (def.kind === "text") {
    return (
      <div className="space-y-1.5">
        <Label>{def.label}</Label>
        <Input value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={def.placeholder} />
      </div>
    );
  }
  if (def.kind === "select") {
    return (
      <div className="space-y-1.5">
        <Label>{def.label}</Label>
        <Select value={(value as string) ?? ""} onValueChange={(v) => onChange(v === "__any__" ? "" : v)}>
          <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__any__">Any</SelectItem>
            {def.options?.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    );
  }
  if (def.kind === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={!!value} onCheckedChange={(c) => onChange(!!c)} /> {def.label}
      </label>
    );
  }
  if (def.kind === "date-range") {
    const v = (value as { from?: string; to?: string }) ?? {};
    const invalid = v.from && v.to && new Date(v.from) > new Date(v.to);
    return (
      <div className="space-y-1.5">
        <Label>{def.label}</Label>
        <div className="flex items-center gap-2">
          <Input type="date" value={v.from ?? ""} onChange={(e) => onChange({ ...v, from: e.target.value })} />
          <span className="text-xs text-muted-foreground">to</span>
          <Input type="date" value={v.to ?? ""} onChange={(e) => onChange({ ...v, to: e.target.value })} />
        </div>
        {invalid && <div className="text-[11px] text-destructive">Start date must be before end date.</div>}
      </div>
    );
  }
  return null;
}

function ReasonDialog({
  pending, onClose, onConfirm,
}: {
  pending: { row: WorkflowItem; action: WorklistAction } | null;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!pending) setReason(""); }, [pending]);
  const requiresReason = pending?.action.requiresReason || pending?.action.destructive;
  const disabled = busy || (requiresReason && !reason.trim());
  return (
    <Dialog open={!!pending} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{pending?.action.label}</DialogTitle>
          <DialogDescription>
            {pending?.row.title} · <span className="font-mono">{pending?.row.id}</span>
          </DialogDescription>
        </DialogHeader>
        {requiresReason && (
          <div className="space-y-1.5">
            <Label>Reason {pending?.action.destructive && <span className="text-destructive">*</span>}</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Provide a reason (required)" />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button
            variant={pending?.action.destructive ? "destructive" : "default"}
            disabled={disabled}
            onClick={async () => { setBusy(true); try { await onConfirm(reason); } finally { setBusy(false); } }}
          >
            {busy ? "Working…" : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
