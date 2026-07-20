import { createModuleService } from "@/services/modules/base-module.service";

export const clinicalAssessmentService = createModuleService({ moduleKey: "clinical-assessment", basePath: "clinical-assessments", workflowKey: "clinical-assessments" });
