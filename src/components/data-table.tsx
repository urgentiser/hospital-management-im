import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Columns3, ChevronLeft, ChevronRight, Search, Save } from "lucide-react";
import { EmptyState } from "@/components/states";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  filterValue?: (row: T) => string;
  hidden?: boolean;
  className?: string;
}

interface SavedView {
  name: string;
  hidden: string[];
  sortKey: string | null;
  sortDir: "asc" | "desc";
  pageSize: number;
  search: string;
}

interface Props<T> {
  id: string;
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  searchPlaceholder?: string;
  headerActions?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  defaultPageSize?: number;
  toolbarFilters?: ReactNode;
}

export function DataTable<T>({
  id,
  columns,
  rows,
  rowKey,
  onRowClick,
  searchPlaceholder = "Search…",
  headerActions,
  emptyTitle = "No results",
  emptyDescription = "Try adjusting search or filters.",
  defaultPageSize = 10,
  toolbarFilters,
}: Props<T>) {
  const storageKey = `impilo.dt.${id}.v1`;

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [hidden, setHidden] = useState<Set<string>>(new Set(columns.filter((c) => c.hidden).map((c) => c.key)));
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [colsOpen, setColsOpen] = useState(false);
  const [views, setViews] = useState<SavedView[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { views: SavedView[] };
        setViews(parsed.views ?? []);
      }
    } catch { /* ignore */ }
  }, [storageKey]);

  const persistViews = (next: SavedView[]) => {
    setViews(next);
    try { localStorage.setItem(storageKey, JSON.stringify({ views: next })); } catch { /* ignore */ }
  };

  const visibleCols = columns.filter((c) => !hidden.has(c.key));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => columns.some((c) => (c.filterValue?.(r) ?? String(c.render(r) ?? "")).toString().toLowerCase().includes(q)));
  }, [rows, search, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return filtered;
    const arr = [...filtered].sort((a, b) => {
      const av = col.sortValue!(a); const bv = col.sortValue!(b);
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (key: string) => {
    if (sortKey !== key) { setSortKey(key); setSortDir("asc"); return; }
    if (sortDir === "asc") { setSortDir("desc"); return; }
    setSortKey(null);
  };

  const applyView = (v: SavedView) => {
    setHidden(new Set(v.hidden));
    setSortKey(v.sortKey);
    setSortDir(v.sortDir);
    setPageSize(v.pageSize);
    setSearch(v.search);
    setPage(1);
  };

  const saveCurrentView = () => {
    const name = prompt("Name this view");
    if (!name) return;
    persistViews([...views.filter((v) => v.name !== name), { name, hidden: [...hidden], sortKey, sortDir, pageSize, search }]);
  };

  return (
    <div className="rounded-2xl border border-border bg-card/60">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-1.5">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={searchPlaceholder}
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        {toolbarFilters}
        <div className="relative">
          <button onClick={() => setColsOpen((o) => !o)} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">
            <Columns3 className="h-3.5 w-3.5" /> Columns
          </button>
          {colsOpen && (
            <div className="absolute right-0 z-10 mt-1 w-56 rounded-xl border border-border bg-popover p-2 text-xs shadow-lg">
              {columns.map((c) => (
                <label key={c.key} className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted/50">
                  <input
                    type="checkbox"
                    checked={!hidden.has(c.key)}
                    onChange={(e) => {
                      const next = new Set(hidden);
                      if (e.target.checked) next.delete(c.key); else next.add(c.key);
                      setHidden(next);
                    }}
                  />
                  <span>{c.header}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        <button onClick={saveCurrentView} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">
          <Save className="h-3.5 w-3.5" /> Save view
        </button>
        {views.length > 0 && (
          <select
            onChange={(e) => { const v = views.find((x) => x.name === e.target.value); if (v) applyView(v); }}
            defaultValue=""
            className="rounded-lg border border-border bg-background/60 px-2 py-1.5 text-xs"
          >
            <option value="" disabled>Load view…</option>
            {views.map((v) => <option key={v.name} value={v.name}>{v.name}</option>)}
          </select>
        )}
        {headerActions}
      </div>

      <div className="overflow-x-auto">
        {pageRows.length === 0 ? (
          <div className="p-6"><EmptyState title={emptyTitle} description={emptyDescription} /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                {visibleCols.map((c) => (
                  <th key={c.key} className={"px-3 py-2 font-medium " + (c.className ?? "")}>
                    {c.sortValue ? (
                      <button onClick={() => toggleSort(c.key)} className="inline-flex items-center gap-1 hover:text-foreground">
                        {c.header}
                        {sortKey === c.key ? (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-50" />}
                      </button>
                    ) : c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={"border-b border-border/60 last:border-0 " + (onRowClick ? "cursor-pointer hover:bg-muted/40" : "")}
                >
                  {visibleCols.map((c) => (
                    <td key={c.key} className={"px-3 py-2.5 align-middle " + (c.className ?? "")}>{c.render(row)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border p-3 text-xs text-muted-foreground">
        <div>
          Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, sorted.length)} of {sorted.length}
        </div>
        <div className="flex items-center gap-2">
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="rounded-md border border-border bg-background/60 px-2 py-1">
            {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
          </select>
          <button disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-md border border-border p-1 disabled:opacity-40">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span>Page {currentPage} / {totalPages}</span>
          <button disabled={currentPage >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-md border border-border p-1 disabled:opacity-40">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
