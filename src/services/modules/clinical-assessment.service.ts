/**
 * Clinical Assessment service — mock-only typed operations for the module
 * plus the shared module-service export used by the registry/worklist.
 *
 * All operations are deterministic and clearly isolated to this module —
 * no live backend calls, no shared writes into other modules' stores.
 */
import { createModuleService } from "@/services/modules/base-module.service";
import type { ModuleService } from "@/services/modules/types";
import {
  CA_SEED_RECORDS, CA_PREADMISSIONS, type MockPreadmission,
} from "@/modules/clinical-assessments/mock/clinical-assessment-mock-data";
import type {
  AssessmentAction, AssessmentRecord, AssessmentState,
  ViewSearchQuery,
} from "@/modules/clinical-assessments/contracts";

const base = createModuleService({
  moduleKey: "clinical-assessment",
  basePath: "clinical-assessments",
  workflowKey: "clinical-assessments",
});

// Local, mutable, in-memory store isolated to this module.
const store: AssessmentRecord[] = CA_SEED_RECORDS.map((r) => ({ ...r }));
let seq = store.length;

function nextAssessmentNumber(): string {
  seq += 1;
  return `CA-2026-${String(seq).padStart(4, "0")}`;
}

function nowIso() {
  return new Date().toISOString();
}

function reduceActions(state: AssessmentState, locked: boolean): AssessmentAction[] {
  if (locked) return ["view"];
  switch (state) {
    case "Draft":       return ["continue", "view", "cancel"];
    case "InProgress":  return ["continue", "view", "lock", "cancel"];
    case "Incomplete":  return ["continue", "view", "cancel"];
    case "Completed":   return ["view", "print", "correct"];
    case "Corrected":   return ["view", "print"];
    case "Cancelled":   return ["view"];
    case "AwaitingCountersignature": return ["view", "countersign"];
    default:            return ["view"];
  }
}

export type CreateAssessmentInput = {
  patientId: string; patientName: string; patientInitials: string;
  patientDob: string; patientGender: "M" | "F" | "X"; mrn: string;
  facilityId: string; facilityName: string;
  wardId?: string; admissionId?: string; preadmissionId?: string;
  type: AssessmentRecord["type"]; reason: AssessmentRecord["reason"];
  assessmentDate: string; assessor: string; participants?: string;
  sections?: Partial<Pick<AssessmentRecord,
    "integrity" | "general" | "treatment" | "illness" | "vitals" |
    "urinalysis" | "acuity" | "codes" | "notes"
  >>;
  completenessPercent?: number;
};

export const clinicalAssessmentService: ModuleService & {
  listAssessments(query?: Partial<ViewSearchQuery>): AssessmentRecord[];
  getAssessment(id: string): AssessmentRecord | null;
  listPreadmissions(patientId?: string): MockPreadmission[];
  createAssessment(input: CreateAssessmentInput): AssessmentRecord;
  transitionAssessment(id: string, to: AssessmentState, by: string, reason?: string): AssessmentRecord | null;
  lockAssessment(id: string, by: string): AssessmentRecord | null;
  unlockAssessment(id: string): AssessmentRecord | null;
  replacePatient(id: string, next: { patientId: string; patientName: string; mrn: string; reason: string; by: string }): AssessmentRecord | null;
  linkPreadmission(id: string, preadmissionId: string | null, by: string): AssessmentRecord | null;
  appendTimeline(id: string, entry: string, by: string): AssessmentRecord | null;
} = {
  ...base,

  listAssessments(query = {}) {
    return store.filter((r) => {
      if (query.facilityId && r.facilityId !== query.facilityId) return false;
      if (query.state && r.state !== query.state) return false;
      if (query.assessmentNumber && !r.assessmentNumber.toLowerCase().includes(query.assessmentNumber.toLowerCase())) return false;
      if (query.surname) {
        const s = query.surname.toLowerCase();
        if (!r.patientName.toLowerCase().includes(s)) return false;
      }
      if (query.name) {
        const s = query.name.toLowerCase();
        if (!r.patientName.toLowerCase().includes(s)) return false;
      }
      if (query.gender && r.patientGender !== query.gender) return false;
      if (query.dob && r.patientDob !== query.dob) return false;
      if (query.fromDate && r.assessmentDate < query.fromDate) return false;
      if (query.toDate && r.assessmentDate > query.toDate) return false;
      return true;
    }).slice().sort((a, b) => b.assessmentDate.localeCompare(a.assessmentDate));
  },

  getAssessment(id) {
    return store.find((r) => r.id === id) ?? null;
  },

  listPreadmissions(patientId) {
    return patientId
      ? CA_PREADMISSIONS.filter((p) => p.patientId === patientId)
      : CA_PREADMISSIONS.slice();
  },

  createAssessment(input) {
    const number = nextAssessmentNumber();
    const rec: AssessmentRecord = {
      id: number,
      assessmentNumber: number,
      patientId: input.patientId,
      patientName: input.patientName,
      patientInitials: input.patientInitials,
      patientDob: input.patientDob,
      patientGender: input.patientGender,
      mrn: input.mrn,
      facilityId: input.facilityId,
      facilityName: input.facilityName,
      wardId: input.wardId,
      admissionId: input.admissionId,
      preadmissionId: input.preadmissionId,
      type: input.type,
      reason: input.reason,
      assessmentDate: input.assessmentDate,
      assessor: input.assessor,
      participants: input.participants,
      state: "Completed",
      completenessPercent: input.completenessPercent ?? 100,
      availableActions: reduceActions("Completed", false),
      createdAt: nowIso(), updatedAt: nowIso(),
      stateHistory: [
        { at: new Date().toLocaleString("en-ZA"), from: "—", to: "Draft", by: input.assessor },
        { at: new Date().toLocaleString("en-ZA"), from: "Draft", to: "InProgress", by: input.assessor },
        { at: new Date().toLocaleString("en-ZA"), from: "InProgress", to: "Completed", by: input.assessor },
      ],
      timeline: [
        { at: new Date().toLocaleString("en-ZA"), entry: "Assessment captured through the guided workflow", by: input.assessor },
        { at: new Date().toLocaleString("en-ZA"), entry: "Clinical record generated and marked completed", by: input.assessor },
      ],
      ...input.sections,
    };
    store.unshift(rec);
    return rec;
  },

  transitionAssessment(id, to, by, reason) {
    const r = store.find((x) => x.id === id);
    if (!r) return null;
    const from = r.state;
    r.state = to;
    r.updatedAt = nowIso();
    r.availableActions = reduceActions(to, !!r.lockedBy);
    r.stateHistory.push({ at: new Date().toLocaleString("en-ZA"), from, to, by, reason });
    r.timeline.push({ at: new Date().toLocaleString("en-ZA"), entry: `State changed to ${to}${reason ? ` — ${reason}` : ""}`, by });
    return r;
  },

  lockAssessment(id, by) {
    const r = store.find((x) => x.id === id);
    if (!r) return null;
    r.lockedBy = by;
    r.lockedAt = new Date().toLocaleString("en-ZA");
    r.availableActions = reduceActions(r.state, true);
    r.timeline.push({ at: r.lockedAt, entry: "Assessment locked", by });
    return r;
  },

  unlockAssessment(id) {
    const r = store.find((x) => x.id === id);
    if (!r) return null;
    const by = r.lockedBy ?? "System";
    r.lockedBy = undefined;
    r.lockedAt = undefined;
    r.availableActions = reduceActions(r.state, false);
    r.timeline.push({ at: new Date().toLocaleString("en-ZA"), entry: "Assessment unlocked", by });
    return r;
  },

  replacePatient(id, next) {
    const r = store.find((x) => x.id === id);
    if (!r) return null;
    r.patientId = next.patientId;
    r.patientName = next.patientName;
    r.mrn = next.mrn;
    r.updatedAt = nowIso();
    r.timeline.push({ at: new Date().toLocaleString("en-ZA"), entry: `Patient replaced with ${next.patientName} — ${next.reason}`, by: next.by });
    return r;
  },

  linkPreadmission(id, preadmissionId, by) {
    const r = store.find((x) => x.id === id);
    if (!r) return null;
    r.preadmissionId = preadmissionId ?? undefined;
    r.updatedAt = nowIso();
    r.timeline.push({
      at: new Date().toLocaleString("en-ZA"),
      entry: preadmissionId ? `Preadmission ${preadmissionId} linked` : "Preadmission detached",
      by,
    });
    return r;
  },

  appendTimeline(id, entry, by) {
    const r = store.find((x) => x.id === id);
    if (!r) return null;
    r.timeline.push({ at: new Date().toLocaleString("en-ZA"), entry, by });
    return r;
  },
};
