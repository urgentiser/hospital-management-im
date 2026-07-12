/** Mocked Microsoft Entra ID (Azure AD) authentication. No network calls. */
import type { Role } from "@/rules/roles";

export interface EntraUser {
  oid: string;
  displayName: string;
  jobTitle: string;
  email: string;
  tenantId: string;
  roles: Role[];
}

export interface EntraSession {
  user: EntraUser;
  accessToken: string;
  issuedAt: number;
  expiresAt: number;
}

const SESSION_KEY = "impilo.entra.session.v1";
const ROLE_KEY = "impilo.entra.activeRole.v1";
const FACILITY_KEY = "impilo.entra.facility.v1";

// 30-minute simulated lifetime (matches typical Entra access token expiry pattern).
export const SESSION_LIFETIME_MS = 30 * 60 * 1000;
export const SESSION_WARN_BEFORE_MS = 2 * 60 * 1000;

const MOCK_USERS: EntraUser[] = [
  {
    oid: "9c1a3b1e-1111-4a80-90b0-1a2b3c4d5e6f",
    displayName: "Dr. Kagiso Naidoo",
    jobTitle: "Clinical Lead",
    email: "kagiso.naidoo@impilo.co.za",
    tenantId: "impilo-tenant",
    roles: ["Administrator", "Clinical User", "Operational User", "Support User", "Reporting User", "Read-only User"],
  },
];

export function mockSignIn(email?: string): EntraSession {
  const user = MOCK_USERS.find((u) => u.email === email) ?? MOCK_USERS[0];
  const now = Date.now();
  const session: EntraSession = {
    user,
    accessToken: "mock." + Math.random().toString(36).slice(2) + "." + now,
    issuedAt: now,
    expiresAt: now + SESSION_LIFETIME_MS,
  };
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch { /* ignore */ }
  return session;
}

export function readSession(): EntraSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as EntraSession;
    if (!s?.expiresAt || Date.now() > s.expiresAt) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export function extendSession(): EntraSession | null {
  const s = readSession();
  if (!s) return null;
  const now = Date.now();
  const next = { ...s, expiresAt: now + SESSION_LIFETIME_MS };
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
  } catch { /* ignore */ }
  return next;
}

export function mockSignOut(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch { /* ignore */ }
}

export function persistActiveRole(role: Role): void {
  try { localStorage.setItem(ROLE_KEY, role); } catch { /* ignore */ }
}

export function readActiveRole(): Role | null {
  try { return (localStorage.getItem(ROLE_KEY) as Role | null) ?? null; } catch { return null; }
}

export function persistFacility(facility: string): void {
  try { localStorage.setItem(FACILITY_KEY, facility); } catch { /* ignore */ }
}

export function readFacility(): string | null {
  try { return localStorage.getItem(FACILITY_KEY); } catch { return null; }
}
