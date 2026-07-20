export type Permission = string;
export type AccountState = "active" | "disabled" | "pending" | "no-facility-access";
export type AuthStatus = "loading" | "authenticated" | "anonymous" | "error";

export type FacilityAccess = {
  id: string;
  name: string;
  canOverride?: boolean;
};

export type AppPrincipal = {
  subject: string;
  displayName: string;
  email?: string;
  roles: string[];
  permissions: Permission[];
  facilities: FacilityAccess[];
  accountState: AccountState;
  expiresAt?: string;
};

export type AuthSession = {
  accessToken?: string;
  expiresAt?: string;
  principal: AppPrincipal;
};
