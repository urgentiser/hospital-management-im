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
  /** Optimistic-concurrency token — pass back on every mutation. */
  version: string;
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

/**
 * Backend-authoritative readiness. Drives which actions the UI enables
 * and which readiness pills the workspace shows. Never re-derived on the client.
 */
export type AdmissionReadiness = {
  admissionId: string;
  version: string;
  state: AdmissionState;
  availableActions: AdmissionActionKey[];
  dischargeReadiness: "NotReady" | "Ready" | "Blocked";
  billingChecksStatus: "Pending" | "Clear" | "Blocked";
  blockingChecksCount: number;
  warningChecksCount: number;
  authorisationStatus: AuthorisationStatus;
  memberValidationStatus: "Verified" | "Pending" | "Failed" | "NotRequired";
  updatedAt: string;
};

/** Bed availability lookup — used by Allocate Bed and Move. */
export type BedAvailabilityQuery = {
  facilityId: string;
  wardId?: string;
  accommodationType?: AccommodationPeriod["accommodationType"];
  sex?: "M" | "F" | "X";
  isolationRequired?: boolean;
};

export type BedAvailabilityRow = {
  wardId: string;
  wardName: string;
  roomId?: string;
  roomName?: string;
  bedId: string;
  bedName: string;
  accommodationType: AccommodationPeriod["accommodationType"];
  status: BedStatus;
  sexRestriction?: "M" | "F";
  isolation?: boolean;
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

/**
 * A blocking pre-discharge check that the discharger has elected to
 * override. Every override must carry a reason and the approver id and
 * lands verbatim on the audit trail — the wizard blocks submission until
 * both are captured.
 */
export type DischargeOverride = {
  itemId: string;
  reason: string;
  approverId: string;
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
  deathInformation?: { dateOfDeath: string; causeOfDeath: string; certifiedBy: string };
  overrideChecks?: DischargeOverride[];
  ifMatchVersion?: string;
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

/** §33 — PATCH /admissions/{id}/billing-checks/{checkId} */
export type ManageBillingCheckRequest = {
  admissionId: string;
  checkId: string;
  resolution: "Resolve" | "Override" | "Reassign";
  resolutionNote: string;
  overrideApproverId?: string;
  reassignToUserId?: string;
  correlationId?: string;
};

/** §33 — POST /admissions/{id}/finalise-bill */
export type FinaliseBillRequest = {
  admissionId: string;
  finalisedAt: string;
  closeAccommodation: boolean;
  clinicalCodingSignedOff: boolean;
  outstandingChecksOverridden: string[];
  billingNarrative?: string;
  correlationId?: string;
};

export type FinaliseBillResult = {
  admissionId: string;
  billNumber: string;
  finalisedAt: string;
  totalAmountZar: number;
  blockingChecksRemaining: number;
};

/* ─── Phase G — Departure & corrections ──────────────────────────── */

/** §33 — GET /admissions/{id}/pre-discharge-review */
export type PreDischargeReviewItem = {
  itemId: string;
  category: "Clinical" | "Billing" | "Coding" | "Documents" | "CaseManagement" | "Authorisation" | "Pharmacy";
  severity: "Blocking" | "Warning" | "Info";
  title: string;
  description: string;
  owner?: string;
  status: "Open" | "Resolved" | "Waived";
};

export type PreDischargeReviewResult = {
  admissionId: string;
  reviewedAt: string;
  readinessScore: number;
  readiness: "Ready" | "Blocked" | "NotReady";
  items: PreDischargeReviewItem[];
};

/** §33 — PATCH /admissions/{id} */
export type AmendAdmissionRequest = {
  admissionId: string;
  reason: string;
  approverId?: string;
  changes: Partial<{
    admissionType: AdmissionType;
    admissionSource: AdmissionSource;
    admissionDate: string;
    expectedDeparture: string;
    reasonForAdmission: string;
    admittingPractitionerId: string;
    responsiblePractitionerId: string;
    admissionDiagnosis: string;
  }>;
  correlationId?: string;
};

/** §33 — POST /admissions/{id}/notes */
export type AddAdmissionNoteRequest = {
  admissionId: string;
  category?: "Clinical" | "Administrative" | "Billing" | "CaseManagement" | "Other";
  body: string;
  visibility?: "Internal" | "PatientVisible";
  correlationId?: string;
};

/** §33 — POST /admissions/{id}/documents */
export type AttachAdmissionDocumentRequest = {
  admissionId: string;
  kind: string;
  filename: string;
  mimeType?: string;
  sizeBytes?: number;
  description?: string;
  correlationId?: string;
};

/* ─── Result envelopes ─────────────────────────────────────────────── */

/**
 * Every mutation carries `ifMatchVersion` (optimistic concurrency, matches
 * `AdmissionDetail.version`) and `idempotencyKey` so retries never
 * duplicate the operation. Both are required by `admissionsService`.
 */
export type VersionedCommand = {
  ifMatchVersion?: string;
  idempotencyKey?: string;
};

export type AdmissionCommandResult<T> =
  | {
      ok: true;
      data: T;
      correlationId?: string;
      /** New version token to hand back on the next mutation. */
      version?: string;
    }
  | {
      ok: false;
      correlationId?: string;
      problem: {
        title: string;
        status: number;
        detail?: string;
        instance?: string;
        fieldErrors?: Record<string, string[]>;
        /** Server-current version on a 409 concurrency conflict. */
        currentVersion?: string;
      };
    };

