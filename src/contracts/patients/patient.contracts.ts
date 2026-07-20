import type { PagedQuery, PagedResult } from "@/contracts/common/paged-result";

export type PatientSummary = {
  id: string;
  mrn: string;
  fullName: string;
  dateOfBirth?: string;
  sex?: string;
  status: string;
  facilityName?: string;
  schemeName?: string;
};

export type PatientDetail = PatientSummary & {
  identifiers: Array<{ type: string; value: string }>;
  contact?: { mobile?: string; email?: string };
  allergies?: string[];
  alerts?: string[];
  version?: string;
};

export type PatientSearchQuery = PagedQuery & {
  nationalId?: string;
  passport?: string;
  mrn?: string;
  dateOfBirth?: string;
};

export type PatientSearchResult = PagedResult<PatientSummary>;
export type DuplicatePatientMatch = PatientSummary & { confidence: number; matchedOn: string[] };
