import { createModuleService } from "@/services/modules/base-module.service";

export const reimbursementsCatalogueService = createModuleService({ moduleKey: "reimbursements-catalogue", basePath: "catalogues/reimbursements" });
