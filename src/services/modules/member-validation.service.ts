import { createModuleService } from "@/services/modules/base-module.service";

export const memberValidationService = createModuleService({ moduleKey: "member-validation", basePath: "member-validations" });
