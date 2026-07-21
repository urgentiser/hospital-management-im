import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WorklistViewState = {
  search: string;
  filters: Record<string, unknown>;
  page: number;
  sortBy?: string;
  sortDir: "asc" | "desc";
  density: "comfortable" | "compact";
  visibleCols?: string[];
};

const defaultState: WorklistViewState = {
  search: "",
  filters: {},
  page: 1,
  sortDir: "desc",
  density: "comfortable",
};

type Store = {
  byModule: Record<string, WorklistViewState>;
  get: (moduleKey: string) => WorklistViewState;
  update: (moduleKey: string, patch: Partial<WorklistViewState>) => void;
  reset: (moduleKey: string) => void;
};

export const useWorklistViewStore = create<Store>()(
  persist(
    (set, getState) => ({
      byModule: {},
      get: (moduleKey) => getState().byModule[moduleKey] ?? defaultState,
      update: (moduleKey, patch) =>
        set((state) => ({
          byModule: {
            ...state.byModule,
            [moduleKey]: { ...(state.byModule[moduleKey] ?? defaultState), ...patch },
          },
        })),
      reset: (moduleKey) =>
        set((state) => {
          const next = { ...state.byModule };
          delete next[moduleKey];
          return { byModule: next };
        }),
    }),
    { name: "impilo:worklist-views:v1" },
  ),
);
