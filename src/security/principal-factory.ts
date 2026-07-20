import { appConfig, isProductionEnvironment } from "@/configuration/app-config";
import { demoPermissions } from "@/security/permissions";
import type { AppPrincipal } from "@/security/types";

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function createPrincipalFromIdentity(user: {
  id?: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}): AppPrincipal {
  const metadata = user.app_metadata ?? {};
  const profile = user.user_metadata ?? {};
  const configuredFacilities = asStringArray(metadata.facilities);
  const facilities = (configuredFacilities.length ? configuredFacilities : appConfig.defaultFacilities).map((name) => ({
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
  }));
  const permissions = asStringArray(metadata.permissions);
  const roles = asStringArray(metadata.roles);

  return {
    subject: user.id ?? user.email ?? "unknown-user",
    displayName:
      (typeof profile.full_name === "string" && profile.full_name) ||
      (typeof profile.name === "string" && profile.name) ||
      user.email ||
      "Impilo User",
    email: user.email ?? undefined,
    roles: roles.length ? roles : ["Impilo User"],
    permissions: permissions.length ? permissions : isProductionEnvironment() ? [] : demoPermissions,
    facilities,
    accountState: facilities.length ? "active" : "no-facility-access",
  };
}
