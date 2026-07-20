import { createModuleService } from "@/services/modules/base-module.service";

export const chargesCatalogueService = createModuleService({ moduleKey: "charges-catalogue", basePath: "catalogues/charges" });
