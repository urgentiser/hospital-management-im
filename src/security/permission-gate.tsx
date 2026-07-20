import type { ReactNode } from "react";
import { useAuth } from "@/security/auth-provider";
import { hasPermission } from "@/security/permissions";
import type { Permission } from "@/security/types";

export function PermissionGate({
  permission,
  children,
  fallback = null,
}: {
  permission?: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { principal } = useAuth();
  return hasPermission(principal, permission) ? <>{children}</> : <>{fallback}</>;
}
