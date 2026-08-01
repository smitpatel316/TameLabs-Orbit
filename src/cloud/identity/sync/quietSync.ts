// Quiet posts + circles cloud sync (optional backup, local-first)
import { getSupabaseClient } from './client';
import type { CloudCircle, CloudCircleMember, CloudPost, CreateCircleParams, SyncResult } from './types';

export async function fetchMyCircles(): Promise<SyncResult<CloudCircle[]>> {
  const client = getSupabaseClient();
  if (!client) return { data: [], error: undefined };
  // Use view my_circles if exists else raw
  const { data, error } = await (client.from('my_circles') as any).select('*').order('created_at',{ascending:false}).then((r:any)=>r)
    .catch(async () => {
      const c = getSupabaseClient()!;
      return await c.from('circles').select('*').order('created_at',{ascending:false});
    });
  if (error) return { data: null, error: error.message };
  return { data: data as CloudCircle[] };
}

export async function createCloudCircle(params: CreateCircleParams): Promise<SyncResult<CloudCircle>> {
  const client = getSupabaseClient();
  if (!client) {
    const mock: CloudCircle = { id: 'mock_c_'+Math.random().toString(36).slice(2,6), owner_id: 'mock_owner', name: params.name, description: params.description||'', invite_code: 'quiet-'+Math.random().toString(36).slice(2,6), is_public: params.is_public||false, color: params.color||null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any;
    return { data: mock };
  }
  const user = (await client.auth.getUser()).data.user;
  if (!user) return { data: null, error: 'Not authenticated' };
  const { data, error } = await client.from('circles').insert({ owner_id: user.id, name: params.name, description: params.description||'', is_public: params.is_public||false, color: params.color||null }).select().single();
  if (error) return { data: null, error: error.message };
  return { data: data as CloudCircle };
}

export async function deleteCloudCircle(circleId: string): Promise<SyncResult<boolean>> {
  const client = getSupabaseClient();
  if (!client) return { data: true };
  const { error } = await client.from('circles').delete().eq('id', circleId);
  if (error) return { data: null, error: error.message };
  return { data: true };
}

export async function listMembers(circleId: string): Promise<SyncResult<CloudCircleMember[]>> {
  const client = getSupabaseClient();
  if (!client) return { data: [], error: undefined };
  const { data, error } = await client.from('circle_members').select('*').eq('circle_id', circleId).order('added_at',{ascending:true});
  if (error) return { data: null, error: error.message };
  return { data: data as CloudCircleMember[] };
}

export async function pushPosts(posts: { id: string; content: string; circle_id?: string|null; author_display?: string; tags?: string[] }[]): Promise<SyncResult<number>> {
  const client = getSupabaseClient();
  if (!client) return { data: 0 };
  const user = (await client.auth.getUser()).data.user;
  if (!user) return { data: null, error: 'Not authenticated' };
  const rows = posts.map(p=>({ id: p.id, owner_id: user.id, circle_id: p.circle_id||null, content: p.content.slice(0,2000), author_display: p.author_display||'', tags: p.tags||[] }));
  if (!rows.length) return { data: 0 };
  const { error } = await client.from('quiet_posts').upsert(rows as any, { onConflict: 'id' } as any);
  if (error) return { data: null, error: error.message };
  return { data: rows.length };
}

export async function pullPosts(limit=100): Promise<SyncResult<CloudPost[]>> {
  const client = getSupabaseClient();
  if (!client) return { data: [], error: undefined };
  const { data, error } = await client.from('quiet_posts').select('*').order('created_at',{ascending:false}).limit(limit);
  if (error) return { data: null, error: error.message };
  return { data: data as CloudPost[] };
}
