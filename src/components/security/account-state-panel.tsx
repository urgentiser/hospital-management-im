import { HeartPulse, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { appConfig } from "@/configuration/app-config";
import type { AccountState } from "@/security/types";

export function AccountStatePanel({
  state,
  message,
  onRetry,
}: {
  state: AccountState | "loading" | "error";
  message?: string;
  onRetry?: () => void;
}) {
  const title =
    state === "loading"
      ? "Loading your Impilo access"
      : state === "disabled"
        ? "Your account is disabled"
        : state === "no-facility-access"
          ? "No facility access is assigned"
          : state === "pending"
            ? "Your access is pending approval"
            : "Impilo could not verify your access";
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-soft">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <HeartPulse className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {message ?? `Contact ${appConfig.supportEmail} if this continues.`}
        </p>
        {onRetry && (
          <Button variant="outline" className="mt-5" onClick={onRetry}>
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        )}
      </div>
    </div>
  );
}
