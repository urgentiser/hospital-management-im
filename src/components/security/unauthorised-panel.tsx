import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UnauthorisedPanel({ permission, onReturn }: { permission?: string; onReturn?: () => void }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-soft">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <ShieldX className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-xl font-semibold">Access is restricted</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your current role and facility access do not permit this page.
          {permission ? ` Required permission: ${permission}.` : ""}
        </p>
        {onReturn && <Button className="mt-5" onClick={onReturn}>Return to dashboard</Button>}
      </div>
    </div>
  );
}
