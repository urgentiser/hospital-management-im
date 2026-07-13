import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { HeartPulse, ShieldCheck } from "lucide-react";

// Beta Supabase OAuth surface — narrow local typing until the SDK ships types.
type OAuthClient = { name?: string; client_id?: string; redirect_uri?: string };
type OAuthAuthorizationDetails = {
  client?: OAuthClient;
  scopes?: string[];
  redirect_url?: string;
  redirect_to?: string;
};
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: OAuthAuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: { redirect_url?: string; redirect_to?: string } | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: { redirect_url?: string; redirect_to?: string } | null; error: { message: string } | null }>;
};
function oauth(): OAuthApi {
  return (supabase.auth as unknown as { oauth: OAuthApi }).oauth;
}

type ConsentSearch = { authorization_id: string };

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): ConsentSearch => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/auth", search: { next: location.pathname + location.searchStr } });
    }
  },
  component: ConsentPage,
  errorComponent: ({ error }) => (
    <ErrorScreen message={String((error as Error)?.message ?? error)} />
  ),
});

function ConsentPage() {
  const { authorization_id } = Route.useSearch();
  const [details, setDetails] = useState<OAuthAuthorizationDetails | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await oauth().getAuthorizationDetails(authorization_id);
      if (cancelled) return;
      if (error) return setLoadError(error.message);
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => { cancelled = true; };
  }, [authorization_id]);

  async function decide(approve: boolean) {
    setBusy(true);
    setActionError(null);
    const { data, error } = approve
      ? await oauth().approveAuthorization(authorization_id)
      : await oauth().denyAuthorization(authorization_id);
    if (error) { setBusy(false); setActionError(error.message); return; }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) { setBusy(false); setActionError("No redirect returned by the authorization server."); return; }
    window.location.href = target;
  }

  if (loadError) return <ErrorScreen message={loadError} />;
  if (!details) {
    return (
      <Centered>
        <div className="flex items-center gap-3 text-muted-foreground">
          <HeartPulse className="h-5 w-5 animate-pulse text-primary" />
          <span className="text-sm">Loading authorization…</span>
        </div>
      </Centered>
    );
  }

  const clientName = details.client?.name ?? "an application";
  const redirectUri = details.client?.redirect_uri;
  const scopes = details.scopes ?? [];

  return (
    <Centered>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">Impilo authorization</div>
            <div className="text-[11px] text-muted-foreground -mt-0.5">Life Healthcare platform</div>
          </div>
        </div>

        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Connect <span className="text-primary">{clientName}</span> to your Impilo account
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This lets {clientName} use Impilo as you. Access to patient, admission, and authorisation data is scoped by
          your permissions and RLS policies — this does not bypass them.
        </p>

        {redirectUri && (
          <div className="mt-5 rounded-lg border border-border/70 bg-muted/40 px-3 py-2.5 text-xs">
            <div className="text-muted-foreground">Will redirect to</div>
            <div className="font-mono text-foreground break-all">{redirectUri}</div>
          </div>
        )}

        {scopes.length > 0 && (
          <ul className="mt-5 space-y-1.5 text-sm">
            {scopes.map((s) => (
              <li key={s} className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-foreground">{scopeLabel(s)}</span>
              </li>
            ))}
          </ul>
        )}

        {actionError && (
          <p role="alert" className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {actionError}
          </p>
        )}

        <div className="mt-6 flex gap-2">
          <Button variant="outline" disabled={busy} onClick={() => decide(false)} className="flex-1">
            Cancel connection
          </Button>
          <Button disabled={busy} onClick={() => decide(true)} className="flex-1">
            Approve
          </Button>
        </div>
      </div>
    </Centered>
  );
}

function scopeLabel(scope: string): string {
  switch (scope) {
    case "openid": return "Sign you in";
    case "email": return "Share your email address";
    case "profile": return "Share your basic profile";
    default: return `Additional permission requested: ${scope}`;
  }
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center px-4 py-16">
      {children}
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <Centered>
      <div className="max-w-md text-center">
        <h1 className="text-lg font-semibold text-foreground">Could not load this authorization request</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </div>
    </Centered>
  );
}
