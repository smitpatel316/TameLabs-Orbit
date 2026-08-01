import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;
let config = { url: '', anonKey: '' };

export function initSupabaseClient(c: { url: string; anonKey: string }): SupabaseClient {
  config = c;
  client = createClient(c.url, c.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: typeof window !== 'undefined' }
  });
  return client;
}

export function getSupabaseClient(): SupabaseClient | null {
  if (client) return client;
  // Try env fallback
  const getEnv = (k: string): string | undefined => {
    try { if ((process as any)?.env?.[k]) return (process as any).env[k]; } catch {}
    return undefined;
  };
  const url = getEnv('EXPO_PUBLIC_SUPABASE_URL') || getEnv('SUPABASE_URL');
  const key = getEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY');
  if (url && key) return initSupabaseClient({ url, anonKey: key });
  return null;
}

export function hasSupabaseConfig(): boolean {
  return !!getSupabaseClient();
}
