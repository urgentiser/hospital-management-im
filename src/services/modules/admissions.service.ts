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

const wrap = async <T,>(
  correlationId: string | undefined,
  action: () => Promise<T>,
): Promise<AdmissionCommandResult<T>> => {
  const corr = correlationId ?? newCorrelation();
  try {
    const data = await action();
    return { ok: true, data, correlationId: corr };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return {
      ok: false,
      correlationId: corr,
      problem: { title: "Admissions request failed", status: 500, detail: message },
    };
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
};

export type AdmissionsService = typeof admissionsService;
