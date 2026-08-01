// Profile public_key sync for sealed-box invites
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
