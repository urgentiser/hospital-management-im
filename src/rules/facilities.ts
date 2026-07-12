export interface Facility {
  id: string;
  name: string;
  city: string;
  province: string;
  beds: number;
}

export const FACILITIES: Facility[] = [
  { id: "FAC-FW", name: "Life Fourways", city: "Fourways", province: "Gauteng", beds: 250 },
  { id: "FAC-GK", name: "Life Groenkloof", city: "Pretoria", province: "Gauteng", beds: 208 },
  { id: "FAC-KB", name: "Life Kingsbury", city: "Cape Town", province: "Western Cape", beds: 184 },
  { id: "FAC-VB", name: "Life Vincent Pallotti", city: "Cape Town", province: "Western Cape", beds: 220 },
  { id: "FAC-EN", name: "Life Entabeni", city: "Durban", province: "KwaZulu-Natal", beds: 275 },
  { id: "FAC-BT", name: "Life Bay View", city: "Mossel Bay", province: "Western Cape", beds: 132 },
];

export const ALL_FACILITIES = "__all__" as const;
export type FacilityScope = string | typeof ALL_FACILITIES;

export function facilityName(id: string): string {
  return FACILITIES.find((f) => f.id === id)?.name ?? id;
}

export function inScope(itemFacility: string | undefined, scope: FacilityScope): boolean {
  if (scope === ALL_FACILITIES) return true;
  if (!itemFacility) return false;
  const target = FACILITIES.find((f) => f.id === scope)?.name;
  return itemFacility === scope || itemFacility === target;
}
