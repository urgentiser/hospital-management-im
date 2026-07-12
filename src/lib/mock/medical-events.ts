import { MOCK_PATIENTS } from "./patients";

export interface MedicalEvent {
  id: string;
  patientId: string;
  patientName: string;
  type: "Observation" | "Prescription" | "Procedure" | "Result" | "Note" | "Allergy";
  summary: string;
  clinician: string;
  facility: string;
  at: string;
}

const TYPES: MedicalEvent["type"][] = ["Observation", "Prescription", "Procedure", "Result", "Note", "Allergy"];
const SUMMARIES: Record<MedicalEvent["type"], string[]> = {
  Observation: ["BP 138/86 mmHg", "HR 88 bpm", "SpO₂ 96%", "Temp 37,4 °C"],
  Prescription: ["Amoxicillin 500 mg TDS", "Paracetamol 1 g QDS", "Enoxaparin 40 mg SC daily"],
  Procedure: ["Laparoscopic cholecystectomy", "Coronary angiography", "Elective LSCS"],
  Result: ["FBC — WBC 12,4 ×10⁹/L", "CRP 82 mg/L", "Troponin negative"],
  Note: ["Ward round note", "Consult letter from cardiology", "Physio review"],
  Allergy: ["Penicillin — rash", "NSAIDs — dyspepsia"],
};

export const MOCK_MEDICAL_EVENTS: MedicalEvent[] = Array.from({ length: 24 }).map((_, i) => {
  const p = MOCK_PATIENTS[i % MOCK_PATIENTS.length];
  const t = TYPES[i % TYPES.length];
  const s = SUMMARIES[t];
  return {
    id: `MED-${7100 + i}`,
    patientId: p.id,
    patientName: p.fullName,
    type: t,
    summary: s[i % s.length],
    clinician: p.practitioner,
    facility: p.facility,
    at: new Date(Date.now() - i * 1800_000).toISOString(),
  };
});
