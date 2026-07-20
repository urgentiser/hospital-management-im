import { currentStateModules, loadCurrentStateModule } from "@/current-state";
import type { CurrentStateModuleSpecification, CurrentStateModuleSummary } from "@/current-state/types";

export const currentStateService = {
  list(): readonly CurrentStateModuleSummary[] { return currentStateModules; },
  async get(moduleKeyOrName: string): Promise<CurrentStateModuleSpecification | null> { return loadCurrentStateModule(moduleKeyOrName); },
  search(query: string): readonly CurrentStateModuleSummary[] {
    const value = query.trim().toLowerCase();
    if (!value) return currentStateModules;
    return currentStateModules.filter((module) =>
      [module.name, module.key, module.category].some((candidate) => candidate.toLowerCase().includes(value)),
    );
  },
};
