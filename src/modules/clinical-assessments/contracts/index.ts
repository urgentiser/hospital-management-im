/**
 * Clinical Assessment contracts (mock-driven, isolated to this module).
 * All types are deliberately UI-facing so components stay strict-typed.
 */

export type AssessmentState =
  | "Draft"
  | "InProgress"
  | "Incomplete"
  | "Completed"
  | "Corrected"
  | "Cancelled"
  | "AwaitingCountersignature";

export type AssessmentType =
  | "General admission assessment"
  | "Pre-operative assessment"
  | "Maternity admission assessment"
  | "Paediatric admission assessment"
  | "ICU admission assessment"
  | "Emergency triage assessment"
  | "Day-case assessment"
  | "Re-assessment";

export type AssessmentReason =
  | "New admission"
  | "Pre-operative preparation"
  | "Change in condition"
  | "Ward transfer"
  | "Post-procedure"
  | "Routine re-assessment";

export type YesNo = "Yes" | "No" | "";

export type IllnessKey =
  | "heartDisease" | "bloodPressure" | "varicoseVeins" | "asthma"
  | "liverJaundice" | "excessiveSnoring" | "diabetes" | "thyroid"
  | "gastricDuodenal" | "kidneyBladder" | "porphyria" | "geneticCongenital"
  | "epilepsy" | "depressionPsychiatric" | "excessiveBleeding"
  | "backNeck" | "recentIllness";

export const ILLNESS_LABELS: Record<IllnessKey, string> = {
  heartDisease: "Heart disease",
  bloodPressure: "Blood pressure (hyper/hypo)",
  varicoseVeins: "Varicose veins",
  asthma: "Asthma / bronchitis",
  liverJaundice: "Liver disease / jaundice",
  excessiveSnoring: "Excessive snoring / OSA",
  diabetes: "Diabetes",
  thyroid: "Thyroid disorder",
  gastricDuodenal: "Gastric / duodenal",
  kidneyBladder: "Kidney / bladder",
  porphyria: "Porphyria",
  geneticCongenital: "Genetic / congenital",
  epilepsy: "Epilepsy / seizures",
  depressionPsychiatric: "Depression / psychiatric",
  excessiveBleeding: "Excessive bleeding / clotting",
  backNeck: "Back / neck problems",
  recentIllness: "Recent illness (last 30 days)",
};

export type IllnessDetail = {
  present: YesNo;
  description?: string;
  durationType?: "days" | "weeks" | "months" | "years";
  duration?: number;
  treatment?: string;
  personalHistory?: string;
  familyHistory?: string;
};

export type VitalSigns = {
  systolic?: number; diastolic?: number;
  pulse?: number; pulseDescription?: string;
  respiration?: number; respirationDescription?: string;
  temperature?: number; temperatureRoute?: "Oral" | "Tympanic" | "Axillary" | "Rectal";
  spo2?: number;
  weight?: number; height?: number;
  haemoglucose?: number;
  mrsaScreening?: "Positive" | "Negative" | "Pending" | "Not done";
  chestApexLeft?: string; chestApexRight?: string;
  chestBaseLeft?: string; chestBaseRight?: string;
};

export type UrinalysisResult = "Negative" | "Trace" | "+" | "++" | "+++" | "++++" | "";
export type Urinalysis = {
  pH?: number;
  specificGravity?: number;
  blood?: UrinalysisResult; bloodScore?: string;
  leucocytes?: UrinalysisResult; leucocytesScore?: string;
  ketones?: UrinalysisResult; ketonesScore?: string;
  bilirubin?: UrinalysisResult; bilirubinScore?: string;
  glucose?: UrinalysisResult; glucoseScore?: string;
  protein?: UrinalysisResult; proteinScore?: string;
  haemoglobin?: UrinalysisResult; haemoglobinScore?: string;
  urobilinogen?: UrinalysisResult; urobilinogenScore?: string;
  nitrites?: UrinalysisResult; nitritesScore?: string;
};

export type AcuityLevel = "Independent" | "Assisted" | "Dependent" | "Total care";
export type Acuity = {
  hygiene?: AcuityLevel; mobility?: AcuityLevel;
  nutrition?: AcuityLevel; elimination?: AcuityLevel;
  haemodynamic?: AcuityLevel; oxygen?: AcuityLevel;
  neurological?: AcuityLevel; glucose?: AcuityLevel;
  ivInfusion?: AcuityLevel; injections?: AcuityLevel;
  oralRectalVaginal?: AcuityLevel; inhalations?: AcuityLevel;
  woundCare?: AcuityLevel; skinPressure?: AcuityLevel;
  pain?: AcuityLevel; diagnostics?: AcuityLevel;
  psychosocial?: AcuityLevel; rehabilitation?: AcuityLevel;
};

export type ClinicalCode = { code: string; description: string; kind: "ICD-10" | "CPT" };

export type PatientIntegrity = {
  identifierType: "SA ID" | "Passport" | "Refugee permit" | "Asylum" | "None";
  identifierValue?: string;
  identifierUnavailableReason?: string;
  firstName: string;
  surname: string;
  initials: string;
  title: string;
  gender: "M" | "F" | "X" | "";
  dateOfBirth: string;
  alertsAcknowledged: boolean;
  duplicateWarningAcknowledged: boolean;
};

export type GeneralConsiderations = {
  allergies: string;
  riskFlags: string;
  previousOperations: string;
  previousAnaesthetic: string;
  religiousRequirements: string;
  culturalRequirements: string;
};

export type TreatmentConsiderations = {
  chemoRadiation: YesNo; chemoRadiationDetails?: string;
  steroidsCortisone: YesNo; steroidsDetails?: string;
  currentMedication: string;
  pacemakerValve: YesNo; pacemakerDetails?: string;
  smoking: YesNo; smokingDetails?: string;
  alcohol: YesNo; alcoholDetails?: string;
  pregnancy: YesNo; lmp?: string;
  breastfeeding: YesNo;
  oralContraceptive: YesNo;
  elderlyConsiderations?: string;
};

export type AssessmentRecord = {
  id: string;
  assessmentNumber: string;
  patientId: string;
  patientName: string;
  patientInitials: string;
  patientDob: string;
  patientGender: "M" | "F" | "X";
  mrn: string;
  facilityId: string;
  facilityName: string;
  wardId?: string;
  admissionId?: string;
  preadmissionId?: string;
  medicalEventId?: string;
  type: AssessmentType;
  reason: AssessmentReason;
  assessmentDate: string;
  assessor: string;
  participants?: string;
  state: AssessmentState;
  lockedBy?: string;
  lockedAt?: string;
  createdAt: string;
  updatedAt: string;
  completenessPercent: number;
  availableActions: AssessmentAction[];
  stateHistory: Array<{ at: string; from: AssessmentState | "—"; to: AssessmentState; by: string; reason?: string }>;
  timeline: Array<{ at: string; entry: string; by: string }>;
  // Section payloads
  integrity?: PatientIntegrity;
  general?: GeneralConsiderations;
  treatment?: TreatmentConsiderations;
  illness?: Partial<Record<IllnessKey, IllnessDetail>>;
  vitals?: VitalSigns;
  urinalysis?: Urinalysis;
  acuity?: Acuity;
  codes?: ClinicalCode[];
  notes?: string;
};

export type AssessmentAction =
  | "open" | "continue" | "view" | "print"
  | "complete" | "correct" | "reopen" | "cancel"
  | "lock" | "unlock" | "countersign"
  | "replace-patient" | "link-preadmission" | "detach-preadmission";

export type ViewSearchMode = "date" | "assessment-number" | "patient";

export type ViewSearchQuery = {
  facilityId: string;
  mode: ViewSearchMode;
  fromDate?: string;
  toDate?: string;
  assessmentNumber?: string;
  surname?: string;
  name?: string;
  gender?: "M" | "F" | "X" | "";
  dob?: string;
  state?: AssessmentState | "";
};
