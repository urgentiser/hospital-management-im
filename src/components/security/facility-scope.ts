import type { AppPrincipal } from "@/security/types";
import { hasPermission, Permissions } from "@/security/permissions";

export function canAccessFacility(
  principal: AppPrincipal | null | undefined,
  facilityName: string | undefined,
): boolean {
  if (!facilityName || facilityName === "All facilities") {
    return hasPermission(principal, Permissions.FacilityOverride);
  }
  if (!principal) return false;
  if (hasPermission(principal, Permissions.FacilityOverride)) return true;
  return principal.facilities.some((facility) => facility.name === facilityName);
}

export function getAuthorisedFacilityNames(
  principal: AppPrincipal | null | undefined,
  knownFacilities: string[] = [],
): string[] {
  if (!principal) return [];
  if (hasPermission(principal, Permissions.FacilityOverride)) {
    return knownFacilities.length ? knownFacilities : principal.facilities.map((facility) => facility.name);
  }
  const allowed = new Set(principal.facilities.map((facility) => facility.name));
  return knownFacilities.length
    ? knownFacilities.filter((facility) => facility !== "All facilities" && allowed.has(facility))
    : [...allowed];
}
