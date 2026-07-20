import { createModuleService } from "@/services/modules/base-module.service";

export const funderCatalogueService = createModuleService({ moduleKey: "funder-catalogue", basePath: "catalogues/funders" });
