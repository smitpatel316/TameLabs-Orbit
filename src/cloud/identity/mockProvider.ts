
import { IdentityProvider, Session, SignInParams, TameUser } from './types';

const STORAGE_KEY = 'tamelabs-identity-mock-v1';

function safeLoad(): Session | null {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as Session;
    } catch {}
    return null;
  }
  return null;
}

function safeSave(sess: Session | null) {
  if (typeof window === 'undefined') return;
  try {
    if (sess) localStorage.setItem(STORAGE_KEY, JSON.stringify(sess));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

let memory: Session | null = null;
let initialized = false;
let listeners: ((s: Session | null)=>void)[] = [];

async function loadAsync(): Promise<Session|null> {
  try {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Session;
  } catch {}
  return safeLoad();
}

async function saveAsync(sess: Session | null) {
  memory = sess;
  safeSave(sess);
  try {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    if (sess) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sess));
    else await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {}
  listeners.forEach(cb=>cb(sess));
}

function hashEmail(email: string): string {
  let h = 0;
  for (let i=0;i<email.length;i++) h = (h*31 + email.charCodeAt(i)) & 0xffffffff;
  return Math.abs(h).toString(36);
}

export class MockIdentityProvider implements IdentityProvider {
  name = 'mock' as const;
  async init(): Promise<void> {
    if (initialized) return;
    memory = await loadAsync();
    if (!memory) memory = safeLoad();
    initialized = true;
  }
  async getSession(): Promise<Session | null> { if (!initialized) await this.init(); return memory; }
  async getUser(): Promise<TameUser | null> { const s = await this.getSession(); return s?.user ?? null; }
  async getToken(): Promise<string | null> { const s = await this.getSession(); return s?.accessToken ?? null; }
  async signIn(params: SignInParams): Promise<Session> {
    if (!initialized) await this.init();
    const email = params.email.trim().toLowerCase();
    const id = 'mock_' + hashEmail(email);
    const session: Session = {
      accessToken: 'mock_token_' + Date.now(),
      refreshToken: 'mock_refresh_' + Date.now(),
      expiresAt: Date.now() + 3600*1000,
      user: { id, email, displayName: email.split('@')[0], provider: 'mock' }
    };
    await saveAsync(session);
    return session;
  }
  async signInWithOtp(email: string): Promise<void> { await this.signIn({ email }); }
  async signInWithOAuth(provider: 'google' | 'apple'): Promise<void> { await this.signIn({ email: `user+${provider}@example.com` }); }
  async signOut(): Promise<void> { await saveAsync(null); }
  onAuthChange(cb: (session: Session | null)=>void): () => void { listeners.push(cb); return () => { listeners = listeners.filter(l=>l!==cb); }; }
}
