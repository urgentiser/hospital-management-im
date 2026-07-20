import type { PagedQuery, PagedResult } from "@/contracts/common/paged-result";

export type IntegrationMessageSummary = {
  messageId: string;
  correlationId: string;
  entityName: string;
  subscription?: string;
  sourceService: string;
  targetService: string;
  messageType: string;
  entityType?: string;
  entityId?: string;
  status: string;
  enqueuedAt: string;
  processedAt?: string;
  deliveryCount: number;
  latencyMs?: number;
  deadLetterReason?: string;
  errorCategory?: string;
};

export type IntegrationMessageDetail = IntegrationMessageSummary & {
  errorDetail?: string;
  payloadMetadata?: Record<string, string | number | boolean>;
  timeline: Array<{ at: string; action: string; detail?: string }>;
};

export type IntegrationMessageQuery = PagedQuery & {
  entityName?: string;
  subscription?: string;
  correlationId?: string;
};

export type IntegrationMessageResult = PagedResult<IntegrationMessageSummary>;
