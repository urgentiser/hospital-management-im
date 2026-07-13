import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { HeartPulse } from "lucide-react";

export const Route = createFileRoute("/_app")({
  ssr: false,
  component: AuthGatedShell,
});

function AuthGatedShell() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname + s.location.searchStr });
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (!data.session) {
        navigate({ to: "/auth", search: { redirect: pathname }, replace: true });
        return;
      }
      setAuthed(true);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) {
        setAuthed(false);
        navigate({ to: "/auth", search: { redirect: pathname }, replace: true });
      } else {
        setAuthed(true);
      }
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready || !authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <HeartPulse className="h-5 w-5 animate-pulse text-primary" />
          <span className="text-sm">Loading Impilo…</span>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
