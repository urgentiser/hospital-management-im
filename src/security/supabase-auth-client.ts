import { supabase } from "@/integrations/supabase/client";
import type { AuthClient, SignInInput } from "@/security/auth-client";
import { createPrincipalFromIdentity } from "@/security/principal-factory";
import type { AuthSession } from "@/security/types";

function mapSession(session: {
  access_token?: string;
  expires_at?: number;
  user: Parameters<typeof createPrincipalFromIdentity>[0];
} | null): AuthSession | null {
  if (!session) return null;
  return {
    accessToken: session.access_token,
    expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : undefined,
    principal: createPrincipalFromIdentity(session.user),
  };
}

export const supabaseAuthClient: AuthClient = {
  kind: "supabase",
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return mapSession(data.session);
  },
  async getAccessToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  },
  async signIn(input: SignInInput) {
    if (!input.email || !input.password) throw new Error("Work email and password are required.");
    const { error } = await supabase.auth.signInWithPassword({ email: input.email, password: input.password });
    if (error) throw error;
  },
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
  subscribe(listener) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => listener(mapSession(session)));
    return () => data.subscription.unsubscribe();
  },
};
