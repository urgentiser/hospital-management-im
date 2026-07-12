import type { ComponentType, ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Link } from "@tanstack/react-router";

type Tone = "default" | "success" | "warning" | "destructive" | "info";

const toneRing: Record<Tone, string> = {
  default: "before:bg-primary/70",
  success: "before:bg-success/70",
  warning: "before:bg-warning/70",
  destructive: "before:bg-destructive/70",
  info: "before:bg-info/70",
};

const toneIcon: Record<Tone, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
};

export interface KpiCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  delta?: string;
  trend?: "up" | "down" | "flat";
  icon?: ComponentType<{ className?: string }>;
  tone?: Tone;
  to?: string;
}

export function KpiCard({
  label,
  value,
  hint,
  delta,
  trend,
  icon: Icon,
  tone = "default",
  to,
}: KpiCardProps) {
  const trendCls =
    trend === "up"
      ? "bg-success/10 text-success"
      : trend === "down"
      ? "bg-destructive/10 text-destructive"
      : "bg-muted text-muted-foreground";
  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;

  const inner = (
    <div
      className={
        "relative overflow-hidden rounded-2xl border border-border bg-card/60 bg-gradient-surface p-5 shadow-soft backdrop-blur-sm transition-all " +
        "before:absolute before:inset-y-4 before:left-0 before:w-[3px] before:rounded-r-full " +
        toneRing[tone] +
        (to ? " hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background" : "")
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </div>
          <div className="mt-3 font-display text-3xl leading-none tracking-tight text-foreground sm:text-4xl">
            {value}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {Icon && (
            <div className={"grid h-9 w-9 place-items-center rounded-xl " + toneIcon[tone]}>
              <Icon className="h-4 w-4" />
            </div>
          )}
          {delta && (
            <span
              className={
                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium " +
                trendCls
              }
            >
              <TrendIcon className="h-3 w-3" />
              {delta}
            </span>
          )}
        </div>
      </div>
      {hint && <div className="mt-3 truncate text-xs text-muted-foreground">{hint}</div>}
    </div>
  );

  if (to) {
    return (
      <Link to={to as never} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}
