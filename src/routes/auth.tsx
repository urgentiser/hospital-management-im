import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { HeartPulse, LogIn, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { appConfig } from "@/configuration/app-config";
import { authClient } from "@/security/auth-client-factory";

type AuthSearch = { redirect?: string; next?: string };

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — Impilo" },
      { name: "description", content: "Sign in to the Impilo Modern Platform." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): AuthSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
    next: typeof search.next === "string" ? search.next : undefined,
  }),
  component: AuthPage,
});

function sanitiseReturnPath(value: string | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  try {
    const candidate = new URL(value, window.location.origin);
    return candidate.origin === window.location.origin ? `${candidate.pathname}${candidate.search}${candidate.hash}` : null;
  } catch {
    return null;
  }
}

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const returnTo = useMemo(
    () => sanitiseReturnPath(search.next) ?? sanitiseReturnPath(search.redirect) ?? "/",
    [search.next, search.redirect],
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void authClient.getSession().then((session) => {
      if (active && session) void navigate({ to: returnTo, replace: true });
    });
    const unsubscribe = authClient.subscribe((session) => {
      if (session) void navigate({ to: returnTo, replace: true });
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [navigate, returnTo]);

  async function performSignIn() {
    setBusy(true);
    try {
      await authClient.signIn({ email: email.trim(), password, returnTo });
      if (authClient.kind !== "entra-bff") await navigate({ to: returnTo, replace: true });
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Sign-in failed. Contact Impilo support.");
    } finally {
      setBusy(false);
    }
  }

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    await performSignIn();
  }

  const enterpriseRedirect = authClient.kind === "entra-bff";
  const mockMode = authClient.kind === "mock";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-hero px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card/95 p-7 shadow-elevated backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            <HeartPulse className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <div className="font-display text-xl font-semibold">Impilo</div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Modern Platform · {appConfig.environment}
            </div>
          </div>
        </div>

        <div className="mt-7">
          <div className="flex items-center gap-2 text-xs font-medium text-primary">
            <ShieldCheck className="h-4 w-4" /> Enterprise access
          </div>
          <h1 className="mt-2 font-display text-2xl font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Use your approved Life Healthcare account. Public account registration is disabled.
          </p>
        </div>

        {enterpriseRedirect ? (
          <Button
            className="mt-6 w-full bg-gradient-primary hover:opacity-90"
            disabled={busy}
            onClick={() => void performSignIn()}
          >
            <LogIn className="mr-2 h-4 w-4" /> Continue with Microsoft
          </Button>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={signIn}>
            <div className="space-y-1.5">
              <Label htmlFor="work-email">Work email</Label>
              <Input
                id="work-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={mockMode ? "demo.user@lifehealthcare.co.za" : "you@lifehealthcare.co.za"}
                required={!mockMode}
              />
            </div>
            {!mockMode && (
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
            )}
            <Button className="w-full bg-gradient-primary hover:opacity-90" type="submit" disabled={busy}>
              <LogIn className="mr-2 h-4 w-4" /> {busy ? "Signing in…" : mockMode ? "Enter demonstration" : "Sign in"}
            </Button>
          </form>
        )}

        <div className="mt-6 rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          Access is permission and facility scoped. Authentication activity is monitored and audited.
        </div>
      </section>
    </main>
  );
}
