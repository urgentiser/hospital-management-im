export interface SavedReport {
  id: string;
  name: string;
  owner: string;
  category: "Clinical" | "Financial" | "Operational" | "Integration";
  lastRun: string;
  scheduled?: string;
}

export const MOCK_REPORTS: SavedReport[] = [
  { id: "RPT-1", name: "Daily admissions by facility", owner: "Dr. K. Naidoo", category: "Operational", lastRun: "2026-07-11T06:00:00Z", scheduled: "Daily 06:00" },
  { id: "RPT-2", name: "Outstanding balances > 60 days", owner: "R. Ndlovu", category: "Financial", lastRun: "2026-07-10T22:00:00Z", scheduled: "Weekly Sun 22:00" },
  { id: "RPT-3", name: "Authorisation turnaround", owner: "J. Botha", category: "Operational", lastRun: "2026-07-11T04:30:00Z" },
  { id: "RPT-4", name: "Failed integrations by topic", owner: "Support", category: "Integration", lastRun: "2026-07-11T08:00:00Z", scheduled: "Hourly" },
  { id: "RPT-5", name: "Theatre utilisation", owner: "Ops", category: "Clinical", lastRun: "2026-07-10T18:00:00Z" },
  { id: "RPT-6", name: "Discharge summary compliance", owner: "Compliance", category: "Clinical", lastRun: "2026-07-09T09:00:00Z" },
  { id: "RPT-7", name: "Refunds and reversals", owner: "Finance", category: "Financial", lastRun: "2026-07-11T07:00:00Z" },
];
