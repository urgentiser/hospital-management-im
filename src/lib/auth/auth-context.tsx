import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { Role } from "@/rules/roles";
import { can, type Permission } from "@/rules/permissions";
import { ALL_FACILITIES, type FacilityScope } from "@/rules/facilities";
import {
  extendSession,
  mockSignIn,
  mockSignOut,
  persistActiveRole,
  persistFacility,
  readActiveRole,
  readFacility,
  readSession,
  SESSION_WARN_BEFORE_MS,
  type EntraSession,
} from "./entra-mock";

interface AuthState {
  session: EntraSession | null;
  activeRole: Role | null;
  activeFacility: FacilityScope;
  isAuthenticated: boolean;
  expiresAt: number | null;
  isExpiring: boolean;
  hydrated: boolean;
  login: (email?: string) => void;
  logout: () => void;
  switchRole: (role: Role) => void;
  switchFacility: (id: FacilityScope) => void;
  extend: () => void;
  can: (p: Permission) => boolean;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<EntraSession | null>(null);
  const [activeRole, setActiveRole] = useState<Role | null>(null);
  const [activeFacility, setActiveFacility] = useState<FacilityScope>(ALL_FACILITIES);
  const [isExpiring, setIsExpiring] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const warnedRef = useRef(false);

  // Hydrate from browser storage — client-side only.
  useEffect(() => {
    const s = readSession();
    setSession(s);
    const role = readActiveRole() ?? s?.user.roles[0] ?? null;
    setActiveRole(role);
    const fac = readFacility();
    if (fac) setActiveFacility(fac);
    setHydrated(true);
  }, []);

  // Session expiry watcher.
  useEffect(() => {
    if (!session) return;
    const iv = setInterval(() => {
      const remaining = session.expiresAt - Date.now();
      if (remaining <= 0) {
        mockSignOut();
        setSession(null);
        toast.error("Session expired", { description: "Please sign in again." });
        return;
      }
      if (remaining <= SESSION_WARN_BEFORE_MS && !warnedRef.current) {
        warnedRef.current = true;
        setIsExpiring(true);
        toast.warning("Session expiring soon", { description: "Extend your session to stay signed in." });
      }
    }, 15000);
    return () => clearInterval(iv);
  }, [session]);

  const login = useCallback((email?: string) => {
    const s = mockSignIn(email);
    setSession(s);
    const role = readActiveRole() ?? s.user.roles[0];
    setActiveRole(role);
    persistActiveRole(role);
    warnedRef.current = false;
    setIsExpiring(false);
    toast.success("Signed in", { description: `Welcome, ${s.user.displayName}` });
  }, []);

  const logout = useCallback(() => {
    mockSignOut();
    setSession(null);
    setIsExpiring(false);
    warnedRef.current = false;
    toast.info("Signed out");
  }, []);

  const switchRole = useCallback((role: Role) => {
    setActiveRole(role);
    persistActiveRole(role);
    toast.info("Role switched", { description: `Now simulating: ${role}` });
  }, []);

  const switchFacility = useCallback((id: FacilityScope) => {
    setActiveFacility(id);
    persistFacility(id);
  }, []);

  const extend = useCallback(() => {
    const s = extendSession();
    if (s) {
      setSession(s);
      warnedRef.current = false;
      setIsExpiring(false);
      toast.success("Session extended");
    }
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      session,
      activeRole,
      activeFacility,
      isAuthenticated: !!session,
      expiresAt: session?.expiresAt ?? null,
      isExpiring,
      hydrated,
      login,
      logout,
      switchRole,
      switchFacility,
      extend,
      can: (p) => can(activeRole, p),
    }),
    [session, activeRole, activeFacility, isExpiring, hydrated, login, logout, switchRole, switchFacility, extend],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

export function useFacilityScope(): FacilityScope {
  return useAuth().activeFacility;
}
