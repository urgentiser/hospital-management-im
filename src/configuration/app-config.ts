export type AuthProviderKind = "supabase" | "mock" | "entra-bff";
export type DataMode = "mock" | "api";

function readList(value: string | undefined, fallback: string[]): string[] {
  const items = value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return items?.length ? items : fallback;
}

export const appConfig = {
  applicationName: import.meta.env.VITE_APPLICATION_NAME ?? "Impilo Modern Platform",
  environment: import.meta.env.VITE_ENVIRONMENT ?? "DEMO",
  authProvider: (import.meta.env.VITE_AUTH_PROVIDER ?? "mock") as AuthProviderKind,
  dataMode: (import.meta.env.VITE_DATA_MODE ?? "mock") as DataMode,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "/api/v1",
  authLoginPath: import.meta.env.VITE_AUTH_LOGIN_PATH ?? "/api/auth/login",
  authLogoutPath: import.meta.env.VITE_AUTH_LOGOUT_PATH ?? "/api/auth/logout",
  authSessionPath: import.meta.env.VITE_AUTH_SESSION_PATH ?? "/api/auth/session",
  sessionTimeoutMinutes: Number(import.meta.env.VITE_SESSION_TIMEOUT_MINUTES ?? 30),
  sessionWarningMinutes: Number(import.meta.env.VITE_SESSION_WARNING_MINUTES ?? 5),
  defaultFacilities: readList(import.meta.env.VITE_DEFAULT_FACILITIES, ["Life Fourways"]),
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL ?? "impilo-support@lifehealthcare.co.za",
  telemetryEnabled: (import.meta.env.VITE_TELEMETRY_ENABLED ?? "false") === "true",
} as const;

export function isProductionEnvironment(): boolean {
  return appConfig.environment.toLowerCase() === "production" || appConfig.environment.toLowerCase() === "prod";
}
