import { appConfig } from "@/configuration/app-config";
import type { AuthClient } from "@/security/auth-client";
import { entraBffAuthClient } from "@/security/entra-bff-auth-client";
import { mockAuthClient } from "@/security/mock-auth-client";
import { supabaseAuthClient } from "@/security/supabase-auth-client";

export const authClient: AuthClient =
  appConfig.authProvider === "entra-bff"
    ? entraBffAuthClient
    : appConfig.authProvider === "mock"
      ? mockAuthClient
      : supabaseAuthClient;
