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
  | "workflow-inbox";

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
  const integrations: WorkflowItem[] = seedEvents.map((e) => ({
    id: e.id,
    title: e.topic,
    subtitle: e.correlationId,
    status: e.status,
    fields: { Attempts: e.attempts, "Latency (ms)": e.latencyMs, Created: e.createdAt },
    history: [{ at: nowFmt(), action: "Event received", by: "Service Bus" }],
    createdAt: now(),
    updatedAt: now(),
  }));

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
      status: "logged", fields: { Actor: "Dr. S. Naidoo", Correlation: "c-4f2a…9b", Module: "Authorisations" },
      history: [{ at: nowFmt(), action: "Recorded", by: "Audit trail" }], createdAt: now(), updatedAt: now() },
    { id: "AUD-1002", title: "Bed BED-3B-12 assigned", subtitle: "Ward Manager",
      status: "logged", fields: { Actor: "Ward Mgr", Correlation: "c-71a3…4e", Module: "Ward" },
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
    { name: "impilo-workflow-v2" },
  ),
);
