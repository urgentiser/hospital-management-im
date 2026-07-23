/**
 * Patient Maintenance service — mock-only typed operations for the module
 * plus the shared module-service export used by the module registry / worklist.
 *
 * Isolated in-memory store. No live backend calls.
 */
import { createModuleService } from "@/services/modules/base-module.service";
import type { ModuleService } from "@/services/modules/types";
import {
  PM_SEED_PATIENTS,
} from "@/modules/patient-maintenance/mock/patient-maintenance-mock-data";
import type {
  ContactUpdateInput, CreatePatientInput, DuplicateMatch, PatientDocument,
  PatientRecord, PatientSearchQuery, PrintJob, TimelineEntry,
} from "@/modules/patient-maintenance/contracts";

const store: PatientRecord[] = PM_SEED_PATIENTS.map((p) => ({ ...p, documents: [...p.documents], timeline: [...p.timeline], visits: [...p.visits], alerts: [...p.alerts], relationships: [...p.relationships] }));
let mrnSeq = 32700;
let docSeq = 9000;
let jobSeq = 5000;
const printJobs: PrintJob[] = [];

function nowIso() { return new Date().toISOString(); }
function stamp() { return new Date().toLocaleString("en-ZA"); }

function nextMrn(): string {
  mrnSeq += 1;
  return `MRN-00${mrnSeq}`;
}
function nextPatientId(): string {
  const n = store.length + 10241;
  return `P-${n}`;
}
function nextDocId(): string { docSeq += 1; return `DOC-${docSeq}`; }
function nextJobId(): string { jobSeq += 1; return `PJ-${jobSeq}`; }

function textMatch(hay: string | undefined, needle: string): boolean {
  if (!hay) return false;
  return hay.toLowerCase().includes(needle.toLowerCase());
}

const base = createModuleService({
  moduleKey: "patient-maintenance",
  basePath: "patients",
  workflowKey: "patients",
});

export const patientMaintenanceService: ModuleService & {
  listPatients(query?: PatientSearchQuery): PatientRecord[];
  getPatient(id: string): PatientRecord | null;
  searchDuplicates(input: {
    identifierType?: string; identifierValue?: string;
    firstName?: string; surname?: string; dateOfBirth?: string; phone?: string;
  }): DuplicateMatch[];
  createDraft(): { draftId: string };
  registerPatient(input: CreatePatientInput, by: string): PatientRecord;
  updateContact(id: string, input: ContactUpdateInput, by: string): PatientRecord | null;
  lockPatient(id: string, by: string): PatientRecord | null;
  unlockPatient(id: string): PatientRecord | null;
  listDocuments(id: string): PatientDocument[];
  createPrintJob(input: { patientId: string; documentIds: string[]; printer: string; copies: number; requestedBy: string }): PrintJob;
  listPrintJobs(patientId: string): PrintJob[];
  appendTimeline(id: string, entry: Omit<TimelineEntry, "at">): PatientRecord | null;
} = {
  ...base,

  listPatients(query = {}) {
    let items = store.slice();
    if (query.facility) items = items.filter((p) => p.facility === query.facility);
    if (query.status) items = items.filter((p) => p.status === query.status);
    if (query.fundingMethod) items = items.filter((p) => p.funding.method === query.fundingMethod);
    if (query.mrn) items = items.filter((p) => textMatch(p.mrn, query.mrn!));
    if (query.identifier) items = items.filter((p) => textMatch(p.identifierValue, query.identifier!));
    if (query.surname) items = items.filter((p) => textMatch(p.surname, query.surname!));
    if (query.firstName) items = items.filter((p) => textMatch(p.firstName, query.firstName!));
    if (query.dateOfBirth) items = items.filter((p) => p.dateOfBirth === query.dateOfBirth);
    if (query.phone) items = items.filter((p) => textMatch(p.contact.mobile, query.phone!) || textMatch(p.contact.alternatePhone, query.phone!));
    if (query.email) items = items.filter((p) => textMatch(p.contact.email, query.email!));
    if (query.q) {
      const q = query.q.trim().toLowerCase();
      items = items.filter((p) => [
        p.firstName, p.surname, p.mrn, p.identifierValue, p.contact.mobile, p.contact.email, p.facility,
      ].filter(Boolean).some((v) => v!.toLowerCase().includes(q)));
    }
    return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  getPatient(id) {
    return store.find((p) => p.id === id) ?? null;
  },

  searchDuplicates(input) {
    const matches: DuplicateMatch[] = [];
    for (const p of store) {
      const on: string[] = [];
      let score = 0;
      if (input.identifierValue && p.identifierValue && p.identifierValue === input.identifierValue) { on.push("Identifier"); score += 70; }
      if (input.dateOfBirth && p.dateOfBirth === input.dateOfBirth) { on.push("Date of birth"); score += 15; }
      if (input.surname && textMatch(p.surname, input.surname)) { on.push("Surname"); score += 10; }
      if (input.firstName && textMatch(p.firstName, input.firstName)) { on.push("First name"); score += 8; }
      if (input.phone && (textMatch(p.contact.mobile, input.phone) || textMatch(p.contact.alternatePhone, input.phone))) { on.push("Phone"); score += 10; }
      if (score === 0) continue;
      const confidence = Math.min(100, score);
      const strength: DuplicateMatch["strength"] = confidence >= 85 ? "Exact" : confidence >= 55 ? "Probable" : "Possible";
      matches.push({ patient: p, confidence, matchedOn: on, strength });
    }
    return matches.sort((a, b) => b.confidence - a.confidence);
  },

  createDraft() {
    return { draftId: `PM-DRAFT-${Date.now().toString(36).toUpperCase()}` };
  },

  registerPatient(input, by) {
    const id = nextPatientId();
    const mrn = nextMrn();
    const now = nowIso();
    const record: PatientRecord = {
      ...input,
      id, mrn,
      status: "Active",
      documents: [],
      visits: [],
      alerts: input.alerts ?? [],
      timeline: [
        { at: stamp(), entry: `Patient registered — MRN ${mrn} issued`, by, category: "Registration" },
      ],
      createdAt: now,
      updatedAt: now,
    };
    store.unshift(record);
    return record;
  },

  updateContact(id, input, by) {
    const r = store.find((x) => x.id === id);
    if (!r) return null;
    const before: Record<string, string | undefined> = {
      mobile: r.contact.mobile,
      alternatePhone: r.contact.alternatePhone,
      email: r.contact.email,
      preferredChannel: r.contact.preferredChannel,
      residentialLine1: r.contact.residentialAddress?.line1,
      postalLine1: r.contact.postalAddress?.line1,
    };
    r.contact = {
      ...r.contact,
      mobile: input.mobile ?? r.contact.mobile,
      alternatePhone: input.alternatePhone ?? r.contact.alternatePhone,
      email: input.email ?? r.contact.email,
      preferredChannel: input.preferredChannel ?? r.contact.preferredChannel,
      residentialAddress: input.residentialAddress ?? r.contact.residentialAddress,
      postalAddress: input.postalAddress ?? r.contact.postalAddress,
    };
    const after: Record<string, string | undefined> = {
      mobile: r.contact.mobile,
      alternatePhone: r.contact.alternatePhone,
      email: r.contact.email,
      preferredChannel: r.contact.preferredChannel,
      residentialLine1: r.contact.residentialAddress?.line1,
      postalLine1: r.contact.postalAddress?.line1,
    };
    r.updatedAt = nowIso();
    r.timeline.unshift({
      at: stamp(),
      entry: `Contact details updated — ${input.reason}`,
      by,
      category: "Contact",
      before,
      after,
    });
    return r;
  },

  lockPatient(id, by) {
    const r = store.find((x) => x.id === id);
    if (!r) return null;
    r.lockedBy = by;
    r.lockedAt = stamp();
    r.timeline.unshift({ at: stamp(), entry: "Patient record locked", by, category: "System" });
    return r;
  },

  unlockPatient(id) {
    const r = store.find((x) => x.id === id);
    if (!r) return null;
    const by = r.lockedBy ?? "System";
    r.lockedBy = undefined;
    r.lockedAt = undefined;
    r.timeline.unshift({ at: stamp(), entry: "Patient record unlocked", by, category: "System" });
    return r;
  },

  listDocuments(id) {
    return store.find((x) => x.id === id)?.documents.slice() ?? [];
  },

  createPrintJob(input) {
    const r = store.find((x) => x.id === input.patientId);
    const job: PrintJob = {
      id: nextJobId(),
      patientId: input.patientId,
      documentIds: [...input.documentIds],
      printer: input.printer,
      copies: input.copies,
      requestedBy: input.requestedBy,
      requestedAt: stamp(),
      status: "Printed",
      reference: `PRT-${Date.now().toString(36).toUpperCase()}`,
    };
    printJobs.unshift(job);
    if (r) {
      r.timeline.unshift({
        at: stamp(),
        entry: `Print job ${job.reference} — ${input.documentIds.length} document(s) to ${input.printer} × ${input.copies}`,
        by: input.requestedBy,
        category: "Document",
      });
      r.updatedAt = nowIso();
    }
    return job;
  },

  listPrintJobs(patientId) {
    return printJobs.filter((j) => j.patientId === patientId).slice();
  },

  appendTimeline(id, entry) {
    const r = store.find((x) => x.id === id);
    if (!r) return null;
    r.timeline.unshift({ at: stamp(), ...entry });
    return r;
  },
};

// Ensure the seed data has at least one linked document reference for typing.
void nextDocId;
