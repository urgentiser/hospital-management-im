import type { AuditEventDetail, AuditQuery, AuditResult } from "@/contracts/audit/audit.contracts";
import { apiRequest } from "@/services/http-client";

function toQuery(values: Record<string, unknown>) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  });
  return params.toString();
}

export const auditService = {
  search(query: AuditQuery) {
    return apiRequest<AuditResult>(`audit?${toQuery(query)}`);
  },
  get(eventId: string) {
    return apiRequest<AuditEventDetail>(`audit/${encodeURIComponent(eventId)}`);
  },
  export(query: AuditQuery) {
    return apiRequest<{ downloadUrl: string; correlationId: string }>(`audit/export?${toQuery(query)}`);
  },
};
