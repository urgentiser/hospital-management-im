export type CurrentStateCounts = {
  menus: number; workflows: number; rules: number; validations: number; tests: number;
  models: number; properties: number; services: number; tables: number; events: number;
};

export type CurrentStateRecord = Record<string, string | number | boolean | null>;

export type CurrentStateOperatingFlow = {
  action: string | null; privilege: string | null; contextType: string | null; navigationType: string | null;
  steps: string[]; sourcePath: string | null;
};

export type CurrentStateModuleSummary = {
  key: string; code: string; name: string; category: string; connectedApplication: boolean; counts: CurrentStateCounts;
};

export type CurrentStateModuleSpecification = CurrentStateModuleSummary & {
  sourceFolder: string;
  menus: CurrentStateRecord[]; workflows: CurrentStateRecord[]; rules: CurrentStateRecord[]; validations: CurrentStateRecord[];
  tests: CurrentStateRecord[]; models: CurrentStateRecord[]; properties: CurrentStateRecord[]; services: CurrentStateRecord[];
  tables: CurrentStateRecord[]; events: CurrentStateRecord[]; operatingFlows: CurrentStateOperatingFlow[];
};
