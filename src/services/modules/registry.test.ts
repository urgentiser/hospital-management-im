import { describe, expect, it } from "vitest";
import { currentStateModules } from "@/current-state/module-manifest";
import { getModuleService, getRegisteredModuleServices } from "@/services/modules/registry";

describe("module service registry", () => {
  it("registers a separate frontend service for every supported module", () => {
    const services = getRegisteredModuleServices();
    expect(services).toHaveLength(currentStateModules.length);
    for (const module of currentStateModules) {
      expect(getModuleService(module.key).moduleKey).toBe(module.key);
    }
  });

  it("uses unique API paths for module services", () => {
    const paths = getRegisteredModuleServices().map((service) => service.basePath);
    expect(new Set(paths).size).toBe(paths.length);
  });
});
