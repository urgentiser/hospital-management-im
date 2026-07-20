export type WorkflowDraft<TValues> = {
  key: string;
  values: TValues;
  stepIndex: number;
  completedSteps: number[];
  updatedAt: string;
};

const prefix = "impilo-workflow-draft:";

export const draftsService = {
  save<TValues>(draft: WorkflowDraft<TValues>): void {
    window.sessionStorage.setItem(`${prefix}${draft.key}`, JSON.stringify(draft));
  },
  load<TValues>(key: string): WorkflowDraft<TValues> | null {
    const raw = window.sessionStorage.getItem(`${prefix}${key}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as WorkflowDraft<TValues>;
    } catch {
      window.sessionStorage.removeItem(`${prefix}${key}`);
      return null;
    }
  },
  remove(key: string): void {
    window.sessionStorage.removeItem(`${prefix}${key}`);
  },
};
