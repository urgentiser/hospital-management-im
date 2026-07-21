import type { ComponentType, ReactNode } from "react";
import type { WorkflowItem, ModuleKey } from "@/lib/workflow-store";

export type WorklistTone = "primary" | "success" | "warning" | "destructive" | "muted" | "info";

export type WorklistColumn = {
  key: string;
  label: string;
  render?: (row: WorkflowItem) => ReactNode;
  sortable?: boolean;
  defaultVisible?: boolean;
  align?: "left" | "right" | "center";
  width?: string;
};

export type WorklistFilterKind = "text" | "select" | "multiselect" | "date-range" | "boolean";

export type WorklistFilter = {
  key: string;
  label: string;
  kind: WorklistFilterKind;
  options?: { value: string; label: string }[];
  placeholder?: string;
};

export type WorklistStatusMap = Record<string, { label: string; tone: WorklistTone }>;

export type WorklistAction = {
  key: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  destructive?: boolean;
  requiresReason?: boolean;
  /** Row-state guard — return true to show for this row. */
  visibleWhen?: (row: WorkflowItem) => boolean;
  /** When set, selecting the action switches to the guided workflow tab and prefills. */
  launchesGuidedWorkflow?: boolean;
  /** Optional step key to jump the guided workflow to. */
  targetStep?: string;
  /** Permission verb from module permissions. */
  permission?: "view" | "create" | "manage" | "approve";
};

export type SavedView = {
  key: string;
  label: string;
  description?: string;
  filters: Record<string, string | string[] | boolean | undefined>;
  shared?: boolean;
};

export type WorklistConfig = {
  moduleKey: ModuleKey;
  /** Business-facing worklist name, e.g. "Admissions", "Authorisations". */
  name: string;
  /** Short tagline shown under the tab title. */
  tagline?: string;
  columns: WorklistColumn[];
  filters?: WorklistFilter[];
  statusMap?: WorklistStatusMap;
  rowActions?: WorklistAction[];
  savedViews?: SavedView[];
  /** Summary tiles derived from the current result set. */
  summary?: (items: WorkflowItem[]) => { label: string; value: number | string; tone?: WorklistTone }[];
  /** Optional bulk actions where the business process supports them. */
  bulkActions?: WorklistAction[];
  /** Column keys enabled for exports. Omit to disable export. */
  exportable?: boolean;
  /** Default page size — usually 25. */
  pageSize?: number;
  /** Default sort column key. */
  defaultSortBy?: string;
  defaultSortDir?: "asc" | "desc";
};
