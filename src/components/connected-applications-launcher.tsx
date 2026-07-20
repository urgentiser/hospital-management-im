import { ExternalLink } from "lucide-react";
import { useAuth } from "@/security/auth-provider";
import { useFacilityContext } from "@/lib/facility-context";
import { connectedAppsService } from "@/services/connected-apps.service";

export function ConnectedApplicationsLauncher({
  compact = false,
  excludeKeys = [],
}: {
  compact?: boolean;
  excludeKeys?: string[];
}) {
  const { principal } = useAuth();
  const facility = useFacilityContext((state) => state.facility);
  const applications = connectedAppsService.list(principal).filter((application) => !excludeKeys.includes(application.key));
  if (!applications.length) return null;
  return (
    <div className={compact ? "mt-2 space-y-1" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"}>
      {applications.map((application) => (
        <button
          key={application.key}
          type="button"
          onClick={() => connectedAppsService.launch(application, facility)}
          className={
            compact
              ? "flex w-full items-center justify-between rounded-lg border border-sidebar-border bg-sidebar-accent/30 px-3 py-2 text-left text-xs text-sidebar-foreground hover:bg-sidebar-accent"
              : "flex items-start justify-between rounded-xl border border-border bg-card p-4 text-left hover:border-primary/40"
          }
        >
          <span>
            <span className="block font-medium">{application.name}</span>
            <span className="block text-[10px] text-muted-foreground">{application.description}</span>
          </span>
          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      ))}
    </div>
  );
}
