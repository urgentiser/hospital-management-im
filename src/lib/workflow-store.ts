import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  admissions as seedAdmissions,
  authorisations as seedAuths,
  events as seedEvents,
  patients as seedPatients,
} from "./mock-data";

export type WorkflowItem = {
  id: string;
  title: string;
  subtitle?: string;
  status: string;
  fields: Record<string, string | number>;
  history: { at: string; action: string; by: string; note?: string }[];
  createdAt: string;
  updatedAt: string;
};

export type ModuleKey =
  | "patients"
  | "admissions"
  | "authorisations"
  | "pharmacy"
  | "theatre"
  | "ward"
  | "facilities"
  | "practitioners"
  | "case-management"
  | "billing"
  | "funding"
  | "documents"
  | "integrations"
  | "audit"
  | "admin"
  | "reports"
  | "triage"
  | "preadmissions"
  | "coid"
  | "adhoc"
  | "accounting"
  | "clinical-assessments"
  | "medical-events"
  | "clinical-coding"
  | "reimbursements"
  | "supplier-invoices"
  | "account-enquiries"
  | "service-bus"
  | "failed-messages"
  | "notifications"
  | "system-health"
  | "workflow-inbox"
  | "services";

type State = {
  items: Record<ModuleKey, WorkflowItem[]>;
  create: (mod: ModuleKey, item: Omit<WorkflowItem, "id" | "history" | "createdAt" | "updatedAt">) => WorkflowItem;
  update: (mod: ModuleKey, id: string, patch: Partial<WorkflowItem>) => void;
  remove: (mod: ModuleKey, id: string) => void;
  advance: (mod: ModuleKey, id: string, toStatus: string, note?: string) => void;
  addNote: (mod: ModuleKey, id: string, note: string) => void;
};

const now = () => new Date().toISOString();
const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
const nowFmt = () => new Date().toLocaleString();

function seed(): Record<ModuleKey, WorkflowItem[]> {
  const patients: WorkflowItem[] = seedPatients.map((p) => ({
    id: p.id,
    title: p.name,
    subtitle: `${p.mrn} · ${p.scheme}`,
    status: p.status,
    fields: { MRN: p.mrn, DOB: p.dob, Gender: p.gender, Scheme: p.scheme, Facility: p.facility, Practitioner: p.practitioner },
    history: [{ at: nowFmt(), action: "Record created", by: "System" }],
    createdAt: now(),
    updatedAt: now(),
  }));
  const admissions: WorkflowItem[] = seedAdmissions.map((a) => ({
    id: a.id,
    title: a.patient,
    subtitle: `${a.facility} · ${a.ward} · Bed ${a.bed}`,
    status: a.status,
    fields: { MRN: a.mrn, Facility: a.facility, Ward: a.ward, Bed: a.bed, Admitted: a.admittedAt, LOS: `${a.los}d`, Practitioner: a.practitioner },
    history: [{ at: nowFmt(), action: "Admission created", by: "System" }],
    createdAt: now(),
    updatedAt: now(),
  }));
  const authorisations: WorkflowItem[] = seedAuths.map((a) => ({
    id: a.id,
    title: a.procedure,
    subtitle: `${a.patient} · ${a.scheme}`,
    status: a.status,
    fields: { Patient: a.patient, Scheme: a.scheme, Amount: `R ${a.amount.toLocaleString()}`, Submitted: a.submittedAt },
    history: [{ at: nowFmt(), action: "Authorisation submitted", by: "System" }],
    createdAt: now(),
    updatedAt: now(),
  }));
  const integrationsMeta: Array<{
    queue: string; subscription: string; source: string; target: string;
    messageType: string; entity: string; entityId: string; enqueuedAt: string; processedAt: string;
    errorCode?: string; errorMessage?: string;
    retryLog: { attempt: number; at: string; result: string; note?: string }[];
    timeline: { at: string; hop: string; outcome: string }[];
  }> = [
    { queue: "topics/patient", subscription: "sub-patient-core", source: "Admissions API", target: "PatientCore", messageType: "PatientAdmitted", entity: "Patient", entityId: "P-10241", enqueuedAt: "2026-07-12 08:14:22", processedAt: "2026-07-12 08:14:22",
      retryLog: [{ attempt: 1, at: "08:14:22", result: "delivered" }],
      timeline: [{ at: "08:14:22", hop: "publish", outcome: "accepted" }, { at: "08:14:22", hop: "deliver", outcome: "acked" }] },
    { queue: "topics/authorisation", subscription: "sub-auth-medscheme", source: "AuthGateway", target: "MedScheme Adapter", messageType: "AuthorisationRequested", entity: "Authorisation", entityId: "AUTH-40922", enqueuedAt: "2026-07-12 08:13:00", processedAt: "—",
      errorCode: "HTTP_504", errorMessage: "Upstream MedScheme gateway timeout after 30s",
      retryLog: [
        { attempt: 1, at: "08:13:00", result: "failed", note: "504 Gateway Timeout" },
        { attempt: 2, at: "08:13:15", result: "failed", note: "504 Gateway Timeout" },
        { attempt: 3, at: "08:13:45", result: "retry-scheduled", note: "backoff 60s" },
      ],
      timeline: [
        { at: "08:13:00", hop: "publish", outcome: "accepted" },
        { at: "08:13:00", hop: "deliver", outcome: "504" },
        { at: "08:13:15", hop: "retry-1", outcome: "504" },
        { at: "08:13:45", hop: "retry-2", outcome: "504" },
      ] },
    { queue: "topics/pharmacy", subscription: "sub-pharmacy-billing", source: "PharmacyCore", target: "Billing", messageType: "DispenseCompleted", entity: "Dispense", entityId: "RX-70012", enqueuedAt: "2026-07-12 08:11:30", processedAt: "2026-07-12 08:11:30",
      retryLog: [{ attempt: 1, at: "08:11:30", result: "delivered" }],
      timeline: [{ at: "08:11:30", hop: "publish", outcome: "accepted" }, { at: "08:11:30", hop: "deliver", outcome: "acked" }] },
    { queue: "topics/billing", subscription: "sub-billing-scheme-out", source: "BillingCore", target: "SchemeSubmitter", messageType: "ClaimSubmitted", entity: "Claim", entityId: "CLM-77812", enqueuedAt: "2026-07-12 08:09:10", processedAt: "—",
      errorCode: "SCHEMA_MISMATCH", errorMessage: "Field 'benefit_code' expected string, received null",
      retryLog: [
        { attempt: 1, at: "08:09:10", result: "failed", note: "schema mismatch" },
        { attempt: 2, at: "08:09:25", result: "failed", note: "schema mismatch" },
        { attempt: 3, at: "08:09:55", result: "failed", note: "schema mismatch" },
        { attempt: 4, at: "08:10:55", result: "failed", note: "schema mismatch" },
        { attempt: 5, at: "08:12:55", result: "failed", note: "schema mismatch" },
        { attempt: 6, at: "08:16:55", result: "dead-lettered", note: "max attempts exceeded" },
      ],
      timeline: [
        { at: "08:09:10", hop: "publish", outcome: "accepted" },
        { at: "08:09:10", hop: "validate", outcome: "SCHEMA_MISMATCH" },
        { at: "08:16:55", hop: "dead-letter", outcome: "moved to DLQ" },
      ] },
    { queue: "topics/theatre", subscription: "sub-theatre-scheduler", source: "TheatreBooking", target: "SchedulerCore", messageType: "SlotBooked", entity: "TheatreSlot", entityId: "TH-30021", enqueuedAt: "2026-07-12 08:16:00", processedAt: "—",
      retryLog: [],
      timeline: [{ at: "08:16:00", hop: "publish", outcome: "accepted" }, { at: "08:16:00", hop: "deliver", outcome: "pending" }] },
  ];
  const integrations: WorkflowItem[] = seedEvents.map((e, i) => {
    const m = integrationsMeta[i] ?? integrationsMeta[0];
    return {
      id: e.id,
      title: e.topic,
      subtitle: e.correlationId,
      status: e.status,
      fields: {
        Kind: "Event",
        Queue: m.queue,
        Subscription: m.subscription,
        Source: m.source,
        Target: m.target,
        "Message type": m.messageType,
        Entity: m.entity,
        "Entity ID": m.entityId,
        Attempts: e.attempts,
        "Latency (ms)": e.latencyMs,
        Enqueued: m.enqueuedAt,
        Processed: m.processedAt,
        "Error code": m.errorCode ?? "",
        "Error message": m.errorMessage ?? "",
        "Retry log": JSON.stringify(m.retryLog),
        Timeline: JSON.stringify(m.timeline),
        Correlation: e.correlationId,
      },
      history: [{ at: nowFmt(), action: "Event received", by: "Service Bus" }],
      createdAt: now(),
      updatedAt: now(),
    };
  });

  const pharmacy: WorkflowItem[] = [
    { id: "RX-70011", title: "Amoxicillin 500mg × 21", subtitle: "Nomvula Dlamini · Life Fourways",
      status: "ordered", fields: { Patient: "Nomvula Dlamini", Ward: "Ward 3B", Prescriber: "Dr. S. Naidoo" },
      history: [{ at: nowFmt(), action: "Order created", by: "Dr. S. Naidoo" }], createdAt: now(), updatedAt: now() },
    { id: "RX-70012", title: "Insulin glargine 10U/day", subtitle: "Thabo Mokoena · ICU",
      status: "dispensed", fields: { Patient: "Thabo Mokoena", Ward: "ICU", Prescriber: "Dr. K. Sithole" },
      history: [{ at: nowFmt(), action: "Dispensed", by: "Pharmacy" }], createdAt: now(), updatedAt: now() },
  ];
  const theatre: WorkflowItem[] = [
    { id: "TH-30021", title: "Laparoscopic Cholecystectomy", subtitle: "Theatre 2 · 09:30 · Nomvula Dlamini",
      status: "booked", fields: { Theatre: "T2", Surgeon: "Dr. S. Naidoo", Duration: "90 min" },
      history: [{ at: nowFmt(), action: "Slot booked", by: "Scheduler" }], createdAt: now(), updatedAt: now() },
    { id: "TH-30022", title: "Elective C-Section", subtitle: "Theatre 4 · 11:00 · Aisha Patel",
      status: "in-progress", fields: { Theatre: "T4", Surgeon: "Dr. R. Botha", Duration: "60 min" },
      history: [{ at: nowFmt(), action: "In progress", by: "Theatre lead" }], createdAt: now(), updatedAt: now() },
  ];
  const ward: WorkflowItem[] = [
    { id: "BED-3B-12", title: "Ward 3B · Bed 12", subtitle: "Nomvula Dlamini",
      status: "occupied", fields: { Facility: "Life Fourways", Ward: "3B", Bed: "12" },
      history: [{ at: nowFmt(), action: "Bed occupied", by: "Nurse Manager" }], createdAt: now(), updatedAt: now() },
    { id: "BED-ICU-07", title: "ICU · Bed 07", subtitle: "Thabo Mokoena",
      status: "occupied", fields: { Facility: "Life Kingsbury", Ward: "ICU", Bed: "07" },
      history: [{ at: nowFmt(), action: "Bed occupied", by: "Nurse Manager" }], createdAt: now(), updatedAt: now() },
    { id: "BED-2A-18", title: "Ward 2A · Bed 18", subtitle: "Available",
      status: "available", fields: { Facility: "Life Fourways", Ward: "2A", Bed: "18" },
      history: [{ at: nowFmt(), action: "Bed cleaned", by: "Housekeeping" }], createdAt: now(), updatedAt: now() },
  ];
  const facilities: WorkflowItem[] = [
    { id: "LHC-FOU", title: "Life Fourways Hospital", subtitle: "Fourways, Johannesburg · 260 beds",
      status: "active", fields: { Group: "Life Healthcare", Beds: 260, Wards: 12, Theatres: 8 },
      history: [{ at: nowFmt(), action: "Facility onboarded", by: "Admin" }], createdAt: now(), updatedAt: now() },
    { id: "LHC-GRP", title: "Life Groenkloof Hospital", subtitle: "Pretoria · 210 beds",
      status: "active", fields: { Group: "Life Healthcare", Beds: 210, Wards: 10, Theatres: 6 },
      history: [{ at: nowFmt(), action: "Facility onboarded", by: "Admin" }], createdAt: now(), updatedAt: now() },
    { id: "LHC-KGM", title: "Life Kingsbury Hospital", subtitle: "Claremont, Cape Town · 200 beds",
      status: "active", fields: { Group: "Life Healthcare", Beds: 200, Wards: 10, Theatres: 6 },
      history: [{ at: nowFmt(), action: "Facility onboarded", by: "Admin" }], createdAt: now(), updatedAt: now() },
    { id: "LHC-VIN", title: "Life Vincent Pallotti Hospital", subtitle: "Pinelands, Cape Town · 210 beds",
      status: "active", fields: { Group: "Life Healthcare", Beds: 210, Wards: 11, Theatres: 7 },
      history: [{ at: nowFmt(), action: "Facility onboarded", by: "Admin" }], createdAt: now(), updatedAt: now() },
    { id: "LHC-EMP", title: "Life The Glynnwood", subtitle: "Benoni, Ekurhuleni · 230 beds",
      status: "active", fields: { Group: "Life Healthcare", Beds: 230, Wards: 11, Theatres: 7 },
      history: [{ at: nowFmt(), action: "Facility onboarded", by: "Admin" }], createdAt: now(), updatedAt: now() },
    { id: "LHC-EAS", title: "Life East London Private Hospital", subtitle: "East London · 180 beds",
      status: "active", fields: { Group: "Life Healthcare", Beds: 180, Wards: 9, Theatres: 5 },
      history: [{ at: nowFmt(), action: "Facility onboarded", by: "Admin" }], createdAt: now(), updatedAt: now() },
    { id: "LHC-WLG", title: "Life Westville Hospital", subtitle: "Westville, Durban · 240 beds",
      status: "active", fields: { Group: "Life Healthcare", Beds: 240, Wards: 12, Theatres: 7 },
      history: [{ at: nowFmt(), action: "Facility onboarded", by: "Admin" }], createdAt: now(), updatedAt: now() },
    { id: "LHC-ENT", title: "Life Entabeni Hospital", subtitle: "Berea, Durban · 280 beds",
      status: "active", fields: { Group: "Life Healthcare", Beds: 280, Wards: 13, Theatres: 8 },
      history: [{ at: nowFmt(), action: "Facility onboarded", by: "Admin" }], createdAt: now(), updatedAt: now() },
  ];
  const practitioners: WorkflowItem[] = [
    { id: "PR-101", title: "Dr. S. Naidoo", subtitle: "General Surgery · Fourways",
      status: "active", fields: { HPCSA: "MP0123456", Speciality: "Surgery", Facility: "Fourways" },
      history: [{ at: nowFmt(), action: "Credentialed", by: "Admin" }], createdAt: now(), updatedAt: now() },
    { id: "PR-102", title: "Dr. M. Khumalo", subtitle: "Internal Medicine · Groenkloof",
      status: "active", fields: { HPCSA: "MP0223391", Speciality: "Internal Med", Facility: "Groenkloof" },
      history: [{ at: nowFmt(), action: "Credentialed", by: "Admin" }], createdAt: now(), updatedAt: now() },
    { id: "PR-103", title: "Dr. R. Botha", subtitle: "Obstetrics · Fourways",
      status: "pending", fields: { HPCSA: "MP0330012", Speciality: "OB/GYN", Facility: "Fourways" },
      history: [{ at: nowFmt(), action: "Application received", by: "Credentialing" }], createdAt: now(), updatedAt: now() },
  ];
  const cases: WorkflowItem[] = [
    { id: "CASE-8801", title: "Post-op recovery — N. Dlamini", subtitle: "Multi-party · 3 practitioners",
      status: "in-progress", fields: { Owner: "Case Mgr J. Adams", Priority: "High", "SLA Days": 5 },
      history: [{ at: nowFmt(), action: "Case opened", by: "Case Mgr" }], createdAt: now(), updatedAt: now() },
    { id: "CASE-8802", title: "Chronic diabetes review — T. Mokoena", subtitle: "Long-running",
      status: "assessment", fields: { Owner: "Case Mgr L. Pillay", Priority: "Medium", "SLA Days": 14 },
      history: [{ at: nowFmt(), action: "Assessment scheduled", by: "Case Mgr" }], createdAt: now(), updatedAt: now() },
  ];
  const billing: WorkflowItem[] = [
    { id: "CLM-99001", title: "Claim — AUTH-40921", subtitle: "Discovery Health · R 48,200",
      status: "submitted", fields: { Scheme: "Discovery Health", Amount: "R 48,200", "Auth Ref": "AUTH-40921" },
      history: [{ at: nowFmt(), action: "Claim submitted", by: "Billing" }], createdAt: now(), updatedAt: now() },
    { id: "CLM-99002", title: "Claim — AUTH-40925", subtitle: "Polmed · R 8,750",
      status: "paid", fields: { Scheme: "Polmed", Amount: "R 8,750", "Auth Ref": "AUTH-40925" },
      history: [{ at: nowFmt(), action: "Payment received", by: "Reconciliation" }], createdAt: now(), updatedAt: now() },
  ];
  const funding: WorkflowItem[] = [
    { id: "FND-2001", title: "Discovery Health · Hospital Plan", subtitle: "PMB coverage · 100% of scheme rate",
      status: "active", fields: { Scheme: "Discovery Health", Plan: "Hospital", Rate: "100%" },
      history: [{ at: nowFmt(), action: "Rule verified", by: "Funding Ops" }], createdAt: now(), updatedAt: now() },
    { id: "FND-2002", title: "GEMS · Ruby", subtitle: "In-hospital · 100%",
      status: "verified", fields: { Scheme: "GEMS", Plan: "Ruby", Rate: "100%" },
      history: [{ at: nowFmt(), action: "Rule verified", by: "Funding Ops" }], createdAt: now(), updatedAt: now() },
  ];
  const documents: WorkflowItem[] = [
    { id: "DOC-5001", title: "Consent — N. Dlamini", subtitle: "Surgical consent · signed",
      status: "approved", fields: { Type: "Consent", Patient: "N. Dlamini", Size: "128 KB" },
      history: [{ at: nowFmt(), action: "Document uploaded", by: "Ward Clerk" }], createdAt: now(), updatedAt: now() },
    { id: "DOC-5002", title: "Discharge summary — E. Carter", subtitle: "Pending review",
      status: "reviewed", fields: { Type: "Discharge", Patient: "E. Carter", Size: "212 KB" },
      history: [{ at: nowFmt(), action: "Uploaded", by: "Dr. L. Pillay" }], createdAt: now(), updatedAt: now() },
  ];
  const audit: WorkflowItem[] = [
    { id: "AUD-1001", title: "Auth AUTH-40921 approved", subtitle: "Discovery Health · Dr. S. Naidoo",
      status: "logged",
      fields: {
        Kind: "Audit",
        Actor: "Dr. S. Naidoo", "Actor role": "Clinical Lead",
        Facility: "Life Fourways", "Source app": "Impilo Web · v2.14.3",
        Module: "Authorisations", Event: "authorisation.approved",
        "Entity type": "Authorisation", "Entity ID": "AUTH-40921",
        Correlation: "c-4f2a…9b", "Request ID": "req-88a2-14b7",
        "IP address": "10.42.11.19", At: "2026-07-12 08:14:22.812",
        Before: JSON.stringify({ status: "pending", amount: 48200, note: null }),
        After: JSON.stringify({ status: "approved", amount: 48200, note: "Prima facie authorisation" }),
      },
      history: [{ at: nowFmt(), action: "Recorded", by: "Audit trail" }], createdAt: now(), updatedAt: now() },
    { id: "AUD-1002", title: "Bed BED-3B-12 assigned", subtitle: "Ward Manager · Life Fourways",
      status: "logged",
      fields: {
        Kind: "Audit",
        Actor: "J. Adams", "Actor role": "Ward Manager",
        Facility: "Life Fourways", "Source app": "Impilo Web · v2.14.3",
        Module: "Ward", Event: "bed.assigned",
        "Entity type": "Bed", "Entity ID": "BED-3B-12",
        Correlation: "c-71a3…4e", "Request ID": "req-91cd-72fa",
        "IP address": "10.42.11.22", At: "2026-07-12 08:16:00.104",
        Before: JSON.stringify({ occupant: null, status: "clean" }),
        After: JSON.stringify({ occupant: "P-10241", status: "occupied" }),
      },
      history: [{ at: nowFmt(), action: "Recorded", by: "Audit trail" }], createdAt: now(), updatedAt: now() },
    { id: "AUD-1003", title: "Claim CLM-77812 dead-lettered", subtitle: "Service Bus · schema mismatch",
      status: "reviewed",
      fields: {
        Kind: "Audit",
        Actor: "system", "Actor role": "Service Bus",
        Facility: "All facilities", "Source app": "Impilo Integrations · v1.9.0",
        Module: "Integrations", Event: "integration.deadletter",
        "Entity type": "Claim", "Entity ID": "CLM-77812",
        Correlation: "c-2c40…8f", "Request ID": "req-77a1-2210",
        "IP address": "10.20.4.7", At: "2026-07-12 08:16:55.221",
        Before: JSON.stringify({ status: "retrying", attempts: 5 }),
        After: JSON.stringify({ status: "dead-lettered", attempts: 6, errorCode: "SCHEMA_MISMATCH" }),
      },
      history: [{ at: nowFmt(), action: "Recorded", by: "Audit trail" }, { at: nowFmt(), action: "Reviewed", by: "Compliance" }], createdAt: now(), updatedAt: now() },
    { id: "AUD-1004", title: "Period 2026-06 sealed", subtitle: "Compliance Officer",
      status: "sealed",
      fields: {
        Kind: "Audit",
        Actor: "P. van Wyk", "Actor role": "Compliance Officer",
        Facility: "All facilities", "Source app": "Impilo Web · v2.14.3",
        Module: "Audit", Event: "audit.period.sealed",
        "Entity type": "AuditPeriod", "Entity ID": "2026-06",
        Correlation: "c-88f1…22", "Request ID": "req-55bb-a13c",
        "IP address": "10.42.11.9", At: "2026-07-01 09:00:00.000",
        Before: JSON.stringify({ sealed: false }),
        After: JSON.stringify({ sealed: true, sealHash: "sha256:9f2c…c1a0", chainPrev: "sha256:1e77…4b21" }),
      },
      history: [{ at: nowFmt(), action: "Recorded", by: "Audit trail" }], createdAt: now(), updatedAt: now() },
  ];
  const admin: WorkflowItem[] = [
    { id: "USR-001", title: "Dr. K. Naidoo", subtitle: "Clinical Lead · Fourways",
      status: "active", fields: { Email: "k.naidoo@impilo.co.za", Role: "Clinical Lead" },
      history: [{ at: nowFmt(), action: "Account created", by: "Admin" }], createdAt: now(), updatedAt: now() },
    { id: "USR-002", title: "J. Adams", subtitle: "Case Manager",
      status: "active", fields: { Email: "j.adams@impilo.co.za", Role: "Case Manager" },
      history: [{ at: nowFmt(), action: "Account created", by: "Admin" }], createdAt: now(), updatedAt: now() },
    { id: "USR-003", title: "P. van Wyk", subtitle: "Billing",
      status: "invited", fields: { Email: "p.vanwyk@impilo.co.za", Role: "Billing" },
      history: [{ at: nowFmt(), action: "Invitation sent", by: "Admin" }], createdAt: now(), updatedAt: now() },
  ];
  const reports: WorkflowItem[] = [
    { id: "RPT-901", title: "Weekly Admissions Report", subtitle: "Week 27 · All facilities",
      status: "generated", fields: { Period: "Week 27", Format: "PDF", Size: "1.4 MB" },
      history: [{ at: nowFmt(), action: "Generated", by: "Reports Service" }], createdAt: now(), updatedAt: now() },
    { id: "RPT-902", title: "Authorisations Aging", subtitle: "Monthly",
      status: "shared", fields: { Period: "June", Format: "XLSX", Size: "612 KB" },
      history: [{ at: nowFmt(), action: "Shared with Ops", by: "K. Naidoo" }], createdAt: now(), updatedAt: now() },
  ];

  const triage: WorkflowItem[] = [
    { id: "TRG-4001", title: "N. Dlamini · chest pain", subtitle: "ESI 2 · Fourways EU",
      status: "waiting", fields: { Kind: "Triage Patient", Patient: "N. Dlamini", ESI: "2", Complaint: "Chest pain", Facility: "Life Fourways" },
      history: [{ at: nowFmt(), action: "Triaged", by: "Sr. M. Zulu" }], createdAt: now(), updatedAt: now() },
    { id: "TRG-4002", title: "T. Mokoena · laceration", subtitle: "ESI 3 · Kingsbury EU",
      status: "in-progress", fields: { Kind: "Triage Patient", Patient: "T. Mokoena", ESI: "3", Complaint: "Hand laceration", Facility: "Life Kingsbury" },
      history: [{ at: nowFmt(), action: "In treatment", by: "Dr. R. Botha" }], createdAt: now(), updatedAt: now() },
  ];
  const preadmissions: WorkflowItem[] = [
    { id: "PA-7086684", title: "GOPOLANG, MAKOKWE", subtitle: "Life Fourways · 2026-07-14",
      status: "verified", fields: { Kind: "Preadmit Patient", Patient: "GOPOLANG, MAKOKWE", Facility: "Life Fourways", Scheme: "Bank Of Botswana", Auth: "668877" },
      history: [{ at: nowFmt(), action: "Preadmission created", by: "System" }], createdAt: now(), updatedAt: now() },
    { id: "PA-7086701", title: "DLAMINI, NOMVULA", subtitle: "Life Kingsbury · 2026-07-12",
      status: "assessed", fields: { Kind: "Assess Patient", Patient: "DLAMINI, NOMVULA", Facility: "Life Kingsbury", Scheme: "Discovery Health", Auth: "AUTH-40921" },
      history: [{ at: nowFmt(), action: "Assessment completed", by: "Sr. J. Adams" }], createdAt: now(), updatedAt: now() },
  ];
  const coid: WorkflowItem[] = [
    { id: "COID-9001", title: "Injury on duty — T. Mokoena", subtitle: "Employer: Steelworks SA",
      status: "submitted", fields: { Employer: "Steelworks SA", "COID Ref": "W.CL-88221", Injury: "Fracture · left tibia" },
      history: [{ at: nowFmt(), action: "COID claim submitted", by: "COID Clerk" }], createdAt: now(), updatedAt: now() },
    { id: "COID-9002", title: "Chemical exposure — L. Ndlovu", subtitle: "Employer: Petrochem",
      status: "approved", fields: { Employer: "Petrochem", "COID Ref": "W.CL-88240", Injury: "Chemical burn" },
      history: [{ at: nowFmt(), action: "Approved by Compensation Commissioner", by: "COID" }], createdAt: now(), updatedAt: now() },
  ];
  const adhoc: WorkflowItem[] = [
    { id: "ADH-2201", title: "Manual charge — theatre consumables", subtitle: "Nomvula Dlamini · R 2,340",
      status: "posted", fields: { Patient: "N. Dlamini", Amount: "R 2,340", Reason: "Theatre consumables" },
      history: [{ at: nowFmt(), action: "Adhoc charge posted", by: "Billing" }], createdAt: now(), updatedAt: now() },
    { id: "ADH-2202", title: "Discount — hardship", subtitle: "E. Carter · -R 1,200",
      status: "approved", fields: { Patient: "E. Carter", Amount: "-R 1,200", Reason: "Hardship discount" },
      history: [{ at: nowFmt(), action: "Approved by CFO", by: "Finance" }], createdAt: now(), updatedAt: now() },
  ];
  const accounting: WorkflowItem[] = [
    { id: "GL-77001", title: "June revenue posting", subtitle: "GL 4000 · Patient revenue",
      status: "posted", fields: { Period: "June", Account: "4000 Revenue", Amount: "R 4,182,940", Journal: "JV-0691" },
      history: [{ at: nowFmt(), action: "Journal posted", by: "Accounting" }], createdAt: now(), updatedAt: now() },
    { id: "GL-77002", title: "Bad debt provision", subtitle: "Q2 provision update",
      status: "pending", fields: { Period: "Q2", Account: "5200 Bad debt", Amount: "R 214,500", Journal: "JV-0714" },
      history: [{ at: nowFmt(), action: "Prepared for review", by: "Financial Controller" }], createdAt: now(), updatedAt: now() },
  ];

  const clinicalAssessments: WorkflowItem[] = [
    { id: "CA-6001", title: "Cardiac risk assessment · N. Dlamini", subtitle: "Pre-op · Life Fourways",
      status: "completed", fields: { Kind: "Assessment", Patient: "N. Dlamini", Type: "Cardiac risk", Score: "Low" },
      history: [{ at: nowFmt(), action: "Assessment signed", by: "Dr. S. Naidoo" }], createdAt: now(), updatedAt: now() },
    { id: "CA-6002", title: "MEWS · T. Mokoena", subtitle: "ICU · Kingsbury",
      status: "in-progress", fields: { Kind: "MEWS", Patient: "T. Mokoena", Score: "4" },
      history: [{ at: nowFmt(), action: "Scoring started", by: "Sr. J. Adams" }], createdAt: now(), updatedAt: now() },
  ];
  const medicalEvents: WorkflowItem[] = [
    { id: "ME-8801", title: "Vitals recorded · N. Dlamini", subtitle: "Ward 3B · 08:15",
      status: "logged", fields: { Kind: "Vitals", Patient: "N. Dlamini", BP: "128/82", HR: "76" },
      history: [{ at: nowFmt(), action: "Recorded", by: "Sr. M. Zulu" }], createdAt: now(), updatedAt: now() },
    { id: "ME-8802", title: "Adverse drug reaction · T. Mokoena", subtitle: "ICU · flagged",
      status: "escalated", fields: { Kind: "ADR", Patient: "T. Mokoena", Drug: "Ceftriaxone" },
      history: [{ at: nowFmt(), action: "Flagged to pharmacovigilance", by: "Dr. R. Botha" }], createdAt: now(), updatedAt: now() },
  ];
  const clinicalCoding: WorkflowItem[] = [
    { id: "CC-5501", title: "ICD-10 · Cholelithiasis", subtitle: "Case CASE-8801 · Coder queue",
      status: "in-review", fields: { Kind: "ICD-10", Patient: "N. Dlamini", Code: "K80.20", Reviewer: "Coder A. Khan" },
      history: [{ at: nowFmt(), action: "Auto-coded", by: "Coding Engine" }], createdAt: now(), updatedAt: now() },
    { id: "CC-5502", title: "CPT · Laparoscopic cholecystectomy", subtitle: "Case CASE-8801",
      status: "signed", fields: { Kind: "CPT", Patient: "N. Dlamini", Code: "47562", Reviewer: "Coder A. Khan" },
      history: [{ at: nowFmt(), action: "Signed by coder", by: "A. Khan" }], createdAt: now(), updatedAt: now() },
  ];

  const reimbursements: WorkflowItem[] = [
    { id: "REI-3301", title: "Refund — over-collection", subtitle: "N. Dlamini · R 1,240",
      status: "pending", fields: { Kind: "Refund", Patient: "N. Dlamini", Amount: "R 1,240", Reason: "Over-collected on discharge" },
      history: [{ at: nowFmt(), action: "Refund requested", by: "Billing" }], createdAt: now(), updatedAt: now() },
    { id: "REI-3302", title: "Refund — duplicate payment", subtitle: "E. Carter · R 620",
      status: "approved", fields: { Kind: "Refund", Patient: "E. Carter", Amount: "R 620", Reason: "Duplicate EFT" },
      history: [{ at: nowFmt(), action: "Approved by CFO", by: "Finance" }], createdAt: now(), updatedAt: now() },
  ];
  const supplierInvoices: WorkflowItem[] = [
    { id: "SI-9101", title: "Medtronic — theatre consumables", subtitle: "PO-88214 · R 48,900",
      status: "pending", fields: { Kind: "Invoice", Supplier: "Medtronic", PO: "PO-88214", Amount: "R 48,900" },
      history: [{ at: nowFmt(), action: "Invoice received", by: "AP" }], createdAt: now(), updatedAt: now() },
    { id: "SI-9102", title: "Sanofi — pharmacy stock", subtitle: "PO-88220 · R 132,450",
      status: "approved", fields: { Kind: "Invoice", Supplier: "Sanofi", PO: "PO-88220", Amount: "R 132,450" },
      history: [{ at: nowFmt(), action: "Approved for payment", by: "Finance" }], createdAt: now(), updatedAt: now() },
  ];
  const accountEnquiries: WorkflowItem[] = [
    { id: "AQ-6601", title: "Statement dispute — E. Carter", subtitle: "Item on 2026-06-14",
      status: "open", fields: { Kind: "Enquiry", Patient: "E. Carter", Channel: "Call", Amount: "R 3,200" },
      history: [{ at: nowFmt(), action: "Enquiry logged", by: "Accounts" }], createdAt: now(), updatedAt: now() },
    { id: "AQ-6602", title: "Refund status — N. Dlamini", subtitle: "REI-3301",
      status: "in-progress", fields: { Kind: "Enquiry", Patient: "N. Dlamini", Channel: "Portal" },
      history: [{ at: nowFmt(), action: "In progress", by: "Accounts" }], createdAt: now(), updatedAt: now() },
  ];

  const serviceBus: WorkflowItem[] = [
    { id: "SB-1001", title: "orders.created / T-1", subtitle: "sub-billing · active", status: "healthy",
      fields: { Kind: "Subscription", Topic: "orders.created", Subscription: "sub-billing", Messages: 128, DLQ: 0 },
      history: [{ at: nowFmt(), action: "Subscription healthy", by: "Service Bus" }], createdAt: now(), updatedAt: now() },
    { id: "SB-1002", title: "patient.admitted / T-2", subtitle: "sub-ward · lag", status: "degraded",
      fields: { Kind: "Subscription", Topic: "patient.admitted", Subscription: "sub-ward", Messages: 42, DLQ: 3 },
      history: [{ at: nowFmt(), action: "Consumer lag detected", by: "Monitor" }], createdAt: now(), updatedAt: now() },
  ];
  const failedMessages: WorkflowItem[] = [
    { id: "DLQ-4401", title: "claim.submitted · schema mismatch", subtitle: "sub-billing · 3 attempts", status: "dead-lettered",
      fields: { Kind: "Dead-letter", Topic: "claim.submitted", Attempts: 3, Reason: "Schema mismatch" },
      history: [{ at: nowFmt(), action: "Moved to DLQ", by: "Service Bus" }], createdAt: now(), updatedAt: now() },
    { id: "DLQ-4402", title: "auth.approved · downstream 500", subtitle: "sub-auth · 5 attempts", status: "dead-lettered",
      fields: { Kind: "Dead-letter", Topic: "auth.approved", Attempts: 5, Reason: "Downstream 500" },
      history: [{ at: nowFmt(), action: "Moved to DLQ", by: "Service Bus" }], createdAt: now(), updatedAt: now() },
  ];
  const notifications: WorkflowItem[] = [
    { id: "NT-9001", title: "SMS · Auth AUTH-40921 approved", subtitle: "+27 82 xxx 1234 · delivered", status: "delivered",
      fields: { Kind: "SMS", Channel: "SMS", Recipient: "+27 82 xxx 1234", Template: "auth.approved" },
      history: [{ at: nowFmt(), action: "Delivered", by: "SMS Gateway" }], createdAt: now(), updatedAt: now() },
    { id: "NT-9002", title: "Email · Statement — E. Carter", subtitle: "e.carter@example.com · queued", status: "queued",
      fields: { Kind: "Email", Channel: "Email", Recipient: "e.carter@example.com", Template: "statement.monthly" },
      history: [{ at: nowFmt(), action: "Queued for send", by: "Notify" }], createdAt: now(), updatedAt: now() },
  ];
  const systemHealth: WorkflowItem[] = [
    { id: "SVC-API", title: "API Gateway", subtitle: "99.98% · 42ms p95", status: "healthy",
      fields: { Kind: "Service", Uptime: "99.98%", Latency: "42ms", Errors: 0 },
      history: [{ at: nowFmt(), action: "Healthy", by: "Health probe" }], createdAt: now(), updatedAt: now() },
    { id: "SVC-DB", title: "Primary Database", subtitle: "replica lag 120ms", status: "degraded",
      fields: { Kind: "Service", Uptime: "99.9%", Latency: "120ms", Errors: 2 },
      history: [{ at: nowFmt(), action: "Replica lag alert", by: "Health probe" }], createdAt: now(), updatedAt: now() },
  ];
  const workflowInbox: WorkflowItem[] = [
    { id: "WI-2201", title: "Approve auth · AUTH-40921", subtitle: "Discovery · N. Dlamini", status: "assigned",
      fields: { Kind: "Task", Assignee: "Case Mgr J. Adams", Origin: "Authorisations", DueIn: "2h" },
      history: [{ at: nowFmt(), action: "Task created", by: "Workflow" }], createdAt: now(), updatedAt: now() },
    { id: "WI-2202", title: "Review discharge summary · E. Carter", subtitle: "Ward 3B", status: "in-progress",
      fields: { Kind: "Task", Assignee: "Dr. L. Pillay", Origin: "Ward", DueIn: "6h" },
      history: [{ at: nowFmt(), action: "Assigned", by: "Workflow" }], createdAt: now(), updatedAt: now() },
  ];
  const services: WorkflowItem[] = [
    { id: "SVC-20411", title: "General Ward — Bed Day", subtitle: "Tariff 00190 · Discovery Health · R 3 480",
      status: "active", fields: { "Tariff code": "00190", Category: "Accommodation", Scheme: "Discovery Health", "Unit price (R)": "3480", Facility: "Life Fourways" },
      history: [{ at: nowFmt(), action: "Service published", by: "Catalogue Admin" }], createdAt: now(), updatedAt: now() },
    { id: "SVC-20412", title: "ICU — Bed Day", subtitle: "Tariff 00202 · GEMS · R 12 950",
      status: "active", fields: { "Tariff code": "00202", Category: "Accommodation", Scheme: "GEMS", "Unit price (R)": "12950", Facility: "Life Kingsbury" },
      history: [{ at: nowFmt(), action: "Service published", by: "Catalogue Admin" }], createdAt: now(), updatedAt: now() },
    { id: "SVC-20413", title: "Theatre — Major Session (2h)", subtitle: "Tariff 01475 · Bonitas · R 18 400",
      status: "active", fields: { "Tariff code": "01475", Category: "Theatre", Scheme: "Bonitas", "Unit price (R)": "18400", Facility: "Life Groenkloof" },
      history: [{ at: nowFmt(), action: "Service published", by: "Catalogue Admin" }], createdAt: now(), updatedAt: now() },
    { id: "SVC-20414", title: "MRI Lumbar Spine", subtitle: "Tariff 34101 · Momentum Health · R 8 750",
      status: "review", fields: { "Tariff code": "34101", Category: "Radiology", Scheme: "Momentum Health", "Unit price (R)": "8750", Facility: "Life Vincent Pallotti" },
      history: [{ at: nowFmt(), action: "Price under review", by: "Finance" }], createdAt: now(), updatedAt: now() },
    { id: "SVC-20415", title: "Pharmacy Dispensing Fee", subtitle: "Tariff PH-001 · All schemes · R 62",
      status: "active", fields: { "Tariff code": "PH-001", Category: "Pharmacy", Scheme: "All schemes", "Unit price (R)": "62", Facility: "All facilities" },
      history: [{ at: nowFmt(), action: "Service published", by: "Catalogue Admin" }], createdAt: now(), updatedAt: now() },
    { id: "SVC-20416", title: "Consumables — Suture Pack", subtitle: "Tariff CS-118 · Polmed · R 245",
      status: "draft", fields: { "Tariff code": "CS-118", Category: "Consumables", Scheme: "Polmed", "Unit price (R)": "245", Facility: "Life Westville" },
      history: [{ at: nowFmt(), action: "Draft created", by: "Catalogue Admin" }], createdAt: now(), updatedAt: now() },
  ];

  return {
    patients, admissions, authorisations, pharmacy, theatre, ward,
    facilities, practitioners, "case-management": cases, billing, funding,
    documents, integrations, audit, admin, reports,
    triage, preadmissions, coid, adhoc, accounting,
    "clinical-assessments": clinicalAssessments,
    "medical-events": medicalEvents,
    "clinical-coding": clinicalCoding,
    reimbursements,
    "supplier-invoices": supplierInvoices,
    "account-enquiries": accountEnquiries,
    "service-bus": serviceBus,
    "failed-messages": failedMessages,
    notifications,
    "system-health": systemHealth,
    "workflow-inbox": workflowInbox,
    services,
  };
}

export const useWorkflow = create<State>()(
  persist(
    (set) => ({
      items: seed(),
      create: (mod, item) => {
        const rec: WorkflowItem = {
          ...item,
          id: uid(mod.slice(0, 3).toUpperCase()),
          createdAt: now(),
          updatedAt: now(),
          history: [{ at: nowFmt(), action: "Created", by: "You" }],
        };
        set((s) => ({ items: { ...s.items, [mod]: [rec, ...s.items[mod]] } }));
        return rec;
      },
      update: (mod, id, patch) =>
        set((s) => ({
          items: {
            ...s.items,
            [mod]: s.items[mod].map((i) => (i.id === id ? { ...i, ...patch, updatedAt: now() } : i)),
          },
        })),
      remove: (mod, id) =>
        set((s) => ({ items: { ...s.items, [mod]: s.items[mod].filter((i) => i.id !== id) } })),
      advance: (mod, id, toStatus, note) =>
        set((s) => ({
          items: {
            ...s.items,
            [mod]: s.items[mod].map((i) =>
              i.id === id
                ? {
                    ...i,
                    status: toStatus,
                    updatedAt: now(),
                    history: [
                      { at: nowFmt(), action: `Moved to "${toStatus}"`, by: "You", note },
                      ...i.history,
                    ],
                  }
                : i,
            ),
          },
        })),
      addNote: (mod, id, note) =>
        set((s) => ({
          items: {
            ...s.items,
            [mod]: s.items[mod].map((i) =>
              i.id === id
                ? {
                    ...i,
                    updatedAt: now(),
                    history: [{ at: nowFmt(), action: "Note added", by: "You", note }, ...i.history],
                  }
                : i,
            ),
          },
        })),
    }),
    {
      name: "impilo-workflow-v3",
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>;
        const seeded = seed();
        const mergedItems = { ...seeded } as Record<ModuleKey, WorkflowItem[]>;
        if (p.items) {
          for (const k of Object.keys(p.items) as ModuleKey[]) {
            const val = (p.items as Record<string, WorkflowItem[] | undefined>)[k];
            if (Array.isArray(val)) mergedItems[k] = val;
          }
        }
        return { ...current, ...p, items: mergedItems };
      },
    },
  ),
);
