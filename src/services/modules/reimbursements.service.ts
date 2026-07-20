import { createModuleService } from "@/services/modules/base-module.service";

export const reimbursementsService = createModuleService({ moduleKey: "reimbursements", basePath: "reimbursements", workflowKey: "reimbursements" });
