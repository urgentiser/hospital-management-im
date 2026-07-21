/**
 * Base worklist item every typed module worklist extends.
 *
 * `availableActions` is MANDATORY. It is the authoritative list of action
 * keys the backend permits for the current caller on this specific row.
 * When absent or empty the UI must show no state-changing actions, and
 * this rule applies to every action, including actions that launch a
 * guided workflow.
 */
export type WorklistItem = {
  id: string;
  status: string;
  facilityId: string;
  updatedAt: string;
  createdAt?: string;
  title?: string;
  subtitle?: string;
  /** Backend-authoritative list of permitted action keys for this row. */
  availableActions: string[];
};

export type DateRangeFilter = { from?: string; to?: string };

/** Shared filter primitives reused across every module worklist. */
export type CommonWorklistFilters = {
  status?: string | string[];
  facilityId?: string;
  wardId?: string;
  bedId?: string;
  ownerId?: string;
  funderId?: string;
  practitionerId?: string;
  priority?: string | string[];
  sla?: "on-track" | "at-risk" | "breached";
  updated?: DateRangeFilter;
  created?: DateRangeFilter;
};

export type CommonWorklistSummary = {
  total: number;
  open: number;
  attention: number;
  completed: number;
};
