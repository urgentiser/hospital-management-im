import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HeartPulse, ShieldCheck, LogIn } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Impilo" },
      { name: "description", content: "Sign in to Impilo with your organisation account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, isAuthenticated, hydrated } = useAuth();
  const navigate = useNavigate();
  const search = useRouterState({ select: (s) => s.location.search }) as { redirect?: string };
  const [email, setEmail] = useState("kagiso.naidoo@impilo.co.za");

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      navigate({ to: search.redirect ?? "/" });
    }
  }, [hydrated, isAuthenticated, navigate, search.redirect]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email);
    setTimeout(() => navigate({ to: search.redirect ?? "/" }), 50);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card/80 p-8 shadow-soft backdrop-blur">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            <HeartPulse className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <div className="font-display text-xl text-foreground">Impilo</div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Modern Healthcare Platform</div>
          </div>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">Use your Microsoft Entra ID account. This is a mocked sign-in for demo purposes.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-xs font-medium text-muted-foreground">
            Work email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              required
            />
          </label>

          <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-glow transition-opacity hover:opacity-95">
            <ShieldCheck className="h-4 w-4" /> Sign in with Microsoft Entra ID
          </button>

          <button
            type="button"
            onClick={submit}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background/60 px-4 py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <LogIn className="h-3.5 w-3.5" /> Continue as demo user
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          Sessions last 30 minutes and extend automatically on activity.
        </p>
      </div>
    </div>
  );
}
