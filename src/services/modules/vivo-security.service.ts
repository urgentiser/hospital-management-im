import { createModuleService } from "@/services/modules/base-module.service";

export const vivoSecurityService = createModuleService({ moduleKey: "vivo-security", basePath: "security" });
