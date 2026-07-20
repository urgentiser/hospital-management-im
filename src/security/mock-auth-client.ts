import { appConfig } from "@/configuration/app-config";
import type { AuthClient } from "@/security/auth-client";
import { demoPermissions } from "@/security/permissions";
import type { AuthSession } from "@/security/types";

const storageKey = "impilo-enterprise-mock-session";
const listeners = new Set<(session: AuthSession | null) => void>();

function readSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    window.localStorage.removeItem(storageKey);
    return null;
  }
}

function notify(session: AuthSession | null) {
  listeners.forEach((listener) => listener(session));
}

export const mockAuthClient: AuthClient = {
  kind: "mock",
  async getSession() {
    return readSession();
  },
  async getAccessToken() {
    return null;
  },
  async signIn(input) {
    const session: AuthSession = {
      principal: {
        subject: "mock-impilo-user",
        displayName: input.email?.split("@")[0] || "Impilo Demo User",
        email: input.email,
        roles: ["System Administrator"],
        permissions: demoPermissions,
        facilities: appConfig.defaultFacilities.map((name) => ({
          id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          name,
        })),
        accountState: "active",
      },
    };
    window.localStorage.setItem(storageKey, JSON.stringify(session));
    notify(session);
  },
  async signOut() {
    window.localStorage.removeItem(storageKey);
    notify(null);
  },
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
