
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { identity } from './identity';
import { TameUser, Session } from './types';

interface Ctx {
  user: TameUser | null;
  session: Session | null;
  loading: boolean;
  provider: string;
  signIn: (email: string, password?: string) => Promise<Session>;
  signInWithOtp: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const IdentityContext = createContext<Ctx | null>(null);

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<TameUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try { await identity.init(); const s = await identity.getSession(); setSession(s); setUser(s?.user ?? null); } finally { setLoading(false); }
  };

  useEffect(()=>{
    refresh();
    const off = identity.onAuthChange((s: any)=>{ setSession(s); setUser(s?.user ?? null); });
    return off;
  }, []);

  const signIn = async (email: string, password?: string) => {
    const s = await identity.signIn({ email, password });
    setSession(s); setUser(s.user); return s;
  };
  const signInWithOtp = async (email: string) => { await identity.signInWithOtp(email); };
  const signOut = async () => { await identity.signOut(); setSession(null); setUser(null); };

  return (
    <IdentityContext.Provider value={{ user, session, loading, provider: identity.providerName, signIn, signInWithOtp, signOut, refresh }}>
      {children}
    </IdentityContext.Provider>
  );
}

export function useIdentity(): Ctx {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error('useIdentity must be used within IdentityProvider from @tamelabs/identity');
  return ctx;
}
