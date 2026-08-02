// Profile public_key sync for sealed-box invites + identity bridge Orbit<->Quiet
// Upserts current user profile.public_key when credential keypair generated/rotated
// Safe when Supabase not configured - noop.

import { getSupabaseClient } from './client';

export async function upsertPublicKey(publicKey: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const client = getSupabaseClient();
    if (!client) return { ok: true }; // local/mock mode, stored locally only
    const auth = await (client as any).auth.getUser().catch(() => ({ data: { user: null } }));
    const user = auth?.data?.user;
    if (!user) return { ok: true }; // not authed yet, local only
    const { error } = await client
      .from('profiles')
      .upsert({ id: user.id, public_key: publicKey, updated_at: new Date().toISOString() as any }, { onConflict: 'id' } as any);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}

export async function fetchProfilePublicKey(userId: string): Promise<string | null> {
  try {
    const client = getSupabaseClient();
    if (!client) return null;
    const { data, error } = await client.from('profiles').select('public_key').eq('id', userId).single();
    if (error || !data) return null;
    return (data as any).public_key || null;
  } catch {
    return null;
  }
}

export async function fetchProfilePublicKeyByDisplayName(displayName: string): Promise<string | null> {
  try {
    const trimmed = String(displayName || '').trim();
    if (!trimmed || trimmed.length < 1) return null;
    const client = getSupabaseClient();
    if (!client) return null;
    const { data: exact, error: e1 } = await client.from('profiles').select('public_key').eq('display_name', trimmed).limit(1).maybeSingle();
    if (!e1 && exact && (exact as any).public_key) return (exact as any).public_key as string;
    const { data, error } = await client.from('profiles').select('public_key').ilike('display_name', trimmed).limit(1).maybeSingle();
    if (error || !data) return null;
    return (data as any).public_key || null;
  } catch {
    return null;
  }
}

export async function searchProfilesByName(query: string): Promise<{ id: string; display_name: string; public_key: string | null }[]> {
  try {
    const trimmed = String(query || '').trim();
    if (!trimmed || trimmed.length < 1) return [];
    const client = getSupabaseClient();
    if (!client) return [];
    const { data, error } = await client.from('profiles').select('id, display_name, public_key').ilike('display_name', `%${trimmed}%`).limit(10);
    if (error || !data) return [];
    return (data as any[]).map((r: any) => ({ id: String(r.id), display_name: String(r.display_name || ''), public_key: r.public_key ? String(r.public_key) : null }));
  } catch {
    return [];
  }
}

export async function fetchProfileByDisplayName(displayName: string): Promise<{ id: string; display_name: string; public_key: string | null } | null> {
  try {
    const trimmed = String(displayName || '').trim();
    if (!trimmed) return null;
    const client = getSupabaseClient();
    if (!client) return null;
    const { data: exact, error: e1 } = await client.from('profiles').select('id, display_name, public_key').eq('display_name', trimmed).limit(1).maybeSingle();
    if (!e1 && exact && (exact as any).id) return { id: String((exact as any).id), display_name: String((exact as any).display_name || ''), public_key: (exact as any).public_key || null } as any;
    const { data, error } = await client.from('profiles').select('id, display_name, public_key').ilike('display_name', trimmed).limit(1).maybeSingle();
    if (error || !data) return null;
    return { id: String((data as any).id), display_name: String((data as any).display_name || ''), public_key: (data as any).public_key || null } as any;
  } catch {
    return null;
  }
}
