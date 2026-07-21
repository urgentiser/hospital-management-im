import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SavedView } from "@/components/worklist/types";

export type WorklistViewState = {
  search: string;
  filters: Record<string, unknown>;
  page: number;
  pageSize?: number;
  sortBy?: string;
  sortDir: "asc" | "desc";
  density: "comfortable" | "compact";
  visibleCols?: string[];
  /** Currently applied personal or shared saved view (by key). */
  activeViewKey?: string;
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
  /** Personal saved views owned by the current user, per module. */
  personalViews: Record<string, SavedView[]>;
  get: (moduleKey: string) => WorklistViewState;
  update: (moduleKey: string, patch: Partial<WorklistViewState>) => void;
  reset: (moduleKey: string) => void;
  saveView: (moduleKey: string, view: SavedView) => void;
  renameView: (moduleKey: string, key: string, label: string) => void;
  deleteView: (moduleKey: string, key: string) => void;
  getPersonalViews: (moduleKey: string) => SavedView[];
};

export const useWorklistViewStore = create<Store>()(
  persist(
    (set, getState) => ({
      byModule: {},
      personalViews: {},
      get: (moduleKey) => getState().byModule[moduleKey] ?? defaultState,
      getPersonalViews: (moduleKey) => getState().personalViews[moduleKey] ?? [],
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
      saveView: (moduleKey, view) =>
        set((state) => {
          const existing = state.personalViews[moduleKey] ?? [];
          const filtered = existing.filter((v) => v.key !== view.key);
          return {
            personalViews: {
              ...state.personalViews,
              [moduleKey]: [...filtered, view],
            },
          };
        }),
      renameView: (moduleKey, key, label) =>
        set((state) => {
          const existing = state.personalViews[moduleKey] ?? [];
          return {
            personalViews: {
              ...state.personalViews,
              [moduleKey]: existing.map((v) => (v.key === key ? { ...v, label } : v)),
            },
          };
        }),
      deleteView: (moduleKey, key) =>
        set((state) => {
          const existing = state.personalViews[moduleKey] ?? [];
          return {
            personalViews: {
              ...state.personalViews,
              [moduleKey]: existing.filter((v) => v.key !== key),
            },
          };
        }),
    }),
    { name: "impilo:worklist-views:v2" },
  ),
);
