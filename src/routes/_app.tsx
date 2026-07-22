import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { AccountStatePanel } from "@/components/security/account-state-panel";
import { UnauthorisedPanel } from "@/components/security/unauthorised-panel";
import { FACILITIES, useFacilityContext, type Facility } from "@/lib/facility-context";
import { AuthProvider, useAuth } from "@/security/auth-provider";
import { getAuthorisedFacilityNames } from "@/security/facility-scope";
import { canAccessRoute, getRequiredPermissionForPath } from "@/security/route-guard";
import { useSessionManager } from "@/security/session-manager";

export const Route = createFileRoute("/_app")({
  ssr: false,
  component: AuthenticatedApplication,
});

function AuthenticatedApplication() {
  return (
    <AuthProvider>
      <ProtectedShell />
    </AuthProvider>
  );
}

function ProtectedShell() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const returnPath = useRouterState({ select: (state) => `${state.location.pathname}${state.location.searchStr}` });
  const { status, principal, error, refresh, logout } = useAuth();
  const facility = useFacilityContext((state) => state.facility);
  const setFacility = useFacilityContext((state) => state.setFacility);

  useEffect(() => {
    if (status === "anonymous") {
      const safeReturn = returnPath.startsWith("/auth") ? "/" : returnPath;
      void navigate({ to: "/auth", search: { redirect: safeReturn }, replace: true });
    }
  }, [navigate, returnPath, status]);


  useEffect(() => {
    if (!principal || principal.accountState !== "active") return;
    const authorised = getAuthorisedFacilityNames(principal, [...FACILITIES]);
    if (!authorised.length) return;
    if (!authorised.includes(facility)) setFacility(authorised[0] as Facility);
  }, [facility, principal, setFacility]);

  const expire = useCallback(async () => {
    toast.error("Your Impilo session expired. Sign in again to continue.");
    await logout();
    await navigate({ to: "/auth", search: { redirect: returnPath }, replace: true });
  }, [logout, navigate, returnPath]);

  const warn = useCallback((minutesRemaining: number) => {
    toast.warning(`Your session will expire in approximately ${minutesRemaining} minute${minutesRemaining === 1 ? "" : "s"}.`);
  }, []);

  useSessionManager({ enabled: status === "authenticated", onWarning: warn, onExpire: expire });

  if (status === "loading") return <AccountStatePanel state="loading" />;
  if (status === "error") {
    return <AccountStatePanel state="error" message={error?.message} onRetry={() => void refresh()} />;
  }
  if (status !== "authenticated" || !principal) return <AccountStatePanel state="loading" />;
  if (principal.accountState !== "active") return <AccountStatePanel state={principal.accountState} />;

  const requiredPermission = getRequiredPermissionForPath(pathname);
  if (!canAccessRoute(principal, pathname)) {
    return <UnauthorisedPanel permission={requiredPermission} onReturn={() => void navigate({ to: "/" })} />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
