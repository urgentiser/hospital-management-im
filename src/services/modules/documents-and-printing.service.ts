import { createModuleService } from "@/services/modules/base-module.service";

export const documentsAndPrintingService = createModuleService({ moduleKey: "documents-and-printing", basePath: "documents", workflowKey: "documents" });
