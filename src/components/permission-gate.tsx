import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { Lock } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { reasonFor, type Permission } from "@/rules/permissions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  permission: Permission;
  children: ReactNode;
  /** Render nothing when denied. Defaults to `false` (render disabled + tooltip). */
  hideWhenDenied?: boolean;
  fallback?: ReactNode;
}

/**
 * Wraps an action/button/field. When the active role lacks `permission`, the child
 * is rendered disabled and hovering shows the human-readable denial reason.
 */
export function PermissionGate({ permission, children, hideWhenDenied, fallback }: Props) {
  const { can } = useAuth();
  const allowed = can(permission);
  if (allowed) return <>{children}</>;
  if (hideWhenDenied) return <>{fallback ?? null}</>;

  const reason = reasonFor(permission);

  if (isValidElement(children)) {
    const child = children as ReactElement<Record<string, unknown>>;
    const disabled = cloneElement(child, {
      disabled: true,
      "aria-disabled": true,
      className: [
        (child.props as { className?: string }).className,
        "opacity-50 cursor-not-allowed pointer-events-none",
      ].filter(Boolean).join(" "),
      onClick: undefined,
    });
    return (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex pointer-events-auto">{disabled}</span>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="flex items-start gap-2">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="text-xs">Unavailable — {reason}</span>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return <span className="opacity-50" title={"Unavailable — " + reason}>{children}</span>;
}

export function DeniedInline({ permission }: { permission: Permission }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
      <Lock className="h-3.5 w-3.5" />
      <span>Unavailable — {reasonFor(permission)}</span>
    </div>
  );
}
