/**
 * Triage journey context — persisted across the guided workflow.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TriageJourneyState = {
  correlationId: string;
  facilityId: string | null;
  hospitalUnit: string | null;
  patientId: string | null;
  activeTriageId: string | null;
  completedSteps: string[];
  setFacility: (id: string | null) => void;
  setHospitalUnit: (unit: string | null) => void;
  setPatient: (id: string | null) => void;
  setActiveTriage: (id: string | null) => void;
  markStepComplete: (key: string) => void;
  startJourney: () => void;
  clear: () => void;
};

const newCorrelation = () =>
  `trg-${(globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2))}`;

const base = () => ({
  correlationId: newCorrelation(),
  facilityId: null as string | null,
  hospitalUnit: null as string | null,
  patientId: null as string | null,
  activeTriageId: null as string | null,
  completedSteps: [] as string[],
});

export const useTriageJourney = create<TriageJourneyState>()(
  persist(
    (set) => ({
      ...base(),
      setFacility: (facilityId) => set({ facilityId }),
      setHospitalUnit: (hospitalUnit) => set({ hospitalUnit }),
      setPatient: (patientId) => set({ patientId }),
      setActiveTriage: (activeTriageId) => set({ activeTriageId }),
      markStepComplete: (key) =>
        set((prev) => ({
          completedSteps: prev.completedSteps.includes(key)
            ? prev.completedSteps
            : [...prev.completedSteps, key],
        })),
      startJourney: () =>
        set((prev) => ({
          ...base(),
          facilityId: prev.facilityId,
          hospitalUnit: prev.hospitalUnit,
          patientId: prev.patientId,
        })),
      clear: () => set(base()),
    }),
    { name: "impilo.triage.journey", version: 1 },
  ),
);
