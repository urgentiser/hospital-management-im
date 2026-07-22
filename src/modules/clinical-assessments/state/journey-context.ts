/**
 * Clinical Assessment journey context — persisted across the guided workflow.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ClinicalAssessmentJourneyState = {
  correlationId: string;
  facilityId: string | null;
  patientId: string | null;
  patientMRN: string | null;
  selectedProcess: string | null;
  activeAssessmentId: string | null;
  preadmissionId: string | null;
  admissionId: string | null;
  completedSteps: string[];
  setFacility: (id: string | null) => void;
  setPatient: (id: string | null, mrn?: string | null) => void;
  setPreadmission: (id: string | null) => void;
  setAdmission: (id: string | null) => void;
  startJourney: (process: string) => void;
  setActiveAssessment: (id: string | null) => void;
  markStepComplete: (key: string) => void;
  clear: () => void;
};

const newCorrelation = () =>
  `ca-${(globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2))}`;

const base = () => ({
  correlationId: newCorrelation(),
  facilityId: null as string | null,
  patientId: null as string | null,
  patientMRN: null as string | null,
  selectedProcess: null as string | null,
  activeAssessmentId: null as string | null,
  preadmissionId: null as string | null,
  admissionId: null as string | null,
  completedSteps: [] as string[],
});

export const useClinicalAssessmentJourney = create<ClinicalAssessmentJourneyState>()(
  persist(
    (set) => ({
      ...base(),
      setFacility: (facilityId) => set({ facilityId }),
      setPatient: (patientId, mrn = null) => set({ patientId, patientMRN: mrn }),
      setPreadmission: (preadmissionId) => set({ preadmissionId }),
      setAdmission: (admissionId) => set({ admissionId }),
      startJourney: (selectedProcess) =>
        set((prev) => ({
          ...base(),
          facilityId: prev.facilityId,
          patientId: prev.patientId,
          patientMRN: prev.patientMRN,
          selectedProcess,
        })),
      setActiveAssessment: (activeAssessmentId) => set({ activeAssessmentId }),
      markStepComplete: (key) =>
        set((prev) => ({
          completedSteps: prev.completedSteps.includes(key)
            ? prev.completedSteps
            : [...prev.completedSteps, key],
        })),
      clear: () => set(base()),
    }),
    { name: "impilo.clinical-assessments.journey", version: 1 },
  ),
);
