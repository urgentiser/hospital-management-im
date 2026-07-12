import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export interface SectionProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  viewAllTo?: string;
  viewAllLabel?: string;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}

export function Section({
  title,
  description,
  actions,
  viewAllTo,
  viewAllLabel = "View all",
  children,
  className = "",
  padded = false,
}: SectionProps) {
  return (
    <section
      className={
        "rounded-2xl border border-border bg-card/60 bg-gradient-surface shadow-soft backdrop-blur-sm " +
        className
      }
    >
      <header className="flex items-start justify-between gap-3 border-b border-border/70 px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          {viewAllTo && (
            <Link
              to={viewAllTo as never}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              {viewAllLabel} <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </header>
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  );
}
