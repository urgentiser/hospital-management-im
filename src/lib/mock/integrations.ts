import type { IntegrationState } from "@/rules/workflow";

export interface ServiceBusMessage {
  messageId: string;
  correlationId: string;
  topic: string;
  subscription: string;
  source: string;
  target: string;
  entityType: string;
  timestamp: string;
  retryCount: number;
  latencyMs: number;
  errorType?: string;
  errorSummary?: string;
  status: IntegrationState;
  payload: Record<string, unknown>;
}

const TOPICS = [
  ["patient.admitted.v1", "billing-service", "impilo-core", "billing", "Patient"],
  ["authorisation.requested.v2", "scheme-adapter", "impilo-core", "scheme-gateway", "Authorisation"],
  ["pharmacy.dispense.completed.v1", "warehouse", "pharmacy-mfp", "warehouse", "Dispense"],
  ["billing.claim.submitted.v1", "clearinghouse", "billing", "clearinghouse", "Claim"],
  ["theatre.slot.booked.v1", "resource-planner", "theatre", "planner", "Booking"],
  ["patient.updated.v1", "pcms-sync", "impilo-core", "pcms", "Patient"],
  ["payment.captured.v1", "bank-gateway", "billing", "bank-gateway", "Payment"],
  ["document.uploaded.v1", "documents", "impilo-core", "documents", "Document"],
];
const STATES: IntegrationState[] = ["delivered", "pending", "retry", "deadletter", "ignored"];
const ERRORS: Array<[string, string]> = [
  ["ScheduledEnqueue.Timeout", "Downstream did not ACK within 30 s"],
  ["Deserialization.Failed", "Missing required field `patient.mrn`"],
  ["Auth.401", "Bearer token rejected by target"],
  ["RateLimit.429", "Target throttled (limit 100/min)"],
  ["Idempotency.Conflict", "Duplicate delivery detected, ignored downstream"],
];

export const MOCK_MESSAGES: ServiceBusMessage[] = Array.from({ length: 32 }).map((_, i) => {
  const t = TOPICS[i % TOPICS.length];
  const status = STATES[i % STATES.length];
  const hasError = status === "retry" || status === "deadletter";
  const err = hasError ? ERRORS[i % ERRORS.length] : null;
  return {
    messageId: `msg-${(1000 + i).toString(16)}-${(i * 37 % 9999).toString(16)}`,
    correlationId: `corr-${(4000 + i).toString(16)}-${(i * 71 % 9999).toString(16)}`,
    topic: t[0],
    subscription: t[1],
    source: t[2],
    target: t[3],
    entityType: t[4],
    timestamp: new Date(Date.now() - i * 90_000).toISOString(),
    retryCount: hasError ? (i % 6) + 1 : status === "delivered" ? 1 : 0,
    latencyMs: status === "pending" ? 0 : 60 + (i * 47) % 2400,
    errorType: err?.[0],
    errorSummary: err?.[1],
    status,
    payload: {
      entityId: `E-${1000 + i}`,
      version: 3,
      emittedBy: t[2],
      metadata: { region: "za-north", partition: i % 4 },
    },
  };
});
