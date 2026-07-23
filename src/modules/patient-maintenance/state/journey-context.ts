/**
 * Patient Maintenance journey context. Only safe workflow context is
 * persisted — no PII form payloads.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PatientMaintenanceJourneyState = {
  correlationId: string;
  facility: string | null;
  selectedPatientId: string | null;
  activeProcess: string | null;
  draftId: string | null;
  completedSteps: string[];
  setFacility: (id: string | null) => void;
  setSelectedPatient: (id: string | null) => void;
  startJourney: (process: string, draftId?: string) => void;
  markStepComplete: (key: string) => void;
  clear: () => void;
};

const newCorrelation = () =>
  `pm-${(globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2))}`;

const base = () => ({
  correlationId: newCorrelation(),
  facility: null as string | null,
  selectedPatientId: null as string | null,
  activeProcess: null as string | null,
  draftId: null as string | null,
  completedSteps: [] as string[],
});

export const usePatientMaintenanceJourney = create<PatientMaintenanceJourneyState>()(
  persist(
    (set) => ({
      ...base(),
      setFacility: (facility) => set({ facility }),
      setSelectedPatient: (selectedPatientId) => set({ selectedPatientId }),
      startJourney: (activeProcess, draftId) =>
        set((prev) => ({
          ...base(),
          facility: prev.facility,
          selectedPatientId: prev.selectedPatientId,
          activeProcess,
          draftId: draftId ?? null,
        })),
      markStepComplete: (key) =>
        set((prev) => ({
          completedSteps: prev.completedSteps.includes(key)
            ? prev.completedSteps
            : [...prev.completedSteps, key],
        })),
      clear: () => set(base()),
    }),
    { name: "impilo.patient-maintenance.journey", version: 1 },
  ),
);
