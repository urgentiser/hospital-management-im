/**
 * Admissions journey context.
 *
 * Single shared, session-persisted state carried across every Admissions
 * guided process so the user never loses facility, chosen process or
 * captured context — including while branching into embedded Patient
 * Registration and returning to the same Admissions journey.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AdmissionPatientRegistrationStatus =
  | "not-started"
  | "in-progress"
  | "registered";

export type AdmissionJourneyDraft = Record<string, string | number | boolean | null | undefined>;

export type AdmissionJourneyState = {
  correlationId: string;
  facilityId: string | null;
  facilityName: string | null;
  selectedProcess: string | null;
  patientId: string | null;
  patientMRN: string | null;
  patientRegistrationStatus: AdmissionPatientRegistrationStatus;
  preadmissionId: string | null;
  emergencyVisitId: string | null;
  admissionDraft: AdmissionJourneyDraft;
  fundingDraft: AdmissionJourneyDraft;
  authorisationDraft: AdmissionJourneyDraft;
  completedSteps: string[];

  // actions
  startJourney: (process: string) => void;
  setFacility: (facilityId: string | null, facilityName?: string | null) => void;
  setPatient: (patientId: string | null, mrn?: string | null) => void;
  markPatientRegistrationStarted: () => void;
  markPatientRegistered: (patientId: string, mrn: string) => void;
  setPreadmission: (preadmissionId: string | null) => void;
  setEmergencyVisit: (visitId: string | null) => void;
  updateAdmissionDraft: (patch: AdmissionJourneyDraft) => void;
  updateFundingDraft: (patch: AdmissionJourneyDraft) => void;
  updateAuthorisationDraft: (patch: AdmissionJourneyDraft) => void;
  markStepComplete: (stepKey: string) => void;
  clear: () => void;
};

const emptyDraft: AdmissionJourneyDraft = {};

const initialState = (): Pick<
  AdmissionJourneyState,
  | "correlationId"
  | "facilityId"
  | "facilityName"
  | "selectedProcess"
  | "patientId"
  | "patientMRN"
  | "patientRegistrationStatus"
  | "preadmissionId"
  | "emergencyVisitId"
  | "admissionDraft"
  | "fundingDraft"
  | "authorisationDraft"
  | "completedSteps"
> => ({
  correlationId: `adm-${(globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2))}`,
  facilityId: null,
  facilityName: null,
  selectedProcess: null,
  patientId: null,
  patientMRN: null,
  patientRegistrationStatus: "not-started",
  preadmissionId: null,
  emergencyVisitId: null,
  admissionDraft: emptyDraft,
  fundingDraft: emptyDraft,
  authorisationDraft: emptyDraft,
  completedSteps: [],
});

export const useAdmissionJourney = create<AdmissionJourneyState>()(
  persist(
    (set) => ({
      ...initialState(),

      startJourney: (process) =>
        set((prev) => ({
          ...initialState(),
          // Preserve facility across successive processes in the same session.
          facilityId: prev.facilityId,
          facilityName: prev.facilityName,
          selectedProcess: process,
        })),

      setFacility: (facilityId, facilityName = null) =>
        set(() => ({ facilityId, facilityName })),

      setPatient: (patientId, mrn = null) =>
        set(() => ({
          patientId,
          patientMRN: mrn,
          patientRegistrationStatus: patientId ? "registered" : "not-started",
        })),

      markPatientRegistrationStarted: () =>
        set(() => ({ patientRegistrationStatus: "in-progress" })),

      markPatientRegistered: (patientId, mrn) =>
        set(() => ({
          patientId,
          patientMRN: mrn,
          patientRegistrationStatus: "registered",
        })),

      setPreadmission: (preadmissionId) => set(() => ({ preadmissionId })),
      setEmergencyVisit: (emergencyVisitId) => set(() => ({ emergencyVisitId })),

      updateAdmissionDraft: (patch) =>
        set((prev) => ({ admissionDraft: { ...prev.admissionDraft, ...patch } })),
      updateFundingDraft: (patch) =>
        set((prev) => ({ fundingDraft: { ...prev.fundingDraft, ...patch } })),
      updateAuthorisationDraft: (patch) =>
        set((prev) => ({ authorisationDraft: { ...prev.authorisationDraft, ...patch } })),

      markStepComplete: (stepKey) =>
        set((prev) => ({
          completedSteps: prev.completedSteps.includes(stepKey)
            ? prev.completedSteps
            : [...prev.completedSteps, stepKey],
        })),

      clear: () => set(() => initialState()),
    }),
    {
      name: "impilo.admissions.journey",
      version: 1,
    },
  ),
);
