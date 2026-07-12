import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Card } from "@/components/app-shell";
import { useAuth } from "@/lib/auth/auth-context";
import { ROLE_COLOR, ROLE_DESCRIPTIONS } from "@/rules/roles";
import { formatSADateTime } from "@/rules/formatting";
import { LogOut } from "lucide-react";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — Impilo" }] }),
  component: Profile,
});

function Profile() {
  const { session, activeRole, extend, logout, expiresAt } = useAuth();
  if (!session) return null;
  const u = session.user;
  const initials = u.displayName.split(" ").map((s) => s[0]).slice(0, 2).join("");

  return (
    <>
      <PageHeader eyebrow="Overview · Profile" title="User profile" description="Your Microsoft Entra ID account, roles and session." />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5 md:col-span-2">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-lg font-semibold text-primary">{initials}</div>
            <div>
              <div className="font-display text-2xl">{u.displayName}</div>
              <div className="text-sm text-muted-foreground">{u.jobTitle}</div>
              <div className="text-xs text-muted-foreground">{u.email}</div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 text-sm">
            <Row label="Object ID" value={u.oid} />
            <Row label="Tenant" value={u.tenantId} />
            <Row label="Active role" value={activeRole ?? "—"} />
            <Row label="Session expires" value={expiresAt ? formatSADateTime(new Date(expiresAt).toISOString()) : "—"} />
          </div>

          <div className="mt-5 flex items-center gap-2">
            <button onClick={extend} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/60 px-3 py-1.5 text-xs">Extend session</button>
            <button onClick={logout} className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Assigned roles</div>
          <ul className="space-y-2 text-xs">
            {u.roles.map((r) => (
              <li key={r} className="flex items-start gap-2">
                <span className={"mt-0.5 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium " + ROLE_COLOR[r]}>{r}</span>
                <span className="text-muted-foreground">{ROLE_DESCRIPTIONS[r]}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-mono text-xs">{value}</div>
    </div>
  );
}
