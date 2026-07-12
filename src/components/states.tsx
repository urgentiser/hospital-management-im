import { AlertTriangle, FileQuestion, Inbox, Lock, Loader2, ServerCrash, WifiOff, Clock } from "lucide-react";
import type { ReactNode } from "react";

function Frame({
  icon,
  title,
  description,
  action,
  tone = "muted",
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: "muted" | "danger" | "warning" | "info";
}) {
  const toneClass = {
    muted: "border-border bg-card/50",
    danger: "border-destructive/40 bg-destructive/5",
    warning: "border-amber-500/40 bg-amber-500/5",
    info: "border-primary/40 bg-primary/5",
  }[tone];
  return (
    <div className={"flex flex-col items-center justify-center gap-3 rounded-2xl border px-6 py-12 text-center " + toneClass}>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background/60">{icon}</div>
      <div>
        <div className="text-sm font-semibold text-foreground">{title}</div>
        {description && <div className="mt-1 max-w-md text-xs text-muted-foreground">{description}</div>}
      </div>
      {action}
    </div>
  );
}

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-2xl border border-border bg-card/50 px-6 py-12 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{label}…</span>
    </div>
  );
}

export function EmptyState({ title = "Nothing here yet", description, action }: { title?: string; description?: string; action?: ReactNode }) {
  return <Frame icon={<Inbox className="h-5 w-5 text-muted-foreground" />} title={title} description={description} action={action} />;
}

export function ErrorState({ title = "Something went wrong", description, action }: { title?: string; description?: string; action?: ReactNode }) {
  return <Frame tone="danger" icon={<ServerCrash className="h-5 w-5 text-destructive" />} title={title} description={description} action={action} />;
}

export function UnauthorisedState({ reason, action }: { reason: string; action?: ReactNode }) {
  return <Frame tone="warning" icon={<Lock className="h-5 w-5 text-amber-500" />} title="You don't have access to this" description={reason} action={action} />;
}

export function NotFoundState({ title = "Not found", description, action }: { title?: string; description?: string; action?: ReactNode }) {
  return <Frame icon={<FileQuestion className="h-5 w-5 text-muted-foreground" />} title={title} description={description} action={action} />;
}

export function StaleDataBanner({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
      <div className="flex items-center gap-2">
        <Clock className="h-3.5 w-3.5" />
        <span>Data may be out of date.</span>
      </div>
      {onRefresh && (
        <button onClick={onRefresh} className="rounded-md border border-amber-500/40 px-2 py-1 text-[11px] font-medium hover:bg-amber-500/10">
          Refresh
        </button>
      )}
    </div>
  );
}

export function OfflineBanner() {
  return (
    <div className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
      <WifiOff className="h-3.5 w-3.5" />
      <span>You appear to be offline. Changes will not be saved until connectivity is restored.</span>
    </div>
  );
}

export function InfoNote({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 flex items-start gap-2 rounded-xl border border-primary/25 bg-primary/5 px-3 py-2 text-xs text-primary">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <div className="text-primary/90">{children}</div>
    </div>
  );
}
