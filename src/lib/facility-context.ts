import { create } from "zustand";
import { persist } from "zustand/middleware";

export const FACILITIES = [
  "Life Fourways",
  "Life Groenkloof",
  "Life Kingsbury",
  "Life Vincent Pallotti",
  "All facilities",
] as const;

export type Facility = (typeof FACILITIES)[number];

type FacilityContextState = {
  facility: Facility;
  setFacility: (f: Facility) => void;
};

export const useFacilityContext = create<FacilityContextState>()(
  persist(
    (set) => ({
      facility: FACILITIES[0],
      setFacility: (f) => set({ facility: f }),
    }),
    { name: "impilo.facilityContext" },
  ),
);

/** Pluralize a noun by count. */
export function plural(count: number, singular: string, pluralForm?: string): string {
  return `${count} ${count === 1 ? singular : pluralForm ?? `${singular}s`}`;
}
