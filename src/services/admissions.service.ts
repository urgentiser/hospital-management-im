import type {
  AdmissionDetail,
  CreateAdmissionRequest,
  DischargeAdmissionCommand,
  TransferAdmissionCommand,
} from "@/contracts/admissions/admission.contracts";
import type { CommandResult } from "@/contracts/common/command-result";
import { apiRequest } from "@/services/http-client";

export const admissionsService = {
  get(admissionId: string) {
    return apiRequest<AdmissionDetail>(`admissions/${encodeURIComponent(admissionId)}`);
  },
  create(payload: CreateAdmissionRequest) {
    return apiRequest<CommandResult<AdmissionDetail>>("admissions", { method: "POST", body: payload });
  },
  transfer(admissionId: string, command: TransferAdmissionCommand) {
    return apiRequest<CommandResult<AdmissionDetail>>(`admissions/${encodeURIComponent(admissionId)}/transfer`, {
      method: "POST",
      body: command,
    });
  },
  discharge(admissionId: string, command: DischargeAdmissionCommand) {
    return apiRequest<CommandResult<AdmissionDetail>>(`admissions/${encodeURIComponent(admissionId)}/discharge`, {
      method: "POST",
      body: command,
    });
  },
};
