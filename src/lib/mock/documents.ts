import { MOCK_PATIENTS } from "./patients";
import type { DocumentState } from "@/rules/workflow";

export interface DocumentRecord {
  id: string;
  patientId: string;
  patientName: string;
  fileName: string;
  category: "Consent" | "Discharge Summary" | "Pathology" | "Radiology" | "Referral" | "Invoice" | "Authorisation" | "Other";
  mime: string;
  sizeBytes: number;
  state: DocumentState;
  rejectionReason?: string;
  uploadedBy: string;
  uploadedAt: string;
  facility: string;
}

const CATS: DocumentRecord["category"][] = ["Consent", "Discharge Summary", "Pathology", "Radiology", "Referral", "Invoice", "Authorisation", "Other"];
const STATES: DocumentState[] = ["uploaded", "scanning", "clean", "rejected", "archived"];
const MIMES = ["application/pdf", "image/png", "image/jpeg", "application/pdf"];

export const MOCK_DOCUMENTS: DocumentRecord[] = MOCK_PATIENTS.slice(0, 22).map((p, i) => {
  const cat = CATS[i % CATS.length];
  const state = STATES[i % STATES.length];
  return {
    id: `DOC-${65000 + i}`,
    patientId: p.id,
    patientName: p.fullName,
    fileName: `${cat.replace(/ /g, "_")}_${p.mrn}.${i % 2 === 0 ? "pdf" : "png"}`,
    category: cat,
    mime: MIMES[i % MIMES.length],
    sizeBytes: 40_000 + i * 91_237,
    state,
    rejectionReason: state === "rejected" ? "Uploaded file appears to be blank or unreadable." : undefined,
    uploadedBy: p.practitioner,
    uploadedAt: new Date(Date.now() - i * 3600_000 * 4).toISOString(),
    facility: p.facility,
  };
});
