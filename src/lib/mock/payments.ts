import { MOCK_PATIENTS } from "./patients";
import type { PaymentState } from "@/rules/workflow";

export interface AccountSummary {
  accountId: string;
  patientId: string;
  patientName: string;
  facility: string;
  scheme: string;
  totalCharges: number;
  paid: number;
  outstanding: number;
  lastActivity: string;
}

export interface PaymentEntry {
  id: string;
  accountId: string;
  patientName: string;
  amount: number;
  method: "Cash" | "EFT" | "Card" | "Cheque" | "Scheme";
  reference: string;
  state: PaymentState;
  receivedAt: string;
}

export const MOCK_ACCOUNTS: AccountSummary[] = MOCK_PATIENTS.slice(0, 22).map((p, i) => {
  const totalCharges = 4000 + (i * 8137) % 96000;
  const paid = Math.round(totalCharges * ((i % 5) * 0.2));
  return {
    accountId: `ACC-${88213 + i}`,
    patientId: p.id,
    patientName: p.fullName,
    facility: p.facility,
    scheme: p.scheme,
    totalCharges,
    paid,
    outstanding: totalCharges - paid,
    lastActivity: new Date(Date.now() - i * 3600_000 * 5).toISOString(),
  };
});

const METHODS: PaymentEntry["method"][] = ["EFT", "Card", "Scheme", "Cash", "Cheque"];
const STATES: PaymentState[] = ["cleared", "processing", "captured", "failed", "refunded", "reversed"];

export const MOCK_PAYMENTS: PaymentEntry[] = MOCK_ACCOUNTS.map((a, i) => ({
  id: `PAY-${99001 + i}`,
  accountId: a.accountId,
  patientName: a.patientName,
  amount: Math.max(500, a.paid || 1500 + i * 137),
  method: METHODS[i % METHODS.length],
  reference: `REF-${(10000 + i * 89).toString()}`,
  state: STATES[i % STATES.length],
  receivedAt: new Date(Date.now() - i * 3600_000 * 3).toISOString(),
}));
