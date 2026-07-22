/**
 * Typed contracts for the Admissions module.
 *
 * These mirror the semantic API family in the Admissions upgrade spec §33–34.
 * They are consumed by `admissions.service.ts` and by every guided-workflow
 * process. Keep them free of UI concerns.
 */

export type AdmissionState =
  | "Draft"
  | "PendingReadiness"
  | "ReadyForAdmission"
  | "AwaitingBed"
  | "Admitted"
  | "TransferRequested"
  | "DischargePending"
  | "Discharged"
  | "BillingChecksPending"
  | "ReadyToFinalise"
  | "Finalised"
  | "NoAuthorisation"
  | "Cancelled"
  | "Discontinued"
  | "CorrectionRequired"
  | "Reopened"
  | "Undischarged";

export type AdmissionType =
  | "Inpatient" | "Day case" | "Emergency" | "Obstetric"
  | "Neonate" | "Observation" | "Transfer in" | "Theatre direct";

export type AdmissionSource =
  | "Preadmission" | "Direct" | "Emergency Unit" | "Transfer in"
  | "Theatre" | "Practitioner referral" | "Other";

export type FundingMethod =
  | "MedicalScheme" | "Insurance" | "COID" | "SelfPay" | "Guarantor" | "Other";

export type AuthorisationStatus =
  | "Approved" | "Pending" | "Rejected" | "NotRequested" | "Expired" | "MoreInfo";

export type NoAuthReason =
  | "NotRequested" | "Pending" | "Rejected"
  | "ProviderUnavailable" | "EmergencyException" | "InsufficientInformation";

export type Disposition =
  | "Home" | "Step-down facility" | "Transfer out"
  | "Deceased" | "Self-discharge" | "Other";

export type BedStatus =
  | "Available" | "Reserved" | "Occupied" | "Cleaning" | "OutOfService" | "Blocked";

/** Admission worklist row — what the worklist queries return. */
export type AdmissionWorklistItem = {
  admissionId: string;
  admissionNumber: string;
  visitNumber?: string;
  patientId: string;
  patientName: string;
  mrn?: string;
  facilityId: string;
  facilityName: string;
  ward?: string;
  bed?: string;
  admissionType: AdmissionType;
  admissionSource: AdmissionSource;
  admissionDate: string;
  expectedDeparture?: string;
  practitioner?: string;
  fundingMethod: FundingMethod;
  scheme?: string;
  authorisationStatus: AuthorisationStatus;
  noAuthFlag: boolean;
  billingChecksStatus?: "Pending" | "Clear" | "Blocked";
  codingStatus?: "NotStarted" | "InProgress" | "Complete";
  dischargeReadiness?: "NotReady" | "Ready" | "Blocked";
  state: AdmissionState;
  owner?: string;
  slaHours?: number;
  updatedAt: string;
  createdAt: string;
  /** Backend-authoritative list of permitted action keys for this row. */
  availableActions: AdmissionActionKey[];
};

/** Full admission detail for the Admission Detail Workspace. */
export type AdmissionDetail = AdmissionWorklistItem & {
  patient: PatientBannerSnapshot;
  funding: FundingDetail;
  authorisation?: AuthorisationDetail;
  practitioners: PractitionerAssignment[];
  location: PatientLocation;
  accommodationHistory: AccommodationPeriod[];
  timeline: AdmissionTimelineItem[];
  documents: AdmissionDocument[];
  billingChecks: BillingCheckItem[];
  notes: AdmissionNote[];
};

export type PatientBannerSnapshot = {
  patientId: string;
  fullName: string;
  mrn?: string;
  idOrPassport?: string;
  dateOfBirth?: string;
  age?: number;
  sex?: "M" | "F" | "X";
  facilityId: string;
  admissionNumber?: string;
  visitNumber?: string;
  ward?: string;
  room?: string;
  bed?: string;
  state?: AdmissionState;
  fundingMethod?: FundingMethod;
  scheme?: string;
  memberValidationStatus?: "Verified" | "Pending" | "Failed" | "NotRequired";
  authorisationStatus?: AuthorisationStatus;
  guarantorStatus?: "Captured" | "NotCaptured";
  allergies?: string[];
  infectionAlert?: boolean;
  clinicalAlerts?: string[];
  coid?: boolean;
  injury?: boolean;
  poisoning?: boolean;
  maternity?: boolean;
  noAuth?: boolean;
  expectedDischarge?: string;
};

export type FundingDetail = {
  method: FundingMethod;
  scheme?: string;
  administrator?: string;
  planOption?: string;
  membershipNumber?: string;
  dependantCode?: string;
  dependantType?: string;
  principalMember?: { fullName: string; idOrPassport?: string };
  memberValidationStatus?: "Verified" | "Pending" | "Failed" | "NotRequired";
  effectiveDate?: string;
  expiryDate?: string;
  coPayment?: number;
  benefitLimit?: number;
  exclusions?: string[];
  schemeNotes?: string;
};

export type AuthorisationDetail = {
  authorisationNumber?: string;
  status: AuthorisationStatus;
  requestedStay?: { from: string; to: string };
  approvedStay?: { from: string; to: string };
  requestedTreatment?: string;
  approvedTreatment?: string;
  rejectionReason?: string;
  moreInformationRequest?: string;
  expiry?: string;
  linkedAdmissionId?: string;
  noAuthReason?: NoAuthReason;
  followUpOwner?: string;
  followUpDate?: string;
};

export type PractitionerAssignment = {
  practitionerId: string;
  fullName: string;
  role: "Admitting" | "Responsible" | "Referring" | "AdditionalSpecialist";
  effectiveFrom: string;
  effectiveTo?: string;
};

export type PatientLocation = {
  facilityId: string;
  facilityName: string;
  ward?: string;
  room?: string;
  bed?: string;
  since?: string;
  previous?: Omit<PatientLocation, "previous">;
};

export type AccommodationPeriod = {
  periodId: string;
  ward: string;
  room?: string;
  bed?: string;
  accommodationType: "General" | "Semi-private" | "Private" | "HDU" | "ICU";
  from: string;
  to?: string;
};

export type AdmissionTimelineItem = {
  timelineId: string;
  at: string;
  actor: string;
  action: string;
  previousState?: AdmissionState;
  newState?: AdmissionState;
  reason?: string;
  correlationId?: string;
};

export type AdmissionDocument = {
  documentId: string;
  kind: string;
  filename: string;
  uploadedAt: string;
  uploadedBy: string;
};

export type AdmissionNote = {
  noteId: string;
  at: string;
  author: string;
  body: string;
};

export type BillingCheckItem = {
  checkId: string;
  admissionId: string;
  checkType:
    | "MissingWardCharges" | "MissingAccommodation" | "OpenAccommodationPeriods"
    | "MissingTheatreCharges" | "IncompleteTheatreRegister" | "OutstandingPharmacyItems"
    | "PendingStockCredits" | "MissingMiscellaneousCharges" | "MissingClinicalCoding"
    | "UnsignedCoding" | "MissingAuthorisation" | "AuthorisationStayMismatch"
    | "MissingFunderInformation" | "MissingDischargeInformation" | "MissingDocuments"
    | "CaseManagementIssues" | "DuplicateCharges" | "UnresolvedBillingExceptions";
  severity: "Blocking" | "Warning" | "Info";
  module: string;
  description: string;
  owner?: string;
  createdDate: string;
  dueDate?: string;
  status: "Open" | "Resolved" | "Overridden";
  resolutionNote?: string;
};

/** Every business action a user can invoke on an admission. */
export type AdmissionActionKey =
  | "OpenAdmission" | "ContinueAdmission" | "AllocateBed" | "MoveToWard"
  | "ViewPatientLocation" | "CaptureAuthorisation" | "LinkAuthorisation"
  | "RegisterBirth" | "AddMiscellaneousCharge" | "StartDischarge"
  | "ManageBillingChecks" | "FinaliseBill" | "CancelAdmission"
  | "DiscontinueAdmission" | "UndischargeEuPatient" | "ChangePractitioner"
  | "UpdateAdmission" | "ViewDocuments" | "ViewTimeline" | "ViewAudit"
  | "ViewStatement";

/* ─── Request contracts, one per process ─────────────────────────────── */

export type CreateAdmissionRequest = {
  facilityId: string;
  patientId: string;
  admissionType: AdmissionType;
  admissionSource: AdmissionSource;
  admissionDate: string;
  expectedDeparture?: string;
  reasonForAdmission: string;
  medicalEventId?: string;
  admittingPractitionerId: string;
  responsiblePractitionerId?: string;
  referringPractitionerId?: string;
  admissionDiagnosis?: string;
  funding: FundingDetail;
  authorisation?: { authorisationNumber?: string; noAuthReason?: NoAuthReason };
  consentCaptured: boolean;
  supportingDocumentIds?: string[];
  correlationId?: string;
};

export type ConvertPreadmissionRequest = {
  preadmissionId: string;
  facilityId: string;
  actualAdmissionDate: string;
  admissionType: AdmissionType;
  admittingPractitionerId: string;
  correctedFields?: Partial<CreateAdmissionRequest>;
  correlationId?: string;
};

export type DirectAdmissionRequest = CreateAdmissionRequest & {
  directAdmissionReason: string;
};

export type EmergencyAdmissionRequest = {
  facilityId: string;
  emergencyVisitId: string;
  temporaryPatient?: boolean;
  patientId?: string;
  triageSummary?: string;
  admissionType: AdmissionType;
  reasonForAdmission: string;
  receivingWardId?: string;
  receivingBedId?: string;
  noAuthReason?: NoAuthReason;
  correlationId?: string;
};

export type NoAuthorisationAdmissionRequest = {
  admissionId?: string;
  preadmissionId?: string;
  patientId: string;
  noAuthReason: NoAuthReason;
  rejectedAuthorisationRef?: string;
  followUpOwnerId: string;
  followUpDate: string;
  managementApproverId?: string;
  reason: string;
  comments?: string;
  correlationId?: string;
};

export type AllocateBedRequest = {
  admissionId: string;
  wardId: string;
  bedId: string;
  accommodationType: AccommodationPeriod["accommodationType"];
  allocatedAt: string;
  correlationId?: string;
};

export type MovePatientRequest = {
  admissionId: string;
  destinationFacilityId?: string;
  destinationWardId: string;
  destinationRoomId?: string;
  destinationBedId: string;
  movementAt: string;
  reason: string;
  requestingPractitionerId?: string;
  correlationId?: string;
};

export type ChangePractitionerRequest = {
  admissionId: string;
  role: PractitionerAssignment["role"];
  practitionerId: string;
  effectiveAt: string;
  reason: string;
  correlationId?: string;
};

export type RegisterBirthRequest = {
  admissionId: string;
  babyOrder: number;
  bornAt: string;
  sex: "M" | "F" | "X";
  birthWeightG: number;
  deliveryMethod: "Vaginal" | "Caesarean" | "Assisted" | "Other";
  gestationalAgeWeeks?: number;
  neonatalStatus?: "Healthy" | "Observation" | "NICU" | "Deceased";
  practitionerId: string;
  neonatalWardId?: string;
  neonatalBedId?: string;
  correlationId?: string;
};

export type DischargeAdmissionRequest = {
  admissionId: string;
  dischargeAt: string;
  disposition: Disposition;
  destination?: string;
  dischargeReason: string;
  responsiblePractitionerId: string;
  clinicalSummary?: string;
  transferDetails?: { toFacility: string; toWard?: string };
  deathInformation?: { causeOfDeath?: string; certifiedBy?: string };
  overrideChecks?: string[];
  correlationId?: string;
};

export type CancelAdmissionRequest = {
  admissionId: string;
  reason: string;
  approverId?: string;
  correlationId?: string;
};

export type DiscontinueAdmissionRequest = CancelAdmissionRequest & {
  effectiveAt: string;
};

export type UndischargeAdmissionRequest = {
  admissionId: string;
  reason: string;
  approverId: string;
  correctionAt: string;
  receivingWardId?: string;
  receivingBedId?: string;
  correlationId?: string;
};

export type MiscellaneousChargeRequest = {
  admissionId: string;
  chargeType: string;
  serviceDate: string;
  description: string;
  quantity: number;
  amountZar: number;
  reason?: string;
  supportingDocumentId?: string;
  correlationId?: string;
};

export type CaptureAuthorisationRequest = {
  admissionId: string;
  authorisationNumber?: string;
  status: AuthorisationStatus;
  scheme?: string;
  administrator?: string;
  requestedStay?: { from: string; to: string };
  approvedStay?: { from: string; to: string };
  requestedTreatment?: string;
  approvedTreatment?: string;
  expiry?: string;
  noAuthReason?: NoAuthReason;
  followUpOwnerId?: string;
  followUpDate?: string;
  notes?: string;
  correlationId?: string;
};

export type ChangeFundingRequest = {
  admissionId: string;
  method: FundingMethod;
  scheme?: string;
  administrator?: string;
  planOption?: string;
  membershipNumber?: string;
  dependantCode?: string;
  principalMemberName?: string;
  effectiveDate?: string;
  reason: string;
  correlationId?: string;
};

/* ─── Result envelopes ─────────────────────────────────────────────── */

export type AdmissionCommandResult<T> =
  | { ok: true; data: T; correlationId?: string }
  | {
      ok: false;
      problem: {
        title: string;
        status: number;
        detail?: string;
        instance?: string;
        fieldErrors?: Record<string, string[]>;
      };
      correlationId?: string;
    };
