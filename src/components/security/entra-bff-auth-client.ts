import { appConfig } from "@/configuration/app-config";
import type { AuthClient } from "@/security/auth-client";
import type { AuthSession } from "@/security/types";

async function fetchSession(): Promise<AuthSession | null> {
  const response = await fetch(appConfig.authSessionPath, { credentials: "include" });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error(`Unable to load enterprise session (${response.status}).`);
  return (await response.json()) as AuthSession;
}

export const entraBffAuthClient: AuthClient = {
  kind: "entra-bff",
  getSession: fetchSession,
  async getAccessToken() {
    return null;
  },
  async signIn({ returnTo }) {
    const target = new URL(appConfig.authLoginPath, window.location.origin);
    if (returnTo) target.searchParams.set("returnTo", returnTo);
    window.location.assign(target.toString());
  },
  async signOut(returnTo = "/auth") {
    const target = new URL(appConfig.authLogoutPath, window.location.origin);
    target.searchParams.set("returnTo", returnTo);
    window.location.assign(target.toString());
  },
  subscribe() {
    return () => undefined;
  },
};
