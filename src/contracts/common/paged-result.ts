/**
 * Serialisable paged query contract shared by every module worklist.
 *
 * Filters are typed per-module via `TFilters`. `filters` is a plain object of
 * URL-serialisable values (strings, numbers, booleans, string[]s and
 * `{ from?: string; to?: string }` date ranges). In API mode the base service
 * serialises every filter into query parameters; in mock mode the mock pager
 * applies the identical filter shape client-side so both modes stay 1:1.
 */
export type WorklistFilterValue =
  | string
  | number
  | boolean
  | string[]
  | { from?: string; to?: string }
  | null
  | undefined;

export type WorklistFilters = Record<string, WorklistFilterValue>;

export type PagedQuery<TFilters extends WorklistFilters = WorklistFilters> = {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  facilityId?: string;
  filters: TFilters;
};

export type WorklistSummary = Record<string, number | string>;

export type PagedResult<TItem, TSummary extends WorklistSummary = WorklistSummary> = {
  items: TItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  /**
   * Summary values computed over the *complete filtered dataset* by the
   * backend. Never derived from the current page. Absent when the backend
   * has not projected a summary for this module.
   */
  summary?: TSummary;
};
