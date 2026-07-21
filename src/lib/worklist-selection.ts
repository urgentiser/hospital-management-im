import { create } from "zustand";
import type { ModuleKey, WorkflowItem } from "@/lib/workflow-store";

export type WorklistSelection = {
  moduleKey: ModuleKey;
  record: WorkflowItem;
  actionKey: string;
  targetStep?: string;
  prefill?: Record<string, string>;
} | null;

type State = {
  current: WorklistSelection;
  select: (value: WorklistSelection) => void;
  clear: () => void;
};

export const useWorklistSelection = create<State>((set) => ({
  current: null,
  select: (value) => set({ current: value }),
  clear: () => set({ current: null }),
}));
