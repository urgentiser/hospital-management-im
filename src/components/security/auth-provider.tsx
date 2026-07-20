import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { authClient } from "@/security/auth-client-factory";
import type { AppPrincipal, AuthSession, AuthStatus } from "@/security/types";

export type AuthContextValue = {
  status: AuthStatus;
  session: AuthSession | null;
  principal: AppPrincipal | null;
  error: Error | null;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const next = await authClient.getSession();
      setSession(next);
      setStatus(next ? "authenticated" : "anonymous");
    } catch (cause) {
      setSession(null);
      setError(cause instanceof Error ? cause : new Error("Authentication could not be verified."));
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void refresh();
    return authClient.subscribe((next) => {
      setSession(next);
      setStatus(next ? "authenticated" : "anonymous");
    });
  }, [refresh]);

  const logout = useCallback(async () => {
    await authClient.signOut("/auth");
    setSession(null);
    setStatus("anonymous");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, session, principal: session?.principal ?? null, error, refresh, logout }),
    [status, session, error, refresh, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
