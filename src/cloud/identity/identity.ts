
import { IdentityProvider, Session, TameUser } from './types';
import { MockIdentityProvider } from './mockProvider';
import { SupabaseIdentityProvider } from './supabaseProvider';
import { KeycloakIdentityProvider } from './keycloakProvider';

type IdentityConfig = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  keycloakUrl?: string;
  keycloakRealm?: string;
  keycloakClientId?: string;
};

function resolveConfig(): IdentityConfig {
  const getEnv = (k: string): string | undefined => {
    try { if (typeof process !== 'undefined' && (process as any).env && (process as any).env[k]) return (process as any).env[k]; } catch {}
    if (typeof window !== 'undefined') {
      // @ts-ignore
      if ((window as any).__env && (window as any).__env[k]) return (window as any).__env[k];
    }
    return undefined;
  };
  return {
    supabaseUrl: getEnv('EXPO_PUBLIC_SUPABASE_URL') || getEnv('SUPABASE_URL'),
    supabaseAnonKey: getEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY'),
    keycloakUrl: getEnv('EXPO_PUBLIC_KEYCLOAK_URL') || getEnv('KEYCLOAK_URL'),
    keycloakRealm: getEnv('EXPO_PUBLIC_KEYCLOAK_REALM') || 'tame',
    keycloakClientId: getEnv('EXPO_PUBLIC_KEYCLOAK_CLIENT_ID') || 'tame',
  };
}

class IdentityManager implements IdentityProvider {
  name = 'manager' as const;
  private provider: IdentityProvider;
  private config: IdentityConfig;
  private _initialized = false;
  constructor() {
    this.config = resolveConfig();
    if (this.config.keycloakUrl) {
      this.provider = new KeycloakIdentityProvider({ url: this.config.keycloakUrl!, realm: this.config.keycloakRealm || 'tame', clientId: this.config.keycloakClientId || 'tame' });
    } else if (this.config.supabaseUrl && this.config.supabaseAnonKey) {
      this.provider = new SupabaseIdentityProvider({ url: this.config.supabaseUrl, anonKey: this.config.supabaseAnonKey });
    } else {
      this.provider = new MockIdentityProvider();
    }
  }
  get providerName(): string { return this.provider.name; }
  async init(): Promise<void> { if (this._initialized) return; await this.provider.init(); this._initialized = true; }
  getSession(): Promise<Session | null> { return this.provider.getSession(); }
  getUser(): Promise<TameUser | null> { return this.provider.getUser(); }
  getToken(): Promise<string | null> { return this.provider.getToken(); }
  signIn(params: any) { return this.provider.signIn(params); }
  signInWithOtp(email: string) { return this.provider.signInWithOtp(email); }
  signInWithOAuth(p: 'google'|'apple') { return this.provider.signInWithOAuth(p); }
  signOut() { return this.provider.signOut(); }
  onAuthChange(cb: any) { return this.provider.onAuthChange(cb); }
  useProvider(p: IdentityProvider) { this.provider = p; this._initialized = false; }
}

export const identity = new IdentityManager();
export type { TameUser, Session };
export { MockIdentityProvider, SupabaseIdentityProvider, KeycloakIdentityProvider };
