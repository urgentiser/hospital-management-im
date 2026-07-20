import { createModuleService } from "@/services/modules/base-module.service";

export const patientMaintenanceService = createModuleService({ moduleKey: "patient-maintenance", basePath: "patients", workflowKey: "patients" });
