/**
 * Deterministic mock data for the Clinical Assessment module.
 * Isolated: no other module reads from this file.
 */
import type {
  AssessmentRecord, AssessmentType, AssessmentReason, ClinicalCode,
} from "@/modules/clinical-assessments/contracts";

export const CA_FACILITIES = [
  "Life Fourways",
  "Life Groenkloof",
  "Life Kingsbury",
  "Life Vincent Pallotti",
  "Life The Glynnwood",
  "Life East London",
  "Life Westville",
  "Life Entabeni",
] as const;

export const CA_ASSESSMENT_TYPES: AssessmentType[] = [
  "General admission assessment",
  "Pre-operative assessment",
  "Maternity admission assessment",
  "Paediatric admission assessment",
  "ICU admission assessment",
  "Emergency triage assessment",
  "Day-case assessment",
  "Re-assessment",
];

export const CA_ASSESSMENT_REASONS: AssessmentReason[] = [
  "New admission",
  "Pre-operative preparation",
  "Change in condition",
  "Ward transfer",
  "Post-procedure",
  "Routine re-assessment",
];

export const CA_ASSESSORS = [
  "Sr. N. Mokoena (RN)",
  "Sr. L. van Wyk (RN)",
  "Sr. T. Zulu (EN)",
  "Dr. S. Naidoo",
  "Dr. R. Botha",
  "Dr. K. Sithole",
];

export const CA_PATIENTS = [
  { id: "P-10241", name: "Nomvula Dlamini", initials: "N", mrn: "MRN-0032411", dob: "1984-03-12", gender: "F" as const, alerts: ["Penicillin allergy"], admissionId: "ADM-88213", preadmissionId: "PRE-55021", ward: "Ward 3B" },
  { id: "P-10242", name: "Johan van der Merwe", initials: "J", mrn: "MRN-0032510", dob: "1972-11-04", gender: "M" as const, alerts: [], admissionId: undefined, preadmissionId: "PRE-55022", ward: undefined },
  { id: "P-10243", name: "Aisha Patel", initials: "A", mrn: "MRN-0032511", dob: "1990-06-22", gender: "F" as const, alerts: ["Latex sensitivity"], admissionId: "ADM-88220", preadmissionId: undefined, ward: "Maternity" },
  { id: "P-10244", name: "Thabo Mokoena", initials: "T", mrn: "MRN-0032512", dob: "1965-09-08", gender: "M" as const, alerts: ["Diabetic — insulin dependent"], admissionId: "ADM-88231", preadmissionId: undefined, ward: "ICU" },
  { id: "P-10245", name: "Emily Carter", initials: "E", mrn: "MRN-0032513", dob: "1998-01-30", gender: "F" as const, alerts: [], admissionId: undefined, preadmissionId: "PRE-55024", ward: undefined },
  { id: "P-10246", name: "Sipho Zulu", initials: "S", mrn: "MRN-0032514", dob: "1978-12-19", gender: "M" as const, alerts: ["MRSA history"], admissionId: undefined, preadmissionId: undefined, ward: undefined },
];

export type MockPreadmission = {
  id: string; patientId: string; facilityId: string;
  procedure: string; practitioner: string; scheduledDate: string;
};

export const CA_PREADMISSIONS: MockPreadmission[] = [
  { id: "PRE-55021", patientId: "P-10241", facilityId: "Life Fourways", procedure: "Laparoscopic cholecystectomy", practitioner: "Dr. S. Naidoo", scheduledDate: "2026-07-24" },
  { id: "PRE-55022", patientId: "P-10242", facilityId: "Life Groenkloof", procedure: "Total knee replacement", practitioner: "Dr. M. Khumalo", scheduledDate: "2026-07-25" },
  { id: "PRE-55024", patientId: "P-10245", facilityId: "Life Fourways", procedure: "Diagnostic gastroscopy", practitioner: "Dr. L. Pillay", scheduledDate: "2026-07-26" },
];

export const CA_ICD_CATALOGUE: ClinicalCode[] = [
  { code: "K80.20", description: "Calculus of gallbladder without cholecystitis", kind: "ICD-10" },
  { code: "I10",    description: "Essential (primary) hypertension",              kind: "ICD-10" },
  { code: "E11.9",  description: "Type 2 diabetes mellitus without complications", kind: "ICD-10" },
  { code: "J45.909",description: "Unspecified asthma, uncomplicated",              kind: "ICD-10" },
  { code: "O80",    description: "Encounter for full-term uncomplicated delivery", kind: "ICD-10" },
  { code: "M17.11", description: "Unilateral primary osteoarthritis, right knee",  kind: "ICD-10" },
  { code: "R07.9",  description: "Chest pain, unspecified",                        kind: "ICD-10" },
  { code: "N39.0",  description: "Urinary tract infection, site not specified",    kind: "ICD-10" },
];

export const CA_CPT_CATALOGUE: ClinicalCode[] = [
  { code: "47562",  description: "Laparoscopy, surgical; cholecystectomy",         kind: "CPT" },
  { code: "27447",  description: "Arthroplasty, knee, condyle and plateau",        kind: "CPT" },
  { code: "59400",  description: "Routine obstetric care including antepartum",    kind: "CPT" },
  { code: "43235",  description: "Upper GI endoscopy, diagnostic",                 kind: "CPT" },
  { code: "99223",  description: "Initial hospital care, high complexity",         kind: "CPT" },
  { code: "36415",  description: "Collection of venous blood by venipuncture",     kind: "CPT" },
];

const now = new Date("2026-07-22T09:15:00Z").toISOString();

export const CA_SEED_RECORDS: AssessmentRecord[] = [
  {
    id: "CA-2026-0001",
    assessmentNumber: "CA-2026-0001",
    patientId: "P-10241", patientName: "Nomvula Dlamini", patientInitials: "N",
    patientDob: "1984-03-12", patientGender: "F", mrn: "MRN-0032411",
    facilityId: "Life Fourways", facilityName: "Life Fourways",
    wardId: "Ward 3B", admissionId: "ADM-88213", preadmissionId: "PRE-55021",
    type: "Pre-operative assessment", reason: "Pre-operative preparation",
    assessmentDate: "2026-07-22T07:30:00Z", assessor: "Sr. N. Mokoena (RN)",
    state: "Completed", completenessPercent: 100,
    availableActions: ["view", "print", "correct"],
    createdAt: now, updatedAt: now,
    stateHistory: [
      { at: "2026-07-22 07:30", from: "—", to: "Draft", by: "Sr. N. Mokoena (RN)" },
      { at: "2026-07-22 07:41", from: "Draft", to: "InProgress", by: "Sr. N. Mokoena (RN)" },
      { at: "2026-07-22 08:12", from: "InProgress", to: "Completed", by: "Sr. N. Mokoena (RN)" },
    ],
    timeline: [
      { at: "2026-07-22 07:30", entry: "Assessment opened", by: "Sr. N. Mokoena (RN)" },
      { at: "2026-07-22 08:12", entry: "Assessment completed", by: "Sr. N. Mokoena (RN)" },
    ],
  },
  {
    id: "CA-2026-0002",
    assessmentNumber: "CA-2026-0002",
    patientId: "P-10243", patientName: "Aisha Patel", patientInitials: "A",
    patientDob: "1990-06-22", patientGender: "F", mrn: "MRN-0032511",
    facilityId: "Life Fourways", facilityName: "Life Fourways",
    wardId: "Maternity", admissionId: "ADM-88220",
    type: "Maternity admission assessment", reason: "New admission",
    assessmentDate: "2026-07-22T05:15:00Z", assessor: "Sr. L. van Wyk (RN)",
    state: "InProgress", completenessPercent: 62,
    availableActions: ["continue", "view", "lock"],
    lockedBy: undefined, lockedAt: undefined,
    createdAt: now, updatedAt: now,
    stateHistory: [
      { at: "2026-07-22 05:15", from: "—", to: "Draft", by: "Sr. L. van Wyk (RN)" },
      { at: "2026-07-22 05:20", from: "Draft", to: "InProgress", by: "Sr. L. van Wyk (RN)" },
    ],
    timeline: [
      { at: "2026-07-22 05:15", entry: "Assessment opened for maternity admission", by: "Sr. L. van Wyk (RN)" },
    ],
  },
  {
    id: "CA-2026-0003",
    assessmentNumber: "CA-2026-0003",
    patientId: "P-10244", patientName: "Thabo Mokoena", patientInitials: "T",
    patientDob: "1965-09-08", patientGender: "M", mrn: "MRN-0032512",
    facilityId: "Life Kingsbury", facilityName: "Life Kingsbury",
    wardId: "ICU", admissionId: "ADM-88231",
    type: "ICU admission assessment", reason: "Change in condition",
    assessmentDate: "2026-07-22T03:20:00Z", assessor: "Dr. K. Sithole",
    state: "InProgress", completenessPercent: 45,
    availableActions: ["view"],
    lockedBy: "Sr. T. Zulu (EN)", lockedAt: "2026-07-22 08:55",
    createdAt: now, updatedAt: now,
    stateHistory: [
      { at: "2026-07-22 03:20", from: "—", to: "Draft", by: "Dr. K. Sithole" },
      { at: "2026-07-22 03:35", from: "Draft", to: "InProgress", by: "Dr. K. Sithole" },
    ],
    timeline: [
      { at: "2026-07-22 08:55", entry: "Assessment locked for concurrent-edit protection", by: "Sr. T. Zulu (EN)" },
    ],
  },
  {
    id: "CA-2026-0004",
    assessmentNumber: "CA-2026-0004",
    patientId: "P-10245", patientName: "Emily Carter", patientInitials: "E",
    patientDob: "1998-01-30", patientGender: "F", mrn: "MRN-0032513",
    facilityId: "Life Fourways", facilityName: "Life Fourways",
    preadmissionId: "PRE-55024",
    type: "Day-case assessment", reason: "Pre-operative preparation",
    assessmentDate: "2026-07-21T14:00:00Z", assessor: "Sr. N. Mokoena (RN)",
    state: "Draft", completenessPercent: 12,
    availableActions: ["continue", "view", "cancel"],
    createdAt: now, updatedAt: now,
    stateHistory: [
      { at: "2026-07-21 14:00", from: "—", to: "Draft", by: "Sr. N. Mokoena (RN)" },
    ],
    timeline: [
      { at: "2026-07-21 14:00", entry: "Draft created — awaiting clinical capture", by: "Sr. N. Mokoena (RN)" },
    ],
  },
  {
    id: "CA-2026-0005",
    assessmentNumber: "CA-2026-0005",
    patientId: "P-10246", patientName: "Sipho Zulu", patientInitials: "S",
    patientDob: "1978-12-19", patientGender: "M", mrn: "MRN-0032514",
    facilityId: "Life Groenkloof", facilityName: "Life Groenkloof",
    type: "Re-assessment", reason: "Post-procedure",
    assessmentDate: "2026-07-20T11:10:00Z", assessor: "Dr. R. Botha",
    state: "Cancelled", completenessPercent: 20,
    availableActions: ["view"],
    createdAt: now, updatedAt: now,
    stateHistory: [
      { at: "2026-07-20 11:10", from: "—", to: "Draft", by: "Dr. R. Botha" },
      { at: "2026-07-20 11:45", from: "Draft", to: "Cancelled", by: "Dr. R. Botha", reason: "Patient refused assessment" },
    ],
    timeline: [
      { at: "2026-07-20 11:45", entry: "Assessment cancelled — patient refused", by: "Dr. R. Botha" },
    ],
  },
];
