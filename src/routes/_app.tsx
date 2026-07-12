import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth/auth-context";
import { LoadingState } from "@/components/states";

export const Route = createFileRoute("/_app")({
  component: AppGate,
});

function AppGate() {
  const { isAuthenticated, hydrated } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      navigate({ to: "/login", search: { redirect: pathname } });
    }
  }, [hydrated, isAuthenticated, navigate, pathname]);

  if (!hydrated) {
    return <div className="p-8"><LoadingState label="Restoring your session" /></div>;
  }
  if (!isAuthenticated) return null;

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
