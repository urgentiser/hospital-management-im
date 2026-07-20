import { createModuleService } from "@/services/modules/base-module.service";

export const adhocAndSupplierInvoicesService = createModuleService({ moduleKey: "adhoc-and-supplier-invoices", basePath: "adhoc", workflowKey: "adhoc" });
