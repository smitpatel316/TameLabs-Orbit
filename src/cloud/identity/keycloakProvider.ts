
import { IdentityProvider, Session, SignInParams, TameUser } from './types';

export interface KeycloakConfig {
  url: string;
  realm: string;
  clientId: string;
  redirectUri?: string;
}

export class KeycloakIdentityProvider implements IdentityProvider {
  name = 'keycloak' as const;
  private config: KeycloakConfig;
  private token: string | null = null;
  private currentUser: TameUser | null = null;
  private listeners: ((s: Session | null)=>void)[] = [];

  constructor(config: KeycloakConfig) { this.config = config; }

  get issuerUrl(): string { return `${this.config.url.replace(/\/$/, '')}/realms/${this.config.realm}`; }
  get discoveryUrl(): string { return `${this.issuerUrl}/.well-known/openid-configuration`; }

  async init(): Promise<void> {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('tamelabs-keycloak-session');
      if (raw) { try { const sess = JSON.parse(raw) as Session; this.token = sess.accessToken; this.currentUser = sess.user; } catch {} }
    }
  }

  async getSession(): Promise<Session | null> { if (!this.token || !this.currentUser) return null; return { accessToken: this.token, user: this.currentUser }; }
  async getUser(): Promise<TameUser | null> { return this.currentUser; }
  async getToken(): Promise<string | null> { return this.token; }

  async signIn(_params: SignInParams): Promise<Session> {
    throw new Error(`Keycloak not configured yet. Deploy quay.io/keycloak/keycloak:24 + postgres:15, set KEYCLOAK_URL=https://identity.smitpatel.net, realm=tame, clientId=${this.config.clientId}. Discovery ${this.discoveryUrl}`);
  }
  async signInWithOtp(_email: string): Promise<void> { throw new Error('Keycloak OTP not enabled'); }
  async signInWithOAuth(_provider: 'google' | 'apple'): Promise<void> { throw new Error('Keycloak IdP brokering not configured'); }
  async signOut(): Promise<void> { this.token = null; this.currentUser = null; if (typeof window !== 'undefined') localStorage.removeItem('tamelabs-keycloak-session'); this.listeners.forEach(cb=>cb(null)); }
  onAuthChange(cb: (session: Session | null)=>void): () => void { this.listeners.push(cb); return () => { this.listeners = this.listeners.filter(l=>l!==cb); }; }
}
