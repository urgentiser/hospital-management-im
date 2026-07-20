import type {
  DuplicatePatientMatch,
  PatientDetail,
  PatientSearchQuery,
  PatientSearchResult,
} from "@/contracts/patients/patient.contracts";
import { apiRequest } from "@/services/http-client";

function queryString(values: Record<string, unknown>): string {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  });
  return params.toString();
}

export const patientsService = {
  search(query: PatientSearchQuery) {
    return apiRequest<PatientSearchResult>(`patients?${queryString(query)}`);
  },
  get(patientId: string) {
    return apiRequest<PatientDetail>(`patients/${encodeURIComponent(patientId)}`);
  },
  findDuplicates(query: Pick<PatientSearchQuery, "nationalId" | "passport" | "mrn" | "dateOfBirth">) {
    return apiRequest<DuplicatePatientMatch[]>(`patients/duplicates?${queryString(query)}`);
  },
};
