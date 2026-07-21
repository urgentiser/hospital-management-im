import { createModuleService } from "@/services/modules/base-module.service";

export const paymentsService = createModuleService({ moduleKey: "payments", basePath: "payments", workflowKey: "payments" });
