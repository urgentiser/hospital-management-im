/**
 * Triage service — mock-only typed operations for the Triage module.
 * Isolated in-memory store; no live backend calls; does not write into
 * other modules' stores.
 */
import { createModuleService } from "@/services/modules/base-module.service";
import type { ModuleService } from "@/services/modules/types";
import {
  TRIAGE_SEED_RECORDS, TRIAGE_OPEN_VISIT_PATIENT_IDS,
  TRIAGE_SEVERITY_RANGES, TRIAGE_HOSPITAL_UNITS,
  TRIAGE_AMBULANCE_GROUPS, TRIAGE_PRACTITIONERS,
  TRIAGE_OVERRIDE_REASONS, TRIAGE_FACILITIES,
} from "@/modules/triage/mock/triage-mock-data";
import type {
  AmbulanceGroup, CompleteTriageInput, CreateTriageInput,
  HospitalUnit, OverrideReason, Practitioner, ReassessTriageInput,
  TriageObservationSet, TriageRecord, TriageSearchQuery, TriageSeverity,
  TriageState, TriageFindingFlags,
} from "@/modules/triage/contracts";

const base = createModuleService({
  moduleKey: "triage",
  basePath: "triage",
  workflowKey: "triage",
});

const store: TriageRecord[] = TRIAGE_SEED_RECORDS.map((r) => ({
  ...r,
  observations: r.observations.map((o) => ({ ...o, findings: { ...o.findings } })),
  stateHistory: [...r.stateHistory],
  timeline: [...r.timeline],
}));

const openVisitPatients = new Set(TRIAGE_OPEN_VISIT_PATIENT_IDS);

let seq = store.length;
function nextReference(): string {
  seq += 1;
  return `TRG-2026-${String(seq).padStart(4, "0")}`;
}
function nowIso(): string { return new Date().toISOString(); }
function stamp(): string { return new Date().toLocaleString("en-ZA"); }

// Deterministic mock score from observation values + findings.
// This is UI mock workflow data, not a production clinical scoring engine.
export function calculateScore(o: Partial<TriageObservationSet>): number {
  let s = 0;
  const rr = Number(o.respiratoryRate ?? 0);
  if (rr && (rr < 10 || rr > 30)) s += 3;
  else if (rr && (rr < 12 || rr > 24)) s += 2;
  else if (rr) s += 1;

  const hr = Number(o.heartRate ?? 0);
  if (hr && (hr < 40 || hr > 140)) s += 3;
  else if (hr && (hr < 50 || hr > 120)) s += 2;
  else if (hr) s += 1;

  const sbp = Number(o.systolicBp ?? 0);
  if (sbp && (sbp < 90 || sbp > 200)) s += 3;
  else if (sbp && (sbp < 100 || sbp > 180)) s += 2;
  else if (sbp) s += 1;

  const t = Number(o.temperature ?? 0);
  if (t && (t < 35 || t >= 39)) s += 2;
  else if (t && (t < 36 || t > 38)) s += 1;

  switch (o.avpu) {
    case "Unresponsive": s += 5; break;
    case "Pain":         s += 3; break;
    case "Voice":        s += 2; break;
    case "Alert":        s += 0; break;
  }
  switch (o.mobility) {
    case "Immobile":  s += 3; break;
    case "Stretcher": s += 2; break;
    case "Wheelchair": s += 1; break;
    case "With aid": s += 1; break;
  }
  switch (o.trauma) {
    case "Severe":       s += 4; break;
    case "Significant":  s += 2; break;
    case "Minor":        s += 1; break;
  }
  const flags = (o.findings ?? {}) as TriageFindingFlags;
  const criticalFlags: Array<keyof TriageFindingFlags> = [
    "haemorrhage", "seizure", "stridor", "focalNeurology", "highEnergyTransfer",
    "haemoptysis", "threatenedLimb", "poisoning",
  ];
  const majorFlags: Array<keyof TriageFindingFlags> = [
    "chestPain", "shortnessOfBreath", "purpura", "prBleeding", "burn",
    "psychosis", "diabeticConcern", "pregnancy", "abdominalPain",
  ];
  for (const f of criticalFlags) if (flags[f]) s += 3;
  for (const f of majorFlags)   if (flags[f]) s += 2;
  for (const k of Object.keys(flags) as Array<keyof TriageFindingFlags>) {
    if (!criticalFlags.includes(k) && !majorFlags.includes(k) && flags[k]) s += 1;
  }
  return s;
}

export function resolveSeverity(score: number): TriageSeverity {
  for (const r of TRIAGE_SEVERITY_RANGES) {
    if (score >= r.min && score <= r.max) return r.severity;
  }
  return "Blue";
}

function reduceHistory(state: TriageState): TriageState[] {
  return [state];
}
void reduceHistory; // reserved for future transitions

export const triageService: ModuleService & {
  listTriage(query?: TriageSearchQuery): TriageRecord[];
  getTriage(id: string): TriageRecord | null;
  hasOpenVisit(patientId: string): boolean;
  createTriage(input: CreateTriageInput): TriageRecord;
  saveObservations(id: string, obs: TriageObservationSet, by: string): TriageRecord | null;
  reassessTriage(input: ReassessTriageInput): TriageRecord | null;
  lockTriage(id: string, by: string): TriageRecord | null;
  unlockTriage(id: string): TriageRecord | null;
  completeTriage(input: CompleteTriageInput): TriageRecord | null;
  cancelTriage(id: string, by: string, reason: string): TriageRecord | null;
  listHospitalUnits(facilityId?: string): HospitalUnit[];
  listAmbulanceGroups(): AmbulanceGroup[];
  listPractitioners(): Practitioner[];
  listOverrideReasons(): OverrideReason[];
  listFacilities(): typeof TRIAGE_FACILITIES;
  calculateScore(o: Partial<TriageObservationSet>): number;
  resolveSeverity(score: number): TriageSeverity;
  appendTimeline(id: string, entry: string, by: string): TriageRecord | null;
} = {
  ...base,

  listTriage(query = {}) {
    const today = new Date().toDateString();
    return store.filter((r) => {
      if (query.facilityId && r.facilityId !== query.facilityId) return false;
      if (query.state && r.state !== query.state) return false;
      if (query.severity && r.currentSeverity !== query.severity) return false;
      if (query.locked === "locked" && !r.lockedBy) return false;
      if (query.locked === "unlocked" && r.lockedBy) return false;
      if (query.q) {
        const q = query.q.toLowerCase();
        const hay = `${r.patientName} ${r.patientMrn ?? ""} ${r.visitNumber ?? ""} ${r.reference}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (query.savedView === "waiting" && r.state !== "Waiting") return false;
      if (query.savedView === "high-severity" && !(r.currentSeverity === "Red" || r.currentSeverity === "Orange")) return false;
      if (query.savedView === "locked" && !r.lockedBy) return false;
      if (query.savedView === "completed-today") {
        if (r.state !== "Completed") return false;
        if (!r.endedAt || new Date(r.endedAt).toDateString() !== today) return false;
      }
      return true;
    }).slice().sort((a, b) => {
      const order: Record<TriageState, number> = { InProgress: 0, Reassessed: 1, Waiting: 2, Completed: 3, Cancelled: 4 };
      const so = order[a.state] - order[b.state];
      if (so !== 0) return so;
      return b.arrivalAt.localeCompare(a.arrivalAt);
    });
  },

  getTriage(id) { return store.find((r) => r.id === id) ?? null; },

  hasOpenVisit(patientId) { return openVisitPatients.has(patientId); },

  createTriage(input) {
    if (input.patientId && openVisitPatients.has(input.patientId)) {
      throw new Error("This patient already has an open A&E/Triage visit. Attend the existing record instead.");
    }
    const reference = nextReference();
    const observation: TriageObservationSet = {
      recordedAt: nowIso(),
      recordedBy: input.observation.recordedBy ?? input.createdBy,
      mobility: input.observation.mobility,
      respiratoryRate: input.observation.respiratoryRate,
      heartRate: input.observation.heartRate,
      systolicBp: input.observation.systolicBp,
      temperature: input.observation.temperature,
      avpu: input.observation.avpu,
      trauma: input.observation.trauma,
      findings: { ...(input.observation.findings ?? {}) },
      score: input.observation.score ?? calculateScore(input.observation),
      severity: input.observation.severity ?? resolveSeverity(input.observation.score ?? calculateScore(input.observation)),
      overridden: input.observation.overridden,
      overrideReason: input.observation.overrideReason,
      overrideBy: input.observation.overrideBy,
      note: input.observation.note,
    };
    const record: TriageRecord = {
      id: reference,
      reference,
      facilityId: input.facilityId,
      hospitalUnit: input.hospitalUnit,
      patientId: input.patientId,
      patientName: input.patientName,
      patientMrn: input.patientMrn,
      patientMaskedIdentifier: input.patientMaskedIdentifier,
      patientType: input.patientType,
      unknown: input.unknown,
      gender: input.gender,
      arrivalAt: input.arrivalAt,
      arrivalMode: input.arrivalMode,
      ambulanceGroup: input.ambulanceGroup,
      presentingComplaint: input.presentingComplaint,
      isInjury: input.isInjury,
      injury: input.injury,
      isPoisoning: input.isPoisoning,
      poisoning: input.poisoning,
      practitioner: input.practitioner,
      observations: [observation],
      currentScore: observation.score,
      currentSeverity: observation.severity,
      overridden: !!observation.overridden,
      state: "Waiting",
      startedAt: input.arrivalAt,
      createdBy: input.createdBy,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      stateHistory: [
        { at: stamp(), from: "—", to: "Waiting", by: input.createdBy },
      ],
      timeline: [
        { at: stamp(), entry: `Triage record created (${reference})`, by: input.createdBy },
        {
          at: stamp(),
          entry: `First observation recorded — severity ${observation.severity} (score ${observation.score})${observation.overridden ? ` · overridden by ${observation.overrideBy ?? "senior clinician"}` : ""}`,
          by: observation.recordedBy,
        },
      ],
    };
    store.unshift(record);
    if (input.patientId) openVisitPatients.add(input.patientId);
    return record;
  },

  saveObservations(id, obs, by) {
    const r = store.find((x) => x.id === id);
    if (!r) return null;
    r.observations.push(obs);
    r.currentScore = obs.score;
    r.currentSeverity = obs.severity;
    if (obs.overridden) r.overridden = true;
    r.updatedAt = nowIso();
    r.timeline.push({ at: stamp(), entry: `Observation set recorded — severity ${obs.severity} (score ${obs.score})`, by });
    return r;
  },

  reassessTriage(input) {
    const r = store.find((x) => x.id === input.triageId);
    if (!r) return null;
    if (r.state === "Completed" || r.state === "Cancelled") {
      throw new Error("Cannot reassess a completed or cancelled triage record.");
    }
    if (r.lockedBy && r.lockedBy !== input.by) {
      throw new Error(`Record is locked by ${r.lockedBy}. Ask them to release or take over the lock.`);
    }
    const prevSeverity = r.currentSeverity;
    const score = input.observation.score ?? calculateScore(input.observation);
    const severity = input.observation.severity ?? resolveSeverity(score);
    const obs: TriageObservationSet = {
      recordedAt: nowIso(),
      recordedBy: input.by,
      mobility: input.observation.mobility,
      respiratoryRate: input.observation.respiratoryRate,
      heartRate: input.observation.heartRate,
      systolicBp: input.observation.systolicBp,
      temperature: input.observation.temperature,
      avpu: input.observation.avpu,
      trauma: input.observation.trauma,
      findings: { ...(input.observation.findings ?? {}) },
      score, severity,
      overridden: input.observation.overridden,
      overrideReason: input.observation.overrideReason,
      overrideBy: input.observation.overrideBy,
      note: input.note ?? input.observation.note,
    };
    if (severity !== prevSeverity && !obs.note) {
      throw new Error("A note is required when a reassessment changes severity.");
    }
    r.observations.push(obs);
    r.currentScore = obs.score;
    r.currentSeverity = obs.severity;
    if (obs.overridden) r.overridden = true;
    r.updatedAt = nowIso();
    const from = r.state;
    if (r.state !== "Reassessed") r.state = "Reassessed";
    r.stateHistory.push({ at: stamp(), from, to: r.state, by: input.by, reason: "Reassessment recorded" });
    r.timeline.push({
      at: stamp(),
      entry: `Reassessment — severity ${prevSeverity} → ${severity} (score ${score})${obs.note ? ` · ${obs.note}` : ""}`,
      by: input.by,
    });
    return r;
  },

  lockTriage(id, by) {
    const r = store.find((x) => x.id === id);
    if (!r) return null;
    if (r.lockedBy && r.lockedBy !== by) {
      throw new Error(`Record is already locked by ${r.lockedBy}.`);
    }
    r.lockedBy = by;
    r.lockedAt = stamp();
    if (r.state === "Waiting") {
      r.stateHistory.push({ at: stamp(), from: "Waiting", to: "InProgress", by });
      r.state = "InProgress";
    }
    r.timeline.push({ at: r.lockedAt, entry: `Record locked for attendance by ${by}`, by });
    return r;
  },

  unlockTriage(id) {
    const r = store.find((x) => x.id === id);
    if (!r) return null;
    const by = r.lockedBy ?? "System";
    r.lockedBy = undefined;
    r.lockedAt = undefined;
    r.timeline.push({ at: stamp(), entry: "Record unlocked", by });
    return r;
  },

  completeTriage(input) {
    const r = store.find((x) => x.id === input.triageId);
    if (!r) return null;
    if (r.state === "Completed") return r;
    if (r.state === "Cancelled") {
      throw new Error("Cannot complete a cancelled triage record.");
    }
    if (r.lockedBy && r.lockedBy !== input.by) {
      throw new Error(`Record is locked by ${r.lockedBy}.`);
    }
    if (!r.practitioner) {
      throw new Error("A treating practitioner must be set before completion.");
    }
    const endedAt = input.endedAt ?? nowIso();
    if (new Date(endedAt).getTime() < new Date(r.startedAt).getTime()) {
      throw new Error("Completion time cannot be before the triage start time.");
    }
    if (new Date(endedAt).getTime() > Date.now() + 60_000) {
      throw new Error("Completion time cannot be in the future.");
    }
    const from = r.state;
    r.state = "Completed";
    r.endedAt = endedAt;
    r.updatedAt = nowIso();
    r.stateHistory.push({ at: stamp(), from, to: "Completed", by: input.by, reason: input.outcomeNote });
    r.timeline.push({ at: stamp(), entry: `Triage completed${input.outcomeNote ? ` — ${input.outcomeNote}` : ""}`, by: input.by });
    if (r.patientId) openVisitPatients.delete(r.patientId);
    r.lockedBy = undefined;
    r.lockedAt = undefined;
    return r;
  },

  cancelTriage(id, by, reason) {
    const r = store.find((x) => x.id === id);
    if (!r) return null;
    const from = r.state;
    r.state = "Cancelled";
    r.updatedAt = nowIso();
    r.stateHistory.push({ at: stamp(), from, to: "Cancelled", by, reason });
    r.timeline.push({ at: stamp(), entry: `Triage cancelled — ${reason}`, by });
    if (r.patientId) openVisitPatients.delete(r.patientId);
    return r;
  },

  listHospitalUnits(facilityId) {
    return facilityId ? TRIAGE_HOSPITAL_UNITS.filter((u) => u.facilityId === facilityId) : TRIAGE_HOSPITAL_UNITS.slice();
  },
  listAmbulanceGroups() { return TRIAGE_AMBULANCE_GROUPS.slice(); },
  listPractitioners()  { return TRIAGE_PRACTITIONERS.slice(); },
  listOverrideReasons(){ return TRIAGE_OVERRIDE_REASONS.slice(); },
  listFacilities()     { return TRIAGE_FACILITIES; },
  calculateScore, resolveSeverity,

  appendTimeline(id, entry, by) {
    const r = store.find((x) => x.id === id);
    if (!r) return null;
    r.timeline.push({ at: stamp(), entry, by });
    return r;
  },
};
