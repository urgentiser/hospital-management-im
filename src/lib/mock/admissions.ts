import { FACILITIES } from "@/rules/facilities";
import { MOCK_PATIENTS } from "./patients";
import type { AdmissionState } from "@/rules/workflow";

export interface MockAdmission {
  id: string;
  patientId: string;
  patientName: string;
  mrn: string;
  admissionType: "Elective" | "Emergency" | "Maternity" | "Day Case" | "Transfer";
  facility: string;
  ward: string;
  bed: string;
  practitioner: string;
  diagnosis: string;
  scheme: string;
  authorisation?: string;
  admittedAt: string;
  los: number;
  state: AdmissionState;
  notes?: string;
}

const WARDS = ["Ward 3B", "Ward 2A", "ICU", "HDU", "Maternity", "Cardiology", "Oncology", "Paediatrics"];
const TYPES: MockAdmission["admissionType"][] = ["Elective", "Emergency", "Maternity", "Day Case", "Transfer"];
const DIAGNOSES = [
  "Cholelithiasis", "Community-acquired pneumonia", "Type 2 diabetes decompensation",
  "Acute appendicitis", "Elective LSCS", "Coronary artery disease",
  "Osteoarthritis of knee", "Renal calculi", "Chronic kidney disease",
  "Cellulitis lower limb", "Acute gastroenteritis", "Chest pain — investigation",
];
const STATES: AdmissionState[] = ["admitted", "bed-allocated", "in-theatre", "transferred", "discharged", "cancelled", "draft"];

export const MOCK_ADMISSIONS: MockAdmission[] = MOCK_PATIENTS.slice(0, 22).map((p, i) => {
  const facility = FACILITIES[i % FACILITIES.length];
  return {
    id: `ADM-${88213 + i}`,
    patientId: p.id,
    patientName: p.fullName,
    mrn: p.mrn,
    admissionType: TYPES[i % TYPES.length],
    facility: facility.name,
    ward: WARDS[i % WARDS.length],
    bed: String(((i * 3) % 30) + 1).padStart(2, "0"),
    practitioner: p.practitioner,
    diagnosis: DIAGNOSES[i % DIAGNOSES.length],
    scheme: p.scheme,
    authorisation: i % 3 === 0 ? `AUTH-${40921 + i}` : undefined,
    admittedAt: new Date(Date.now() - i * 3600_000 * 6).toISOString(),
    los: i % 8,
    state: STATES[i % STATES.length],
    notes: i % 4 === 0 ? "Requires cardiology consult on Day 2." : undefined,
  };
});
