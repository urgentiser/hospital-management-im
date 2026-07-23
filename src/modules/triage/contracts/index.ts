/**
 * Triage contracts (mock-driven, isolated to this module).
 * UI-facing types keep components strict-typed.
 */

export type TriagePatientType = "Adult" | "Child" | "Infant" | "Unknown";

export type TriageState =
  | "Waiting"
  | "InProgress"
  | "Reassessed"
  | "Completed"
  | "Cancelled";

export type TriageSeverity = "Red" | "Orange" | "Yellow" | "Green" | "Blue";

export type ArrivalMode =
  | "Walk-in"
  | "Ambulance"
  | "Referral"
  | "Inter-hospital transfer"
  | "Police / SAPS"
  | "Own transport";

export type MobilityLevel = "Walking" | "With aid" | "Wheelchair" | "Stretcher" | "Immobile";
export type AvpuLevel = "Alert" | "Voice" | "Pain" | "Unresponsive";
export type TraumaLevel = "None" | "Minor" | "Significant" | "Severe";

export type TriageFindingFlags = {
  haemorrhage?: boolean;
  seizure?: boolean;
  diabeticConcern?: boolean;
  vomiting?: boolean;
  burn?: boolean;
  stridor?: boolean;
  drooling?: boolean;
  wheeze?: boolean;
  purpura?: boolean;
  prBleeding?: boolean;
  fracture?: boolean;
  pain?: boolean;
  pregnancy?: boolean;
  focalNeurology?: boolean;
  psychosis?: boolean;
  threatenedLimb?: boolean;
  shortnessOfBreath?: boolean;
  haemoptysis?: boolean;
  chestPain?: boolean;
  highEnergyTransfer?: boolean;
  poisoning?: boolean;
  abdominalPain?: boolean;
};

export const TRIAGE_FINDING_LABELS: Record<keyof TriageFindingFlags, string> = {
  haemorrhage: "Haemorrhage",
  seizure: "Seizure",
  diabeticConcern: "Diabetic concern",
  vomiting: "Vomiting",
  burn: "Burn",
  stridor: "Stridor",
  drooling: "Drooling",
  wheeze: "Wheeze",
  purpura: "Purpura / rash",
  prBleeding: "PR bleeding",
  fracture: "Fracture",
  pain: "Pain",
  pregnancy: "Pregnancy",
  focalNeurology: "Focal neurology",
  psychosis: "Psychosis / agitation",
  threatenedLimb: "Threatened limb",
  shortnessOfBreath: "Shortness of breath",
  haemoptysis: "Haemoptysis",
  chestPain: "Chest pain",
  highEnergyTransfer: "High-energy transfer",
  poisoning: "Poisoning",
  abdominalPain: "Abdominal pain",
};

export type TriageObservationSet = {
  recordedAt: string;
  recordedBy: string;
  mobility?: MobilityLevel;
  respiratoryRate?: number;
  heartRate?: number;
  systolicBp?: number;
  temperature?: number;
  avpu?: AvpuLevel;
  trauma?: TraumaLevel;
  findings: TriageFindingFlags;
  score: number;
  severity: TriageSeverity;
  overridden?: boolean;
  overrideReason?: string;
  overrideBy?: string;
  note?: string;
};

export type TriageStateHistoryEntry = {
  at: string;
  from: TriageState | "—";
  to: TriageState;
  by: string;
  reason?: string;
};

export type TriageTimelineEntry = {
  at: string;
  entry: string;
  by: string;
};

export type InjuryDetails = {
  incidentDate?: string;
  incidentTime?: string;
  mechanism?: string;
  bodyRegion?: string;
  description?: string;
};

export type PoisoningDetails = {
  substance?: string;
  route?: "Oral" | "Inhaled" | "Injected" | "Skin" | "Unknown";
  quantity?: string;
  description?: string;
};

export type UnknownPatientDetails = {
  estimatedAge?: string;
  estimatedHeight?: string;
  distinguishing?: string;
};

export type TriageRecord = {
  id: string;
  reference: string;
  facilityId: string;
  hospitalUnit: string;
  patientId?: string;
  patientName: string;
  patientMrn?: string;
  patientMaskedIdentifier?: string;
  patientType: TriagePatientType;
  unknown?: UnknownPatientDetails;
  gender?: "M" | "F" | "X";
  arrivalAt: string;
  arrivalMode: ArrivalMode;
  ambulanceGroup?: string;
  presentingComplaint: string;
  isInjury?: boolean;
  injury?: InjuryDetails;
  isPoisoning?: boolean;
  poisoning?: PoisoningDetails;
  visitNumber?: string;
  practitioner?: string;
  observations: TriageObservationSet[];
  currentScore: number;
  currentSeverity: TriageSeverity;
  overridden: boolean;
  state: TriageState;
  startedAt: string;
  endedAt?: string;
  lockedBy?: string;
  lockedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  stateHistory: TriageStateHistoryEntry[];
  timeline: TriageTimelineEntry[];
};

export type TriageSearchQuery = {
  facilityId?: string;
  state?: TriageState | "";
  severity?: TriageSeverity | "";
  locked?: "locked" | "unlocked" | "";
  q?: string;
  savedView?: "waiting" | "high-severity" | "locked" | "completed-today" | "";
};

export type CreateTriageInput = {
  facilityId: string;
  hospitalUnit: string;
  patientId?: string;
  patientName: string;
  patientMrn?: string;
  patientMaskedIdentifier?: string;
  patientType: TriagePatientType;
  unknown?: UnknownPatientDetails;
  gender?: "M" | "F" | "X";
  arrivalAt: string;
  arrivalMode: ArrivalMode;
  ambulanceGroup?: string;
  presentingComplaint: string;
  isInjury?: boolean;
  injury?: InjuryDetails;
  isPoisoning?: boolean;
  poisoning?: PoisoningDetails;
  practitioner?: string;
  observation: Omit<TriageObservationSet, "recordedAt" | "recordedBy" | "score" | "severity"> & {
    score?: number;
    severity?: TriageSeverity;
    recordedBy?: string;
  };
  createdBy: string;
};

export type ReassessTriageInput = {
  triageId: string;
  by: string;
  observation: Omit<TriageObservationSet, "recordedAt" | "recordedBy" | "score" | "severity"> & {
    score?: number;
    severity?: TriageSeverity;
  };
  note?: string;
};

export type CompleteTriageInput = {
  triageId: string;
  by: string;
  endedAt?: string;
  outcomeNote?: string;
};

export type SeverityRange = { min: number; max: number; severity: TriageSeverity; label: string; tone: string };

export type AmbulanceGroup = { id: string; name: string };
export type OverrideReason = { id: string; label: string };
export type Practitioner = { id: string; name: string; discipline: string };
export type HospitalUnit = { id: string; facilityId: string; name: string };
