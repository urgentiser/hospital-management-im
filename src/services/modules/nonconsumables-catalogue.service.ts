import { createModuleService } from "@/services/modules/base-module.service";

export const nonconsumablesCatalogueService = createModuleService({ moduleKey: "nonconsumables-catalogue", basePath: "catalogues/non-consumables" });
