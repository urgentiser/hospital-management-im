import type { PagedQuery, PagedResult } from "@/contracts/common/paged-result";

export type AuditEventSummary = {
  id: string;
  occurredAt: string;
  actorName: string;
  actorRole?: string;
  facilityName?: string;
  module: string;
  action: string;
  entityType: string;
  entityId: string;
  sourceApplication: string;
  correlationId: string;
};

export type AuditEventDetail = AuditEventSummary & {
  reason?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type AuditQuery = PagedQuery & {
  actorId?: string;
  module?: string;
  entityType?: string;
  entityId?: string;
  from?: string;
  to?: string;
};

export type AuditResult = PagedResult<AuditEventSummary>;
