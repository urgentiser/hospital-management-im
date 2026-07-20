import { connectedApplications } from "@/configuration/connected-apps";
import type { ConnectedApplication } from "@/contracts/connected-apps";
import { hasPermission } from "@/security/permissions";
import type { AppPrincipal } from "@/security/types";

export const connectedAppsService = {
  list(principal: AppPrincipal | null): ConnectedApplication[] {
    return connectedApplications.all.filter(
      (application) => Boolean(application.url) && hasPermission(principal, application.requiredPermission),
    );
  },
  launch(application: ConnectedApplication, activeFacility?: string): void {
    if (!application.url) throw new Error(`${application.name} is not configured for this environment.`);
    const url = new URL(application.url, window.location.origin);
    if (application.facilityScoped && activeFacility) url.searchParams.set("facility", activeFacility);
    if (application.openMode === "new-tab") window.open(url.toString(), "_blank", "noopener,noreferrer");
    else window.location.assign(url.toString());
  },
};
