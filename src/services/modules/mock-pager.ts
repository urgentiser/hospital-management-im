import type { PagedQuery, PagedResult } from "@/contracts/common/paged-result";
import type { WorkflowItem } from "@/lib/workflow-store";

/**
 * Applies query params (search, facility scope, status, sort, page) over a mock
 * dataset. In API mode the backend performs all of this and the client MUST NOT
 * re-slice; this helper only exists to keep mock parity with the real endpoint.
 */
export function pageMock(
  items: WorkflowItem[],
  query: PagedQuery,
  fieldMatchers?: Record<string, (row: WorkflowItem) => string>,
): PagedResult<WorkflowItem> {
  let rows = items.slice();

  if (query.facilityId) {
    rows = rows.filter((r) => {
      const f = r.facilityId ?? String(r.fields.Facility ?? r.fields.facility ?? "");
      return !f || f === query.facilityId;
    });
  }
  if (query.status) {
    rows = rows.filter((r) => r.status === query.status);
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
      fieldMatchers?.[query.sortBy] ??
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
