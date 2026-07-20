import { createModuleService } from "@/services/modules/base-module.service";

export const productCataloguePcmsService = createModuleService({ moduleKey: "product-catalogue-pcms", basePath: "catalogues/products" });
