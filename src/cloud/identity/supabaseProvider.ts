
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IdentityProvider, Session, SignInParams, TameUser } from './types';

let client: SupabaseClient | null = null;
let listeners: ((s: Session | null)=>void)[] = [];

function mapUser(sUser: any): TameUser {
  return {
    id: sUser.id,
    email: sUser.email,
    displayName: sUser.user_metadata?.full_name || sUser.user_metadata?.display_name || sUser.email?.split('@')[0],
    avatarUrl: sUser.user_metadata?.avatar_url,
    provider: 'supabase',
    meta: sUser.user_metadata,
  };
}

function mapSession(sSession: any): Session | null {
  if (!sSession) return null;
  return {
    accessToken: sSession.access_token,
    refreshToken: sSession.refresh_token,
    expiresAt: sSession.expires_at ? sSession.expires_at * 1000 : undefined,
    user: mapUser(sSession.user),
  };
}

export class SupabaseIdentityProvider implements IdentityProvider {
  name = 'supabase' as const;
  private url: string;
  private anonKey: string;
  constructor(config: { url: string; anonKey: string }) { this.url = config.url; this.anonKey = config.anonKey; }
  private getClient(): SupabaseClient {
    if (!client) {
      client = createClient(this.url, this.anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: typeof window !== 'undefined' } });
      client.auth.onAuthStateChange((_event: any, session: any)=>{ const mapped = mapSession(session); listeners.forEach(cb=>cb(mapped)); });
    }
    return client;
  }
  async init(): Promise<void> { this.getClient(); }
  async getSession(): Promise<Session | null> { const { data } = await this.getClient().auth.getSession(); return mapSession(data.session); }
  async getUser(): Promise<TameUser | null> { const sess = await this.getSession(); return sess?.user ?? null; }
  async getToken(): Promise<string | null> { const sess = await this.getSession(); return sess?.accessToken ?? null; }
  async signIn(params: SignInParams): Promise<Session> {
    const c = this.getClient();
    if (params.password) {
      const { data, error } = await c.auth.signInWithPassword({ email: params.email, password: params.password });
      if (error) throw error;
      const mapped = mapSession(data.session);
      if (!mapped) throw new Error('No session after signIn');
      return mapped;
    }
    if (params.otpCode) {
      const { data, error } = await c.auth.verifyOtp({ email: params.email, token: params.otpCode, type: 'email' });
      if (error) throw error;
      const mapped = mapSession(data.session);
      if (!mapped) throw new Error('No session after OTP verify');
      return mapped;
    }
    throw new Error('Provide password or otpCode');
  }
  async signInWithOtp(email: string): Promise<void> { const { error } = await this.getClient().auth.signInWithOtp({ email }); if (error) throw error; }
  async signInWithOAuth(provider: 'google' | 'apple'): Promise<void> { const { error } = await this.getClient().auth.signInWithOAuth({ provider, options: { redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined } }); if (error) throw error; }
  async signOut(): Promise<void> { const { error } = await this.getClient().auth.signOut(); if (error) throw error; }
  onAuthChange(cb: (session: Session | null)=>void): () => void { listeners.push(cb); return () => { listeners = listeners.filter(l=>l!==cb); }; }
}
