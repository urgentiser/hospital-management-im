import { createModuleService } from "@/services/modules/base-module.service";

export const medicalEventsService = createModuleService({ moduleKey: "medical-events", basePath: "medical-events", workflowKey: "medical-events" });
