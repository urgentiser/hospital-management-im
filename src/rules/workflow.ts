/** State machines for the main workflows. Pages import these; never inline. */

export type AdmissionState = "draft" | "admitted" | "bed-allocated" | "in-theatre" | "discharged" | "cancelled" | "transferred";

const ADMISSION_TRANSITIONS: Record<AdmissionState, AdmissionState[]> = {
  "draft": ["admitted", "cancelled"],
  "admitted": ["bed-allocated", "transferred", "discharged", "cancelled"],
  "bed-allocated": ["in-theatre", "transferred", "discharged", "cancelled"],
  "in-theatre": ["bed-allocated", "discharged"],
  "transferred": ["admitted", "discharged"],
  "discharged": [],
  "cancelled": [],
};

export function canTransitionAdmission(from: AdmissionState, to: AdmissionState): boolean {
  return ADMISSION_TRANSITIONS[from]?.includes(to) ?? false;
}

export type PaymentState = "captured" | "processing" | "cleared" | "failed" | "refunded" | "reversed";
export type DocumentState = "uploaded" | "scanning" | "clean" | "rejected" | "archived";
export type IntegrationState = "delivered" | "pending" | "retry" | "deadletter" | "ignored";

export const INTEGRATION_STATUS_LABEL: Record<IntegrationState, string> = {
  delivered: "Delivered",
  pending: "Pending",
  retry: "Retrying",
  deadletter: "Dead-letter",
  ignored: "Ignored",
};
