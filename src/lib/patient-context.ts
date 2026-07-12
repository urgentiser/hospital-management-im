import { create } from "zustand";
import { persist } from "zustand/middleware";
import { patients, type Patient } from "@/lib/mock-data";

type PatientContextState = {
  currentPatientId: string | null;
  setPatient: (id: string | null) => void;
  getCurrent: () => Patient | null;
};

export const usePatientContext = create<PatientContextState>()(
  persist(
    (set, get) => ({
      currentPatientId: null,
      setPatient: (id) => set({ currentPatientId: id }),
      getCurrent: () => {
        const id = get().currentPatientId;
        return id ? patients.find((p) => p.id === id) ?? null : null;
      },
    }),
    { name: "impilo.patientContext" },
  ),
);

export function useCurrentPatient(): Patient | null {
  const id = usePatientContext((s) => s.currentPatientId);
  return id ? patients.find((p) => p.id === id) ?? null : null;
}

export { patients as availablePatients };
