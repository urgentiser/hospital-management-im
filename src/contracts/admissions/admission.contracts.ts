import type { VersionedCommand } from "@/contracts/common/command-result";

export type AdmissionDetail = {
  id: string;
  patientId: string;
  patientName: string;
  facilityName: string;
  ward?: string;
  bed?: string;
  status: string;
  admittedAt?: string;
  dischargedAt?: string;
  version?: string;
};

export type CreateAdmissionRequest = {
  patientId: string;
  facilityId: string;
  admissionType: string;
  practitionerId?: string;
  plannedDate?: string;
};

export type TransferAdmissionPayload = {
  destinationWard: string;
  destinationBed: string;
  transferAt: string;
};

export type DischargeAdmissionPayload = {
  dischargeAt: string;
  disposition: string;
};

export type TransferAdmissionCommand = VersionedCommand<TransferAdmissionPayload>;
export type DischargeAdmissionCommand = VersionedCommand<DischargeAdmissionPayload>;
