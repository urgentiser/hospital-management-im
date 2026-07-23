/**
 * Patient Maintenance contracts — UI-facing types for the mock-driven module.
 * All types are intentionally scoped to this module and align to the
 * Patient Maintenance operating flow (register, update contact, print past
 * documents, and view profile).
 */

export type PatientStatus = "Active" | "Inactive" | "Merged" | "Deceased";

export type IdentifierType =
  | "SA ID"
  | "Passport"
  | "Refugee permit"
  | "Asylum"
  | "None";

export type PatientType =
  | "Public"
  | "Private"
  | "Emergency"
  | "Neonate"
  | "Foreign national";

export type FundingMethod =
  | "Medical Scheme"
  | "Private / Cash"
  | "Government"
  | "Insurance"
  | "COID";

export type PreferredChannel = "Phone" | "SMS" | "Email" | "WhatsApp";

export type Address = {
  line1: string;
  line2?: string;
  suburb?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
};

export type PatientContact = {
  mobile?: string;
  alternatePhone?: string;
  email?: string;
  preferredChannel?: PreferredChannel;
  residentialAddress?: Address;
  postalAddress?: Address;
  postalSameAsResidential?: boolean;
};

export type PatientRelationship = {
  kind: "Next of kin" | "Guarantor" | "Employer" | "Family practitioner";
  name: string;
  relationship?: string;
  phone?: string;
  email?: string;
};

export type FundingProfile = {
  method: FundingMethod;
  schemeName?: string;
  planOption?: string;
  membershipNumber?: string;
  dependantCode?: string;
  principalMember?: string;
  guarantorName?: string;
  policyReference?: string;
  responsibleOrganisation?: string;
  // COID
  employer?: string;
  accidentDate?: string;
  claimNumber?: string;
  injuryDescription?: string;
};

export type PatientConsent = {
  privacyAcknowledged: boolean;
  treatmentConsent: boolean;
  communicationConsent: boolean;
  signerName?: string;
  signerRelationship?: string;
  digitalSignatureAcknowledged: boolean;
  capturedAt?: string;
};

export type PatientDocument = {
  id: string;
  type:
    | "ID document"
    | "Medical aid card"
    | "Consent form"
    | "Discharge summary"
    | "Invoice"
    | "Referral letter"
    | "Patient image"
    | "Other";
  title: string;
  facility: string;
  version: number;
  status: "Active" | "Superseded" | "Withdrawn";
  createdAt: string;
  sizeKb: number;
};

export type PatientVisit = {
  id: string;
  facility: string;
  ward?: string;
  admittedAt: string;
  dischargedAt?: string;
  practitioner: string;
  reason?: string;
  status: "In-hospital" | "Discharged" | "Cancelled";
};

export type PatientAlert = {
  kind: "Allergy" | "Clinical" | "Safety" | "Infection";
  text: string;
};

export type TimelineEntry = {
  at: string;
  entry: string;
  by: string;
  category?: "Registration" | "Contact" | "Document" | "Identity" | "Consent" | "System";
  before?: Record<string, string | undefined>;
  after?: Record<string, string | undefined>;
};

export type PatientRecord = {
  id: string;
  mrn: string;
  status: PatientStatus;
  facility: string;
  patientType: PatientType;
  country: string;
  identifierType: IdentifierType;
  identifierValue?: string;
  identifierUnavailableReason?: string;
  title: string;
  firstName: string;
  middleNames?: string;
  surname: string;
  previousSurname?: string;
  initials: string;
  dateOfBirth: string;
  sex: "M" | "F" | "X";
  maritalStatus?: string;
  nationality?: string;
  language?: string;
  contact: PatientContact;
  relationships: PatientRelationship[];
  funding: FundingProfile;
  consent: PatientConsent;
  documents: PatientDocument[];
  visits: PatientVisit[];
  alerts: PatientAlert[];
  timeline: TimelineEntry[];
  lockedBy?: string;
  lockedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type DuplicateMatch = {
  patient: PatientRecord;
  confidence: number;
  matchedOn: string[];
  strength: "Exact" | "Probable" | "Possible";
};

export type PatientSearchQuery = {
  facility?: string;
  status?: PatientStatus | "";
  fundingMethod?: FundingMethod | "";
  q?: string; // free-text
  mrn?: string;
  identifier?: string;
  surname?: string;
  firstName?: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
};

export type PrintJob = {
  id: string;
  patientId: string;
  documentIds: string[];
  printer: string;
  copies: number;
  requestedBy: string;
  requestedAt: string;
  status: "Queued" | "Printed" | "Failed";
  reference: string;
};

export type ContactUpdateInput = {
  mobile?: string;
  alternatePhone?: string;
  email?: string;
  preferredChannel?: PreferredChannel;
  residentialAddress?: Address;
  postalAddress?: Address;
  reason: string;
};

export type CreatePatientInput = Omit<
  PatientRecord,
  | "id"
  | "mrn"
  | "status"
  | "documents"
  | "visits"
  | "alerts"
  | "timeline"
  | "createdAt"
  | "updatedAt"
> & {
  alerts?: PatientAlert[];
};
