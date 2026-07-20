import { Permissions } from "@/security/permissions";
import type { StateMachineDefinition } from "@/rules/state-machines/types";

export const admissionStateMachine: StateMachineDefinition = {
  initialState: "draft",
  terminalStates: ["discharged", "cancelled", "rejected"],
  transitions: [
    { from: "draft", to: "pending-validation", permission: Permissions.AdmissionCreate },
    { from: "draft", to: "cancelled", permission: Permissions.AdmissionUpdate, requiresReason: true },
    { from: "pending-validation", to: "ready-for-admission", permission: Permissions.AdmissionCreate },
    { from: "pending-validation", to: "rejected", permission: Permissions.AdmissionUpdate, requiresReason: true },
    { from: "ready-for-admission", to: "admitted", permission: Permissions.AdmissionCreate },
    { from: "ready-for-admission", to: "cancelled", permission: Permissions.AdmissionUpdate, requiresReason: true },
    { from: "admitted", to: "transferred", permission: Permissions.AdmissionTransfer, ruleIds: ["admission.bed-available"], requiresReason: true },
    { from: "transferred", to: "transferred", permission: Permissions.AdmissionTransfer, ruleIds: ["admission.bed-available"], requiresReason: true },
    { from: "admitted", to: "discharged", permission: Permissions.AdmissionDischarge, ruleIds: ["admission.discharge-after-admission"], requiresReason: true },
    { from: "transferred", to: "discharged", permission: Permissions.AdmissionDischarge, ruleIds: ["admission.discharge-after-admission"], requiresReason: true },
  ],
};

export const authorisationStateMachine: StateMachineDefinition = {
  initialState: "draft",
  terminalStates: ["approved", "rejected", "cancelled"],
  transitions: [
    { from: "draft", to: "submitted", permission: Permissions.AuthorisationManage },
    { from: "draft", to: "cancelled", permission: Permissions.AuthorisationManage, requiresReason: true },
    { from: "submitted", to: "more-information-required", permission: Permissions.AuthorisationManage },
    { from: "submitted", to: "approved", permission: Permissions.AuthorisationManage },
    { from: "submitted", to: "rejected", permission: Permissions.AuthorisationManage, requiresReason: true },
    { from: "more-information-required", to: "resubmitted", permission: Permissions.AuthorisationManage },
    { from: "resubmitted", to: "approved", permission: Permissions.AuthorisationManage },
    { from: "resubmitted", to: "rejected", permission: Permissions.AuthorisationManage, requiresReason: true },
  ],
};

export const billingStateMachine: StateMachineDefinition = {
  initialState: "draft",
  terminalStates: ["paid", "cancelled"],
  transitions: [
    { from: "draft", to: "billing-checks", permission: Permissions.BillingManage },
    { from: "billing-checks", to: "ready-to-finalise", permission: Permissions.BillingManage },
    { from: "ready-to-finalise", to: "finalised", permission: Permissions.BillingFinalise, requiresReason: true },
    { from: "finalised", to: "submitted", permission: Permissions.BillingManage },
    { from: "submitted", to: "paid", permission: Permissions.AccountingManage },
    { from: "draft", to: "cancelled", permission: Permissions.BillingManage, requiresReason: true },
  ],
};

export const integrationMessageStateMachine: StateMachineDefinition = {
  initialState: "queued",
  terminalStates: ["completed", "ignored"],
  transitions: [
    { from: "queued", to: "processing", permission: Permissions.IntegrationView },
    { from: "processing", to: "completed", permission: Permissions.IntegrationView },
    { from: "processing", to: "failed", permission: Permissions.IntegrationView },
    { from: "failed", to: "retrying", permission: Permissions.IntegrationRetry, ruleIds: ["integration.retry-limit"] },
    { from: "failed", to: "dead-lettered", permission: Permissions.IntegrationView },
    { from: "dead-lettered", to: "replayed", permission: Permissions.IntegrationReplay, ruleIds: ["integration.replay-eligible"], requiresReason: true },
    { from: "dead-lettered", to: "ignored", permission: Permissions.IntegrationIgnore, requiresReason: true },
    { from: "replayed", to: "processing", permission: Permissions.IntegrationView },
  ],
};
