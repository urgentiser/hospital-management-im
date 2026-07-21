import { Link } from "@tanstack/react-router";
import {
  Activity, AlertTriangle, Bell, HeartPulse, Radio, ShieldAlert,
} from "lucide-react";
import { useWorkflow } from "@/lib/workflow-store";
import { cn } from "@/lib/utils";

type Tile = {
  key: string;
  label: string;
  value: number | string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "ok" | "warn" | "bad" | "info";
  to: string;
};

const toneStyles: Record<Tile["tone"], string> = {
  ok:   "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300",
  warn: "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300",
  bad:  "border-rose-500/30 bg-rose-500/5 text-rose-700 dark:text-rose-300",
  info: "border-primary/30 bg-primary/5 text-primary",
};

export function PlatformStrip({ activeKey }: { activeKey?: string }) {
  const items = useWorkflow((s) => s.items);

  const integrations = items.integrations ?? [];
  const dlq = items["failed-messages"] ?? [];
  const notif = items.notifications ?? [];
  const health = items["system-health"] ?? [];
  const audit = items.audit ?? [];

  const pending = integrations.filter((i) => i.status === "pending").length;
  const deadLettered = dlq.filter((i) => i.status === "dead-lettered").length;
  const failedSends = notif.filter((i) => i.status === "failed").length;
  const incidents = health.filter((i) => i.status === "incident" || i.status === "degraded").length;

  const tiles: Tile[] = [
    { key: "integrations", label: "Event bus", value: pending ? `${pending} pending` : "Healthy",
      hint: `${integrations.length} events · 24h`, icon: Radio,
      tone: pending > 5 ? "warn" : "ok", to: "/integrations" },
    { key: "failed-messages", label: "Dead-letter", value: deadLettered,
      hint: deadLettered ? "Awaiting triage" : "No poison", icon: ShieldAlert,
      tone: deadLettered > 0 ? "bad" : "ok", to: "/failed-messages" },
    { key: "notifications", label: "Notifications", value: failedSends ? `${failedSends} failed` : "Delivering",
      hint: `${notif.length} sent · 24h`, icon: Bell,
      tone: failedSends > 0 ? "warn" : "ok", to: "/notifications" },
    { key: "system-health", label: "System health", value: incidents ? `${incidents} open` : "All green",
      hint: incidents ? "Incident in progress" : "SLOs on track", icon: HeartPulse,
      tone: incidents > 0 ? "bad" : "ok", to: "/system-health" },
    { key: "audit", label: "Audit trail", value: audit.length,
      hint: "entries · 24h", icon: Activity,
      tone: "info", to: "/audit" },
  ];

  return (
    <div className="mb-6 rounded-2xl border border-border/60 bg-card/60 p-3 shadow-sm backdrop-blur">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          <AlertTriangle className="h-3.5 w-3.5" />
          Platform operations snapshot
        </div>
        <span className="text-[11px] text-muted-foreground">Live · last 24h</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((t) => {
          const Icon = t.icon;
          const active = activeKey === t.key;
          return (
            <Link
              key={t.key}
              to={t.to}
              className={cn(
                "group flex items-start gap-3 rounded-xl border px-3 py-2.5 transition",
                "hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                toneStyles[t.tone],
                active && "ring-2 ring-primary/40",
              )}
            >
              <span className="mt-0.5 rounded-lg bg-background/60 p-1.5">
                <Icon className="h-4 w-4" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-[11px] font-medium uppercase tracking-wide opacity-80">{t.label}</span>
                <span className="truncate text-sm font-semibold text-foreground">{t.value}</span>
                <span className="truncate text-[11px] text-muted-foreground">{t.hint}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
