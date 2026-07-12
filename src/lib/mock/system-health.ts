export interface SystemService {
  name: string;
  status: "healthy" | "degraded" | "down";
  region: string;
  latencyMs: number;
  uptime30d: number;
  lastIncident?: string;
}

export const MOCK_SERVICES: SystemService[] = [
  { name: "Impilo Core API", status: "healthy", region: "za-north", latencyMs: 82, uptime30d: 99.97 },
  { name: "Azure Service Bus (impilo-events)", status: "degraded", region: "za-north", latencyMs: 412, uptime30d: 99.82, lastIncident: "Elevated retry rate on billing.claim.submitted.v1" },
  { name: "Documents Service", status: "healthy", region: "za-north", latencyMs: 118, uptime30d: 99.94 },
  { name: "Scheme Gateway", status: "healthy", region: "za-north", latencyMs: 220, uptime30d: 99.9 },
  { name: "PCMS Bridge", status: "healthy", region: "za-north", latencyMs: 145, uptime30d: 99.88 },
  { name: "Reporting / BI", status: "healthy", region: "za-north", latencyMs: 96, uptime30d: 99.99 },
  { name: "Entra ID (mock)", status: "healthy", region: "za-north", latencyMs: 62, uptime30d: 100 },
  { name: "Bank Gateway", status: "down", region: "za-north", latencyMs: 0, uptime30d: 98.4, lastIncident: "Peering issue with acquirer — investigating." },
];
