import type { PagedQuery, PagedResult, WorklistFilterValue } from "@/contracts/common/paged-result";
import type { WorkflowItem } from "@/lib/workflow-store";

/**
 * Applies typed filters, search, sort and paging over a mock dataset. In API
 * mode the backend performs all of this and the client MUST NOT re-slice;
 * this helper only exists to keep mock parity with the real endpoint.
 *
 * The mock pager treats `query.filters` as the authoritative filter source
 * (mirroring the server): common built-ins (`status`, `facilityId`) are
 * applied directly; anything else is matched against `WorkflowItem.fields`
 * with case-insensitive substring for strings, exact for arrays and range
 * math for date ranges. Callers can override this per-key via
 * `fieldMatchers`.
 */
export function pageMock(
  items: WorkflowItem[],
  query: PagedQuery,
  fieldMatchers: {
    filters?: Record<string, (row: WorkflowItem, value: WorklistFilterValue) => boolean>;
    sortBy?: Record<string, (row: WorkflowItem) => string>;
  } = {},
): PagedResult<WorkflowItem> {
  let rows = items.slice();
  const filters = query.filters ?? {};

  if (query.facilityId) {
    rows = rows.filter((r) => {
      const f = r.facilityId ?? String(r.fields.Facility ?? r.fields.facility ?? "");
      return !f || f === query.facilityId;
    });
  }

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;

    const custom = fieldMatchers.filters?.[key];
    if (custom) {
      rows = rows.filter((r) => custom(r, value));
      continue;
    }
    if (key === "status") {
      const set = Array.isArray(value) ? value.map(String) : [String(value)];
      rows = rows.filter((r) => set.includes(r.status));
      continue;
    }
    if (key === "facilityId") {
      rows = rows.filter((r) => {
        const f = r.facilityId ?? String(r.fields.Facility ?? r.fields.facility ?? "");
        return !f || f === String(value);
      });
      continue;
    }
    if (typeof value === "object" && ("from" in value || "to" in value)) {
      const range = value as { from?: string; to?: string };
      rows = rows.filter((r) => {
        const at = new Date(r.updatedAt || r.createdAt).getTime();
        if (range.from && at < new Date(range.from).getTime()) return false;
        if (range.to && at > new Date(range.to).getTime()) return false;
        return true;
      });
      continue;
    }
    if (Array.isArray(value)) {
      const set = value.map((v) => String(v).toLowerCase());
      rows = rows.filter((r) => set.includes(String(r.fields[key] ?? "").toLowerCase()));
      continue;
    }
    if (typeof value === "boolean") {
      rows = rows.filter((r) => Boolean(r.fields[key]) === value);
      continue;
    }
    const needle = String(value).toLowerCase();
    rows = rows.filter((r) => String(r.fields[key] ?? "").toLowerCase().includes(needle));
  }

  if (query.search) {
    const q = query.search.toLowerCase();
    rows = rows.filter((r) => {
      const hay = [r.id, r.title, r.subtitle ?? "", r.status,
        ...Object.values(r.fields ?? {}).map(String)].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }
  if (query.sortBy) {
    const getter =
      fieldMatchers.sortBy?.[query.sortBy] ??
      ((r: WorkflowItem) =>
        String(r.fields[query.sortBy!] ?? (r as unknown as Record<string, unknown>)[query.sortBy!] ?? ""));
    rows = rows.sort((a, b) => {
      const av = getter(a);
      const bv = getter(b);
      return query.sortDirection === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }

  const totalItems = rows.length;
  const pageSize = Math.max(1, query.pageSize);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(Math.max(1, query.page), totalPages);
  const items_ = rows.slice((page - 1) * pageSize, page * pageSize);

  return { items: items_, page, pageSize, totalItems, totalPages };
}
