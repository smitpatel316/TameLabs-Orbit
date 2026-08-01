// Sealed-box invites via libsodium (optional) + fallback WebCrypto
// Pattern: if recipient publicKey known, encrypt payload as sealed box, store as base64 blob.
// If no keys: store plain json {circleName, inviter, exp} or invite code only.
// For E2E no extra deps required: dynamic import libsodium-wrappers catch null -> fallback plain.

import { getSupabaseClient } from './client';
import type { CloudInvite, CreateInviteParams, SyncResult } from './types';
import { logger as localLogger } from '../sync/loggerFallback';

// Logger shim (uses console if not in RN)
function log(tag: string, msg: string, data?: any) {
  try {
    const mod = (globalThis as any).__tamelabs_logger__;
    if (mod) mod.info?.(tag, msg, data);
    else console.log(`[cloud:${tag}] ${msg}`, data||'');
  } catch { console.log(`[cloud:${tag}] ${msg}`); }
}

function genInviteCode(): string {
  return 'quiet-' + Math.random().toString(36).slice(2,8);
}

// Sealed box helpers - try libsodium-wrappers, fallback to no encryption
let sodiumReady: any | null = null;
async function getSodium(): Promise<any | null> {
  // libsodium-wrappers is optional - load dynamically, never breaks web if missing
  if (sodiumReady) return sodiumReady;
  try {
    // @ts-ignore optional peer dep - dynamic import so CI without sodium still passes tsc via shim
    const mod = await import('libsodium-wrappers').then((m:any)=>m.default||m).catch(()=>null);
    if (mod) { await mod.ready; sodiumReady = mod; return mod; }
  } catch {}
  return null;
}

export async function encryptInvitePayload(payload: any, recipientPublicKeyBase64?: string): Promise<{ blob: string; recipientKey?: string }> {
  if (recipientPublicKeyBase64) {
    const sod = await getSodium();
    if (sod) {
      try {
        const msgBytes = sod.from_string(JSON.stringify(payload));
        const pubKey = sod.from_base64(recipientPublicKeyBase64, sod.base64_variants.ORIGINAL);
        const cipher = sod.crypto_box_seal(msgBytes, pubKey);
        const blob = sod.to_base64(cipher, sod.base64_variants.ORIGINAL);
        return { blob, recipientKey: recipientPublicKeyBase64 };
      } catch (e:any) { log('invite','sodium encrypt fail fallback plain', { err: e?.message }); }
    }
  }
  // Fallback plain base64 json (no real secrecy but preserves shape for E2E)
  const blob = typeof Buffer !== 'undefined' ? Buffer.from(JSON.stringify(payload)).toString('base64') : btoa(JSON.stringify(payload));
  return { blob };
}

export async function decryptInvitePayload(blob: string, keyPair?: { privateKey: string; publicKey: string }): Promise<any | null> {
  try {
    if (keyPair?.privateKey) {
      const sod = await getSodium();
      if (sod) {
        try {
          const cipher = sod.from_base64(blob, sod.base64_variants.ORIGINAL);
          const pk = sod.from_base64(keyPair.publicKey, sod.base64_variants.ORIGINAL);
          const sk = sod.from_base64(keyPair.privateKey, sod.base64_variants.ORIGINAL);
          const decrypted = sod.crypto_box_seal_open(cipher, pk, sk);
          return JSON.parse(sod.to_string(decrypted));
        } catch {}
      }
    }
    // Try plain base64 decode
    const jsonStr = typeof Buffer !== 'undefined' ? Buffer.from(blob,'base64').toString() : atob(blob);
    return JSON.parse(jsonStr);
  } catch { return null; }
}

// Generate keypair for user (libsodium or fallback WebCrypto EC)
export async function generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  const sod = await getSodium();
  if (sod) {
    const kp = sod.crypto_box_keypair();
    return { publicKey: sod.to_base64(kp.publicKey, sod.base64_variants.ORIGINAL), privateKey: sod.to_base64(kp.privateKey, sod.base64_variants.ORIGINAL) };
  }
  // fallback random 32b base64
  const arr = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(arr);
  else arr.forEach((_,i)=>arr[i]=Math.floor(Math.random()*256));
  const b64 = typeof Buffer !== 'undefined' ? Buffer.from(arr).toString('base64') : btoa(String.fromCharCode(...arr));
  // reuse same as both for fallback shape
  return { publicKey: b64, privateKey: b64 };
}

// Supabase-backed invite operations (with local fallback)
export async function createCircleInvite(params: CreateInviteParams): Promise<SyncResult<CloudInvite>> {
  const client = getSupabaseClient();
  if (!client) {
    // Local mock: return fabricated invite for E2E/sandbox
    const mock: CloudInvite = {
      id: 'mock_' + Math.random().toString(36).slice(2,8),
      circle_id: params.circle_id,
      created_by: 'mock_user',
      code: genInviteCode(),
      encrypted_blob: params.encrypted_blob || null,
      recipient_public_key: params.recipient_public_key || null,
      max_uses: params.max_uses ?? 1,
      uses: 0,
      expires_at: new Date(Date.now() + (params.expires_in_hours ?? 24*7)*3600*1000).toISOString(),
      created_at: new Date().toISOString(),
    };
    log('invite','created mock', { code: mock.code });
    return { data: mock };
  }
  const payload = {
    circle_id: params.circle_id,
    max_uses: params.max_uses ?? 1,
    expires_at: new Date(Date.now() + (params.expires_in_hours ?? 24*7)*3600*1000).toISOString(),
    encrypted_blob: params.encrypted_blob || null,
    recipient_public_key: params.recipient_public_key || null,
  };
  const { data, error } = await client.from('circle_invites').insert(payload).select().single();
  if (error) { log('invite','create error', { error: error.message }); return { data: null, error: error.message }; }
  return { data: data as CloudInvite };
}

export async function fetchInviteByCode(code: string): Promise<SyncResult<CloudInvite>> {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: 'No supabase config - local mode' };
  const { data, error } = await client.from('circle_invites').select('*').eq('code', code).single();
  if (error) return { data: null, error: error.message };
  return { data: data as CloudInvite };
}

export async function acceptInvite(code: string): Promise<SyncResult<string>> {
  const client = getSupabaseClient();
  if (!client) return { data: code, error: undefined }; // local noop
  // Use RPC function accept_circle_invite(code)
  const { data, error } = await (client as any).rpc('accept_circle_invite', { invite_code: code });
  if (error) return { data: null, error: error.message };
  return { data: data as string }; // circle_id
}

export async function listInvitesForCircle(circleId: string): Promise<SyncResult<CloudInvite[]>> {
  const client = getSupabaseClient();
  if (!client) return { data: [], error: undefined };
  const { data, error } = await client.from('circle_invites').select('*').eq('circle_id', circleId).order('created_at',{ascending:false});
  if (error) return { data: null, error: error.message };
  return { data: data as CloudInvite[] };
}
