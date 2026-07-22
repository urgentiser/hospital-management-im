/**
 * Typed Admissions service. Wraps the shared mock/API-backed module service
 * with strongly-typed command methods that mirror the spec §33 API family.
 *
 * The methods return `AdmissionCommandResult<T>` envelopes so the UI can
 * render RFC-7807 problems without leaking backend contracts. In mock mode
 * the underlying `createModuleService` handles persistence in the workflow
 * store; these methods layer typed request shapes and correlation IDs on
 * top of that base surface.
 */
import { createModuleService } from "@/services/modules/base-module.service";
import type {
  AdmissionCommandResult,
  AdmissionDetail,
  AllocateBedRequest,
  CancelAdmissionRequest,
  ChangePractitionerRequest,
  ConvertPreadmissionRequest,
  CreateAdmissionRequest,
  DirectAdmissionRequest,
  DischargeAdmissionRequest,
  DiscontinueAdmissionRequest,
  EmergencyAdmissionRequest,
  MiscellaneousChargeRequest,
  MovePatientRequest,
  NoAuthorisationAdmissionRequest,
  RegisterBirthRequest,
  UndischargeAdmissionRequest,
  CaptureAuthorisationRequest,
  ChangeFundingRequest,
  AuthorisationDetail,
  FundingDetail,
  ManageBillingCheckRequest,
  FinaliseBillRequest,
  FinaliseBillResult,
  BillingCheckItem,
  PreDischargeReviewResult,
  PreDischargeReviewItem,
  AmendAdmissionRequest,
  AddAdmissionNoteRequest,
  AttachAdmissionDocumentRequest,
} from "@/modules/admissions/contracts";

import type {
  AdmissionReadiness,
  BedAvailabilityQuery,
  BedAvailabilityRow,
} from "@/modules/admissions/contracts";

const base = createModuleService({
  moduleKey: "admissions",
  basePath: "admissions",
  workflowKey: "admissions",
});

const newCorrelation = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `corr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`);

const newVersion = () => `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const today = () => new Date().toISOString().slice(0, 10);

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
};

/**
 * Idempotency ledger. In mock mode we memoise the previous result for a
 * given key so a retried mutation returns the original envelope instead of
 * performing the action twice. In production this maps to the backend's
 * `Idempotency-Key` header contract.
 */
const idempotencyLedger = new Map<string, AdmissionCommandResult<unknown>>();

const wrap = async <T,>(
  correlationId: string | undefined,
  action: () => Promise<T>,
  opts?: { idempotencyKey?: string },
): Promise<AdmissionCommandResult<T>> => {
  const corr = correlationId ?? newCorrelation();
  const key = opts?.idempotencyKey;
  if (key && idempotencyLedger.has(key)) {
    return idempotencyLedger.get(key) as AdmissionCommandResult<T>;
  }
  try {
    const data = await action();
    const envelope: AdmissionCommandResult<T> = {
      ok: true,
      data,
      correlationId: corr,
      version: newVersion(),
    };
    if (key) idempotencyLedger.set(key, envelope as AdmissionCommandResult<unknown>);
    return envelope;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const envelope: AdmissionCommandResult<T> = {
      ok: false,
      correlationId: corr,
      problem: { title: "Admissions request failed", status: 500, detail: message },
    };
    if (key) idempotencyLedger.set(key, envelope as AdmissionCommandResult<unknown>);
    return envelope;
  }
};

/** Typed façade around the shared Admissions service. */
export const admissionsService = {
  ...base,

  /** §33 — POST /admissions */
  createAdmission(req: CreateAdmissionRequest) {
    return wrap<AdmissionDetail>(req.correlationId, async () => {
      const result = await base.createRecord({
        title: req.reasonForAdmission,
        subtitle: [req.admissionType, req.admissionSource].filter(Boolean).join(" · "),
        status: req.authorisation?.noAuthReason ? "pending" : "admitted",
        facilityId: req.facilityId,
        fields: {
          Facility: req.facilityId,
          Type: req.admissionType,
          Source: req.admissionSource,
          "Admitted at": req.admissionDate,
          Practitioner: req.admittingPractitionerId,
          Funding: req.funding.method,
          Auth: req.authorisation?.authorisationNumber ?? (req.authorisation?.noAuthReason ? "None" : ""),
        },
        availableActions: [
          "OpenAdmission", "AllocateBed", "CaptureAuthorisation", "ChangePractitioner",
          "MoveToWard", "StartDischarge", "UpdateAdmission",
        ],
      });
      return result.data as unknown as AdmissionDetail;
    });
  },

  /** §33 — POST /admissions/from-preadmission */
  convertPreadmission(req: ConvertPreadmissionRequest) {
    return wrap<AdmissionDetail>(req.correlationId, async () => {
      const merged: CreateAdmissionRequest = {
        facilityId: req.facilityId,
        patientId: req.correctedFields?.patientId ?? "",
        admissionType: req.admissionType,
        admissionSource: "Preadmission",
        admissionDate: req.actualAdmissionDate,
        reasonForAdmission:
          req.correctedFields?.reasonForAdmission ?? `Converted from preadmission ${req.preadmissionId}`,
        admittingPractitionerId: req.admittingPractitionerId,
        funding: req.correctedFields?.funding ?? { method: "MedicalScheme" },
        consentCaptured: true,
      };
      const inner = await admissionsService.createAdmission(merged);
      if (!inner.ok) throw new Error(inner.problem.detail ?? "Convert failed");
      return inner.data;
    });
  },

  /** §33 — POST /admissions/direct */
  directAdmission(req: DirectAdmissionRequest) {
    return admissionsService.createAdmission(req);
  },

  /** §33 — POST /admissions/emergency */
  emergencyAdmission(req: EmergencyAdmissionRequest) {
    const full: CreateAdmissionRequest = {
      facilityId: req.facilityId,
      patientId: req.patientId ?? "TEMP",
      admissionType: req.admissionType,
      admissionSource: "Emergency Unit",
      admissionDate: new Date().toISOString(),
      reasonForAdmission: req.reasonForAdmission,
      admittingPractitionerId: "EU-DUTY",
      funding: { method: "SelfPay" },
      authorisation: req.noAuthReason ? { noAuthReason: req.noAuthReason } : undefined,
      consentCaptured: false,
      correlationId: req.correlationId,
    };
    return admissionsService.createAdmission(full);
  },

  /** §33 — POST /admissions/{id}/no-authorisation */
  flagNoAuthorisation(req: NoAuthorisationAdmissionRequest) {
    return wrap<void>(req.correlationId, async () => {
      if (req.admissionId) {
        await base.transitionRecord(req.admissionId, "pending", req.reason);
      }
    });
  },

  /** §33 — POST /admissions/{id}/bed */
  allocateBed(req: AllocateBedRequest) {
    return wrap<void>(req.correlationId, async () => {
      await base.transitionRecord(req.admissionId, "admitted", `Bed ${req.bedId} allocated`);
    });
  },

  /** §33 — POST /admissions/{id}/move */
  movePatient(req: MovePatientRequest) {
    return wrap<void>(req.correlationId, async () => {
      await base.transitionRecord(req.admissionId, "transferred", req.reason);
    });
  },

  /** §33 — POST /admissions/{id}/practitioner */
  changePractitioner(req: ChangePractitionerRequest) {
    return wrap<void>(req.correlationId, async () => {
      await base.addNote(req.admissionId, `Practitioner (${req.role}) changed. Reason: ${req.reason}`);
    });
  },

  /** §33 — POST /admissions/{id}/births */
  registerBirth(req: RegisterBirthRequest) {
    return wrap<void>(req.correlationId, async () => {
      await base.addNote(
        req.admissionId,
        `Neonate registered: ${req.sex}, ${req.birthWeightG}g, ${req.deliveryMethod} at ${req.bornAt}`,
      );
    });
  },

  /** §33 — POST /admissions/{id}/discharge */
  dischargeAdmission(req: DischargeAdmissionRequest) {
    return wrap<void>(req.correlationId, async () => {
      await base.transitionRecord(req.admissionId, "discharged", req.dischargeReason);
    });
  },

  /** §33 — POST /admissions/{id}/cancel */
  cancelAdmission(req: CancelAdmissionRequest) {
    return wrap<void>(req.correlationId, async () => {
      await base.transitionRecord(req.admissionId, "cancelled", req.reason);
    });
  },

  /** §33 — POST /admissions/{id}/discontinue */
  discontinueAdmission(req: DiscontinueAdmissionRequest) {
    return wrap<void>(req.correlationId, async () => {
      await base.transitionRecord(req.admissionId, "discontinued", req.reason);
    });
  },

  /** §33 — POST /admissions/{id}/undischarge */
  undischargeAdmission(req: UndischargeAdmissionRequest) {
    return wrap<void>(req.correlationId, async () => {
      await base.transitionRecord(req.admissionId, "admitted", `Undischarge (EU): ${req.reason}`);
    });
  },

  /** §33 — POST /admissions/{id}/miscellaneous-charges */
  addMiscellaneousCharge(req: MiscellaneousChargeRequest) {
    return wrap<void>(req.correlationId, async () => {
      await base.addNote(
        req.admissionId,
        `Miscellaneous charge: ${req.chargeType} × ${req.quantity} @ R${req.amountZar.toFixed(2)} — ${req.description}`,
      );
    });
  },

  /** §33 — POST /admissions/{id}/authorisation */
  captureAuthorisation(req: CaptureAuthorisationRequest) {
    return wrap<AuthorisationDetail>(req.correlationId, async () => {
      await base.addNote(
        req.admissionId,
        `Authorisation ${req.authorisationNumber ?? "(pending)"} — ${req.status}${req.scheme ? ` · ${req.scheme}` : ""}`,
      );
      return {
        authorisationNumber: req.authorisationNumber,
        status: req.status,
        requestedStay: req.requestedStay,
        approvedStay: req.approvedStay,
        requestedTreatment: req.requestedTreatment,
        approvedTreatment: req.approvedTreatment,
        expiry: req.expiry,
        noAuthReason: req.noAuthReason,
        followUpOwner: req.followUpOwnerId,
        followUpDate: req.followUpDate,
      } satisfies AuthorisationDetail;
    });
  },

  /** §33 — PATCH /admissions/{id}/funding */
  changeFunding(req: ChangeFundingRequest) {
    return wrap<FundingDetail>(req.correlationId, async () => {
      await base.addNote(
        req.admissionId,
        `Funding changed to ${req.method}${req.scheme ? ` · ${req.scheme}` : ""}. Reason: ${req.reason}`,
      );
      return {
        method: req.method,
        scheme: req.scheme,
        administrator: req.administrator,
        planOption: req.planOption,
        membershipNumber: req.membershipNumber,
        dependantCode: req.dependantCode,
        principalMember: req.principalMemberName
          ? { fullName: req.principalMemberName }
          : undefined,
        effectiveDate: req.effectiveDate,
      } satisfies FundingDetail;
    });
  },

  /** §33 — GET /admissions/{id}/billing-checks */
  listBillingChecks(admissionId: string, correlationId?: string) {
    return wrap<BillingCheckItem[]>(correlationId, async () => {
      const seed = admissionId || "ADM";
      const rand = (n: number) => Math.abs(hash(seed + n)) % 100;
      const pool: BillingCheckItem[] = [
        { checkId: `${seed}-BC-1`, admissionId, checkType: "MissingAccommodation",     severity: "Blocking", module: "Wards",     description: "Open accommodation period without close-out.", owner: "Ward clerk",   createdDate: today(), status: "Open" },
        { checkId: `${seed}-BC-2`, admissionId, checkType: "MissingClinicalCoding",    severity: "Blocking", module: "Coding",    description: "Discharge summary present but ICD-10 codes not captured.", owner: "Clinical coder", createdDate: today(), status: "Open" },
        { checkId: `${seed}-BC-3`, admissionId, checkType: "AuthorisationStayMismatch", severity: "Warning", module: "Case Mgmt", description: "Approved stay ends before captured discharge date.", owner: "Case manager",  createdDate: today(), status: "Open" },
        { checkId: `${seed}-BC-4`, admissionId, checkType: "OutstandingPharmacyItems", severity: "Warning", module: "Pharmacy",  description: "Dispensed items not yet charged to the visit.", owner: "Pharmacy tech", createdDate: today(), status: "Open" },
        { checkId: `${seed}-BC-5`, admissionId, checkType: "MissingDocuments",         severity: "Info",    module: "Documents", description: "Consent form scan pending upload.", owner: "Ward clerk",   createdDate: today(), status: "Open" },
      ];
      // Deterministic subset per admission to make polling stable.
      return pool.filter((_, i) => rand(i) < 80);
    });
  },

  /** §33 — PATCH /admissions/{id}/billing-checks/{checkId} */
  manageBillingCheck(req: ManageBillingCheckRequest) {
    return wrap<void>(req.correlationId, async () => {
      const label =
        req.resolution === "Override" ? `overridden by ${req.overrideApproverId ?? "approver"}`
        : req.resolution === "Reassign" ? `reassigned to ${req.reassignToUserId ?? "team"}`
        : "resolved";
      await base.addNote(
        req.admissionId,
        `Billing check ${req.checkId} ${label}. ${req.resolutionNote}`,
      );
    });
  },

  /** §33 — POST /admissions/{id}/finalise-bill */
  finaliseBill(req: FinaliseBillRequest) {
    return wrap<FinaliseBillResult>(req.correlationId, async () => {
      await base.transitionRecord(req.admissionId, "discharged", "Bill finalised");
      if (req.billingNarrative) {
        await base.addNote(req.admissionId, `Finalise bill: ${req.billingNarrative}`);
      }
      if (req.overriddenChecks.length) {
        await base.addNote(
          req.admissionId,
          `Bill finalised with ${req.overriddenChecks.length} overridden blocking check(s): ${req.overriddenChecks
            .map((o) => `${o.checkId} (${o.approverId})`)
            .join(", ")}`,
        );
      }
      const billNumber = `BILL-${Date.now().toString(36).slice(-6).toUpperCase()}`;
      const totalAmountZar = Math.round((15000 + Math.random() * 85000) * 100) / 100;
      const lineItemCount = 6 + Math.floor(Math.random() * 24);
      return {
        admissionId: req.admissionId,
        billNumber,
        finalisedAt: req.finalisedAt,
        totalAmountZar,
        lineItemCount,
        blockingChecksRemaining: 0,
        version: newVersion(),
      } satisfies FinaliseBillResult;
    });
  },

  /** §33 — GET /admissions/{id}/pre-discharge-review (mock) */
  preDischargeReview(admissionId: string, correlationId?: string) {
    return wrap<PreDischargeReviewResult>(correlationId, async () => {
      const items: PreDischargeReviewItem[] = [
        { itemId: "PR-1", category: "Clinical",        severity: "Blocking", title: "Discharge summary outstanding", description: "Attending must sign discharge summary before release.", owner: "Attending physician", status: "Open" },
        { itemId: "PR-2", category: "Billing",         severity: "Warning",  title: "Ward charges not closed",       description: "Ward 3B has an open accommodation period.",                owner: "Ward clerk",          status: "Open" },
        { itemId: "PR-3", category: "Coding",          severity: "Warning",  title: "ICD-10 codes not captured",     description: "Awaiting primary diagnosis and procedure codes.",           owner: "Clinical coder",      status: "Open" },
        { itemId: "PR-4", category: "Documents",       severity: "Info",     title: "Sick note pending",             description: "Optional — request via document service if needed.",         owner: "Ward clerk",          status: "Open" },
        { itemId: "PR-5", category: "CaseManagement",  severity: "Info",     title: "Case sign-off pending",         description: "Case manager review not yet complete.",                     owner: "Case manager",        status: "Open" },
        { itemId: "PR-6", category: "Pharmacy",        severity: "Info",     title: "Take-home medication",          description: "TTO script prepared, awaiting patient hand-over.",           owner: "Pharmacy",            status: "Open" },
      ];
      const blocking = items.filter((i) => i.severity === "Blocking" && i.status === "Open").length;
      const warnings = items.filter((i) => i.severity === "Warning"  && i.status === "Open").length;
      const readinessScore = Math.max(0, 100 - blocking * 40 - warnings * 15);
      return {
        admissionId,
        reviewedAt: new Date().toISOString(),
        readinessScore,
        readiness: blocking > 0 ? "Blocked" : warnings > 0 ? "NotReady" : "Ready",
        items,
      } satisfies PreDischargeReviewResult;
    });
  },

  /** §33 — PATCH /admissions/{id} (amend) */
  amendAdmission(req: AmendAdmissionRequest) {
    return wrap<void>(req.correlationId, async () => {
      const summary = Object.entries(req.changes)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => `${k}=${String(v)}`)
        .join(", ");
      await base.addNote(
        req.admissionId,
        `Admission amended. Reason: ${req.reason}${summary ? ` — ${summary}` : ""}${req.approverId ? ` (approved by ${req.approverId})` : ""}`,
      );
    });
  },

  /** §33 — POST /admissions/{id}/notes */
  addAdmissionNote(req: AddAdmissionNoteRequest) {
    return wrap<void>(req.correlationId, async () => {
      const prefix = req.category ? `[${req.category}] ` : "";
      const visibility = req.visibility === "PatientVisible" ? " (patient-visible)" : "";
      await base.addNote(req.admissionId, `${prefix}${req.body}${visibility}`);
    });
  },

  /** §33 — POST /admissions/{id}/documents */
  attachAdmissionDocument(req: AttachAdmissionDocumentRequest) {
    return wrap<void>(req.correlationId, async () => {
      const size = req.sizeBytes ? ` · ${(req.sizeBytes / 1024).toFixed(1)} KB` : "";
      await base.addNote(
        req.admissionId,
        `Document attached: ${req.kind} — ${req.filename}${size}${req.description ? ` · ${req.description}` : ""}`,
      );
    });
  },



  /**
   * §33 — GET /admissions/{id}/readiness
   *
   * Backend-authoritative readiness. Never derive `availableActions` or
   * `dischargeReadiness` client-side; poll this after every mutation and
   * feed the result into the workspace and Process Selector.
   */
  getReadiness(admissionId: string, correlationId?: string) {
    return wrap<AdmissionReadiness>(correlationId, async () => {
      // Mock: reflect the current workflow record state as readiness.
      const record = await base.getRecord(admissionId).catch(() => null);
      const raw = ((record as unknown as { status?: string })?.status ?? "admitted").toLowerCase();
      const stateMap: Record<string, AdmissionReadiness["state"]> = {
        admitted: "Admitted", pending: "PendingReadiness", discharged: "Discharged",
        finalised: "Finalised", cancelled: "Cancelled", discontinued: "Discontinued",
      };
      const state = stateMap[raw] ?? "Admitted";
      const isDischarged = state === "Discharged";
      const isFinalised = state === "Finalised";
      const isTerminal = state === "Cancelled" || state === "Discontinued";
      return {
        admissionId,
        version: newVersion(),
        state,
        availableActions: isTerminal
          ? ["ViewTimeline", "ViewAudit", "ViewDocuments"]
          : isFinalised
            ? ["ViewStatement", "ViewTimeline", "ViewAudit", "ViewDocuments"]
            : isDischarged
              ? ["ManageBillingChecks", "FinaliseBill", "ViewStatement", "ViewTimeline", "ViewDocuments", "ViewAudit", "UndischargeEuPatient"]
              : [
                  "OpenAdmission", "AllocateBed", "MoveToWard", "CaptureAuthorisation",
                  "ChangePractitioner", "RegisterBirth", "AddMiscellaneousCharge",
                  "StartDischarge", "UpdateAdmission", "CancelAdmission", "DiscontinueAdmission",
                  "ViewTimeline", "ViewDocuments", "ViewAudit",
                ],
        dischargeReadiness: isFinalised || isDischarged ? "Ready" : "NotReady",
        billingChecksStatus: isFinalised ? "Clear" : "Pending",
        blockingChecksCount: isDischarged && !isFinalised ? 1 : 0,
        warningChecksCount: isDischarged && !isFinalised ? 2 : 1,
        authorisationStatus: "Approved",
        memberValidationStatus: "Verified",
        updatedAt: new Date().toISOString(),
      } satisfies AdmissionReadiness;
    });
  },

  /**
   * §33 — GET /facilities/{id}/beds/available
   *
   * Live bed availability, filtered by ward, accommodation type, sex
   * restriction and isolation. Consumed by Allocate Bed and Move.
   */
  listAvailableBeds(query: BedAvailabilityQuery, correlationId?: string) {
    return wrap<BedAvailabilityRow[]>(correlationId, async () => {
      const wards = query.wardId ? [query.wardId] : ["Ward-3A", "Ward-3B", "Ward-ICU"];
      const rows: BedAvailabilityRow[] = wards.flatMap((wardId) =>
        Array.from({ length: 4 }, (_, idx) => {
          const bedNo = idx + 1;
          const bedId = `${wardId}-B${bedNo}`;
          const type: BedAvailabilityRow["accommodationType"] =
            wardId.includes("ICU") ? "ICU"
            : bedNo === 1 ? "Private"
            : bedNo === 2 ? "Semi-private"
            : "General";
          return {
            wardId,
            wardName: wardId.replace("-", " "),
            bedId,
            bedName: `Bed ${bedNo}`,
            accommodationType: type,
            status: bedNo === 3 ? "Cleaning" : "Available",
            sexRestriction: bedNo === 4 ? "F" : undefined,
            isolation: wardId.includes("ICU") && bedNo === 1,
          } satisfies BedAvailabilityRow;
        }),
      );
      return rows.filter((r) => {
        if (r.status !== "Available") return false;
        if (query.accommodationType && r.accommodationType !== query.accommodationType) return false;
        if (query.sex && r.sexRestriction && r.sexRestriction !== query.sex) return false;
        if (query.isolationRequired && !r.isolation) return false;
        return true;
      });
    });
  },
};

export type AdmissionsService = typeof admissionsService;

