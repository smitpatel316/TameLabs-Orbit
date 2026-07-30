
export type TameUser = {
  id: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  provider?: 'supabase' | 'mock' | 'keycloak';
  hubbleBrier?: number;
  hubblePredictionsCount?: number;
  meta?: Record<string, any>;
};

export type Session = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  user: TameUser;
};

export type SignInParams = {
  email: string;
  password?: string;
  otpCode?: string;
};

export interface IdentityProvider {
  name: string;
  init(): Promise<void>;
  getSession(): Promise<Session | null>;
  getUser(): Promise<TameUser | null>;
  getToken(): Promise<string | null>;
  signIn(params: SignInParams): Promise<Session>;
  signInWithOtp(email: string): Promise<void>;
  signInWithOAuth(provider: 'google' | 'apple'): Promise<void>;
  signOut(): Promise<void>;
  onAuthChange(cb: (session: Session | null) => void): () => void;
}
