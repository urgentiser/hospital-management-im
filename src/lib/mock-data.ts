export type WorkflowStatus = "active" | "pending" | "review" | "closed" | "failed";

export interface Patient {
  id: string;
  mrn: string;
  name: string;
  dob: string;
  gender: "M" | "F";
  scheme: string;
  status: WorkflowStatus;
  admission?: string;
  practitioner: string;
  facility: string;
  updatedAt: string;
}

export interface Admission {
  id: string;
  patient: string;
  mrn: string;
  facility: string;
  ward: string;
  bed: string;
  admittedAt: string;
  los: number; // length of stay days
  status: "admitted" | "discharged" | "transferred" | "pending";
  practitioner: string;
}

export interface Authorisation {
  id: string;
  patient: string;
  scheme: string;
  procedure: string;
  amount: number;
  status: "approved" | "pending" | "declined" | "review";
  submittedAt: string;
}

export interface IntegrationEvent {
  id: string;
  topic: string;
  correlationId: string;
  status: "delivered" | "retry" | "deadletter" | "pending";
  attempts: number;
  latencyMs: number;
  createdAt: string;
}

export const patients: Patient[] = [
  { id: "P-10241", mrn: "MRN-0032411", name: "Nomvula Dlamini", dob: "1984-03-12", gender: "F", scheme: "Discovery Health", status: "active", admission: "ADM-88213", practitioner: "Dr. S. Naidoo", facility: "Sandton Mediclinic", updatedAt: "2m ago" },
  { id: "P-10242", mrn: "MRN-0032510", name: "Johan van der Merwe", dob: "1972-11-04", gender: "M", scheme: "Bonitas", status: "review", practitioner: "Dr. M. Khumalo", facility: "Netcare Milpark", updatedAt: "14m ago" },
  { id: "P-10243", mrn: "MRN-0032511", name: "Aisha Patel", dob: "1990-06-22", gender: "F", scheme: "Momentum Health", status: "pending", admission: "ADM-88220", practitioner: "Dr. R. Botha", facility: "Life Fourways", updatedAt: "1h ago" },
  { id: "P-10244", mrn: "MRN-0032512", name: "Thabo Mokoena", dob: "1965-09-08", gender: "M", scheme: "GEMS", status: "active", admission: "ADM-88231", practitioner: "Dr. K. Sithole", facility: "Steve Biko Academic", updatedAt: "3h ago" },
  { id: "P-10245", mrn: "MRN-0032513", name: "Emily Carter", dob: "1998-01-30", gender: "F", scheme: "Discovery Health", status: "closed", practitioner: "Dr. L. Pillay", facility: "Sandton Mediclinic", updatedAt: "1d ago" },
  { id: "P-10246", mrn: "MRN-0032514", name: "Sipho Zulu", dob: "1978-12-19", gender: "M", scheme: "Polmed", status: "failed", practitioner: "Dr. A. Adams", facility: "Netcare Milpark", updatedAt: "2d ago" },
];

export const admissions: Admission[] = [
  { id: "ADM-88213", patient: "Nomvula Dlamini", mrn: "MRN-0032411", facility: "Sandton Mediclinic", ward: "Ward 3B", bed: "12", admittedAt: "2026-07-04 08:12", los: 2, status: "admitted", practitioner: "Dr. S. Naidoo" },
  { id: "ADM-88220", patient: "Aisha Patel", mrn: "MRN-0032511", facility: "Life Fourways", ward: "Maternity", bed: "04", admittedAt: "2026-07-05 22:41", los: 1, status: "admitted", practitioner: "Dr. R. Botha" },
  { id: "ADM-88231", patient: "Thabo Mokoena", mrn: "MRN-0032512", facility: "Steve Biko Academic", ward: "ICU", bed: "07", admittedAt: "2026-07-06 03:20", los: 0, status: "admitted", practitioner: "Dr. K. Sithole" },
  { id: "ADM-88190", patient: "Emily Carter", mrn: "MRN-0032513", facility: "Sandton Mediclinic", ward: "Ward 2A", bed: "18", admittedAt: "2026-07-02 11:00", los: 4, status: "discharged", practitioner: "Dr. L. Pillay" },
  { id: "ADM-88205", patient: "Sipho Zulu", mrn: "MRN-0032514", facility: "Netcare Milpark", ward: "Cardiology", bed: "09", admittedAt: "2026-07-03 15:22", los: 3, status: "transferred", practitioner: "Dr. A. Adams" },
];

export const authorisations: Authorisation[] = [
  { id: "AUTH-40921", patient: "Nomvula Dlamini", scheme: "Discovery Health", procedure: "Laparoscopic Cholecystectomy", amount: 48200, status: "approved", submittedAt: "2026-07-05" },
  { id: "AUTH-40922", patient: "Aisha Patel", scheme: "Momentum Health", procedure: "Elective C-Section", amount: 62500, status: "pending", submittedAt: "2026-07-05" },
  { id: "AUTH-40923", patient: "Thabo Mokoena", scheme: "GEMS", procedure: "Coronary Angiography", amount: 34100, status: "review", submittedAt: "2026-07-06" },
  { id: "AUTH-40924", patient: "Johan van der Merwe", scheme: "Bonitas", procedure: "Total Knee Replacement", amount: 118400, status: "declined", submittedAt: "2026-07-04" },
  { id: "AUTH-40925", patient: "Sipho Zulu", scheme: "Polmed", procedure: "MRI Lumbar Spine", amount: 8750, status: "approved", submittedAt: "2026-07-03" },
];

export const events: IntegrationEvent[] = [
  { id: "EVT-1001", topic: "patient.admitted.v1", correlationId: "c-4f2a…9b", status: "delivered", attempts: 1, latencyMs: 142, createdAt: "12s ago" },
  { id: "EVT-1002", topic: "authorisation.requested.v2", correlationId: "c-6b12…3d", status: "retry", attempts: 3, latencyMs: 812, createdAt: "45s ago" },
  { id: "EVT-1003", topic: "pharmacy.dispense.completed.v1", correlationId: "c-9e77…1a", status: "delivered", attempts: 1, latencyMs: 98, createdAt: "1m ago" },
  { id: "EVT-1004", topic: "billing.claim.submitted.v1", correlationId: "c-2c40…8f", status: "deadletter", attempts: 6, latencyMs: 2210, createdAt: "3m ago" },
  { id: "EVT-1005", topic: "theatre.slot.booked.v1", correlationId: "c-71a3…4e", status: "pending", attempts: 0, latencyMs: 0, createdAt: "just now" },
];

export const kpis = [
  { label: "Active Admissions", value: 128, delta: "+4.2%", trend: "up" as const, hint: "vs. last week" },
  { label: "Pending Authorisations", value: 42, delta: "-8.1%", trend: "down" as const, hint: "SLA on track" },
  { label: "Theatre Utilisation", value: "87%", delta: "+2.4%", trend: "up" as const, hint: "past 24h" },
  { label: "Failed Integrations", value: 3, delta: "-2", trend: "down" as const, hint: "dead-letter queue" },
];

export const admissionsTrend = [
  { day: "Mon", admitted: 42, discharged: 38 },
  { day: "Tue", admitted: 48, discharged: 40 },
  { day: "Wed", admitted: 55, discharged: 47 },
  { day: "Thu", admitted: 50, discharged: 52 },
  { day: "Fri", admitted: 61, discharged: 49 },
  { day: "Sat", admitted: 38, discharged: 44 },
  { day: "Sun", admitted: 33, discharged: 30 },
];

export const workflowLoad = [
  { name: "Patients", value: 320 },
  { name: "Admissions", value: 128 },
  { name: "Authorisations", value: 92 },
  { name: "Pharmacy", value: 210 },
  { name: "Theatre", value: 44 },
  { name: "Billing", value: 187 },
];
