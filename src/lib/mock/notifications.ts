export interface Notification {
  id: string;
  category: "Clinical" | "Operational" | "System" | "Billing" | "Security";
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

const ITEMS: Array<[Notification["category"], string, string]> = [
  ["Clinical", "New pathology result", "Result available for Nomvula Dlamini (MRN-0032411)."],
  ["Operational", "Bed board updated", "Ward 3B now at 92% occupancy."],
  ["System", "Integration retrying", "billing.claim.submitted.v1 has retried 3 times."],
  ["Billing", "Payment cleared", "R 12 480,00 received on account ACC-88213."],
  ["Security", "New sign-in from Cape Town", "If this wasn't you, review your session."],
  ["Clinical", "Authorisation approved", "AUTH-40921 for elective LSCS approved."],
  ["Operational", "Theatre slot booked", "Slot 09:30 booked at Life Fourways."],
  ["System", "Dead-letter alert", "2 messages moved to dead-letter queue overnight."],
  ["Billing", "Claim declined", "AUTH-40924 declined by Bonitas — reason: benefit exhausted."],
  ["Operational", "Discharge summary ready", "Aisha Patel — reprint queued."],
  ["Security", "Password rotation reminder", "Rotate service-bus credentials by month-end."],
  ["Clinical", "High-risk alert", "Sipho Zulu flagged as high-risk on admission."],
  ["System", "Deployment completed", "Impilo 2026.07.6 released to production."],
  ["Operational", "Bed transfer requested", "Ward 2A → HDU pending approval."],
  ["Billing", "Refund captured", "R 1 850,00 refunded to Discovery Health."],
  ["Clinical", "Ward round scheduled", "Cardiology round at 07:30."],
  ["System", "Feature flag toggled", "New reports drill-through enabled."],
  ["Operational", "COID form submitted", "Case COID-1201 submitted to Compensation Commissioner."],
  ["Billing", "Statement generated", "July statements are ready for review."],
  ["Security", "Role change", "Support User granted retry on integrations."],
];

export const MOCK_NOTIFICATIONS: Notification[] = ITEMS.map(([category, title, body], i) => ({
  id: `NTF-${8100 + i}`,
  category,
  title,
  body,
  createdAt: new Date(Date.now() - i * 1800_000).toISOString(),
  read: i > 6,
}));
