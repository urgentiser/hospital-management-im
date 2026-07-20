import type { AuthSession } from "@/security/types";

export type SignInInput = {
  email?: string;
  password?: string;
  returnTo?: string;
};

export interface AuthClient {
  readonly kind: "supabase" | "mock" | "entra-bff";
  getSession(): Promise<AuthSession | null>;
  getAccessToken(): Promise<string | null>;
  signIn(input: SignInInput): Promise<void>;
  signOut(returnTo?: string): Promise<void>;
  subscribe(listener: (session: AuthSession | null) => void): () => void;
}
