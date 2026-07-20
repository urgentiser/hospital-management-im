import type {
  IntegrationMessageDetail,
  IntegrationMessageQuery,
  IntegrationMessageResult,
} from "@/contracts/integrations/integration.contracts";
import type { CommandResult } from "@/contracts/common/command-result";
import { apiRequest } from "@/services/http-client";

function toQuery(values: Record<string, unknown>) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  });
  return params.toString();
}

export const integrationsService = {
  search(query: IntegrationMessageQuery) {
    return apiRequest<IntegrationMessageResult>(`integrations/messages?${toQuery(query)}`);
  },
  get(messageId: string) {
    return apiRequest<IntegrationMessageDetail>(`integrations/messages/${encodeURIComponent(messageId)}`);
  },
  replay(messageId: string, reason: string) {
    return apiRequest<CommandResult<IntegrationMessageDetail>>(
      `integrations/messages/${encodeURIComponent(messageId)}/replay`,
      { method: "POST", body: { reason } },
    );
  },
  ignore(messageId: string, reason: string) {
    return apiRequest<CommandResult<IntegrationMessageDetail>>(
      `integrations/messages/${encodeURIComponent(messageId)}/ignore`,
      { method: "POST", body: { reason } },
    );
  },
};
