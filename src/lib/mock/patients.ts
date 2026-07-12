import { FACILITIES } from "@/rules/facilities";

export type PatientStatus = "active" | "pending" | "review" | "closed" | "failed" | "discharged";

export interface MockPatient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dob: string;
  age: number;
  gender: "M" | "F" | "X";
  idNumber: string;
  scheme: string;
  membership: string;
  status: PatientStatus;
  facility: string;
  practitioner: string;
  phone: string;
  email: string;
  address: string;
  alerts: string[];
  createdAt: string;
  updatedAt: string;
}

const SCHEMES = ["Discovery Health", "Bonitas", "Momentum Health", "GEMS", "Polmed", "Medshield", "Fedhealth", "Bestmed"];
const PRACTITIONERS = ["Dr. S. Naidoo", "Dr. M. Khumalo", "Dr. R. Botha", "Dr. K. Sithole", "Dr. L. Pillay", "Dr. A. Adams", "Dr. T. Mabaso", "Dr. C. van Wyk"];
const NAMES: Array<[string, string, "M" | "F"]> = [
  ["Nomvula", "Dlamini", "F"], ["Johan", "van der Merwe", "M"], ["Aisha", "Patel", "F"],
  ["Thabo", "Mokoena", "M"], ["Emily", "Carter", "F"], ["Sipho", "Zulu", "M"],
  ["Lerato", "Mahlangu", "F"], ["Pieter", "Botha", "M"], ["Zanele", "Ndlovu", "F"],
  ["Rajesh", "Naidoo", "M"], ["Amahle", "Cele", "F"], ["Willem", "Kruger", "M"],
  ["Priya", "Reddy", "F"], ["Bongani", "Mkhize", "M"], ["Chantal", "du Toit", "F"],
  ["Kagiso", "Modise", "M"], ["Fatima", "Ismail", "F"], ["Hendrik", "Steyn", "M"],
  ["Mpho", "Sekgobela", "F"], ["Yusuf", "Adams", "M"], ["Sarah", "Nkosi", "F"],
  ["Christiaan", "Meyer", "M"], ["Refilwe", "Molefe", "F"], ["Anwar", "Cassim", "M"],
];

function birthYearFor(age: number) { return new Date().getFullYear() - age; }

export const MOCK_PATIENTS: MockPatient[] = NAMES.map((entry, i) => {
  const [first, last, gender] = entry;
  const age = 20 + ((i * 7) % 60);
  const facility = FACILITIES[i % FACILITIES.length];
  const status: PatientStatus =
    (["active", "pending", "review", "closed", "failed", "discharged"] as PatientStatus[])[i % 6];
  const y = birthYearFor(age);
  const m = String(((i * 3) % 12) + 1).padStart(2, "0");
  const d = String(((i * 11) % 27) + 1).padStart(2, "0");
  const idNum = `${String(y).slice(2)}${m}${d}${String(1000 + i).slice(-4)}08${i % 10}`;
  return {
    id: `P-${10240 + i}`,
    mrn: `MRN-${(32411 + i).toString().padStart(7, "0")}`,
    firstName: first,
    lastName: last,
    fullName: `${first} ${last}`,
    dob: `${y}-${m}-${d}`,
    age,
    gender,
    idNumber: idNum,
    scheme: SCHEMES[i % SCHEMES.length],
    membership: `${(100000 + i * 137).toString().slice(0, 8)}`,
    status,
    facility: facility.name,
    practitioner: PRACTITIONERS[i % PRACTITIONERS.length],
    phone: `+2782${(1000000 + i * 373).toString().slice(0, 7)}`,
    email: `${first.toLowerCase()}.${last.toLowerCase().replace(/[^a-z]/g, "")}@example.co.za`,
    address: `${10 + i} Nelson Mandela Blvd, ${facility.city}, ${facility.province}`,
    alerts: i % 5 === 0 ? ["Penicillin allergy"] : i % 7 === 0 ? ["High-risk"] : [],
    createdAt: `2026-0${(i % 6) + 1}-${((i % 27) + 1).toString().padStart(2, "0")}T09:00:00Z`,
    updatedAt: new Date(Date.now() - i * 3600_000).toISOString(),
  };
});

export function findPatient(idOrMrn: string): MockPatient | undefined {
  return MOCK_PATIENTS.find((p) => p.id === idOrMrn || p.mrn === idOrMrn);
}
