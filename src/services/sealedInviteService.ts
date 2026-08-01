import { getSupabaseClient } from '../cloud/identity/sync/client';
import type { QuietKeyPair } from './credentialService';

export interface LocalInvite {
  id: string;
  circleId: string;
  circleName: string;
  code: string;
  encryptedBlob: string | null;
  maxUses: number;
  uses: number;
  expiresAt: string;
  createdAt: string;
  inviterName?: string;
}

const LOCAL_INVITES_KEY = 'quiet-local-invites-v1';

function safeLoadLocal(): LocalInvite[] {
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_INVITES_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch {}
  return [];
}

function safeSaveLocal(invites: LocalInvite[]) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_INVITES_KEY, JSON.stringify(invites));
    }
  } catch {}
}

export async function createSealedInvite(params: {
  circleId: string;
  circleName: string;
  inviterName?: string;
  recipientPublicKey?: string;
  maxUses?: number;
  expiresInHours?: number;
}): Promise<{ data: LocalInvite | null; error?: string }> {
  const code = 'quiet-' + Math.random().toString(36).slice(2, 8);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + (params.expiresInHours ?? 24 * 7) * 3600 * 1000).toISOString();

  let encryptedBlob: string | null = null;
  try {
    const mod = await import('./credentialService').then((m: any) => m).catch(() => null);
    if (mod?.encryptForRecipient) {
      const payload = {
        circleId: params.circleId,
        circleName: params.circleName,
        inviterName: params.inviterName || 'Someone',
        code,
        createdAt: now.toISOString(),
      };
      if (params.recipientPublicKey) {
        encryptedBlob = await mod.encryptForRecipient(payload, params.recipientPublicKey);
      } else {
        const json = JSON.stringify(payload);
        encryptedBlob = typeof Buffer !== 'undefined' ? Buffer.from(json).toString('base64') : btoa(json);
      }
    } else {
      const json = JSON.stringify({ circleId: params.circleId, circleName: params.circleName, code });
      encryptedBlob = typeof Buffer !== 'undefined' ? Buffer.from(json).toString('base64') : btoa(json);
    }
  } catch {
    const json = JSON.stringify({ circleId: params.circleId, circleName: params.circleName, code });
    try { encryptedBlob = typeof Buffer !== 'undefined' ? Buffer.from(json).toString('base64') : btoa(json); } catch { encryptedBlob = null; }
  }

  const invite: LocalInvite = {
    id: 'local_' + Math.random().toString(36).slice(2, 8),
    circleId: params.circleId,
    circleName: params.circleName,
    code,
    encryptedBlob,
    maxUses: params.maxUses ?? 5,
    uses: 0,
    expiresAt,
    createdAt: now.toISOString(),
    inviterName: params.inviterName,
  };

  const existing = safeLoadLocal();
  existing.unshift(invite);
  safeSaveLocal(existing.slice(0, 80));

  try {
    const client = getSupabaseClient();
    if (client) {
      const cloudPayload = {
        circle_id: params.circleId,
        max_uses: params.maxUses ?? 5,
        expires_at: expiresAt,
        encrypted_blob: encryptedBlob,
        recipient_public_key: params.recipientPublicKey || null,
      };
      const { data, error } = await client.from('circle_invites').insert(cloudPayload).select().single() as any;
      if (!error && data) {
        invite.id = (data as any).id || invite.id;
        invite.code = (data as any).code || invite.code;
      }
    }
  } catch {}

  return { data: invite };
}

export function listLocalInvites(circleId?: string): LocalInvite[] {
  const all = safeLoadLocal();
  if (circleId) return all.filter(i => i.circleId === circleId);
  return all;
}

export function getLocalInviteByCode(code: string): LocalInvite | null {
  const all = safeLoadLocal();
  return all.find(i => i.code === code) || null;
}

export async function acceptLocalInvite(code: string): Promise<{ circleId: string; circleName: string; decrypted: any | null } | null> {
  const invite = getLocalInviteByCode(code);
  if (!invite) return null;
  if (new Date(invite.expiresAt).getTime() < Date.now()) return null;
  if (invite.uses >= invite.maxUses) return null;

  let decrypted: any = null;
  try {
    if (invite.encryptedBlob) {
      const mod = await import('./credentialService').then((m: any) => m).catch(() => null);
      if (mod?.decryptWithKeyPair) {
        decrypted = await mod.decryptWithKeyPair(invite.encryptedBlob);
      } else {
        const jsonStr = typeof Buffer !== 'undefined' ? Buffer.from(invite.encryptedBlob, 'base64').toString() : atob(invite.encryptedBlob);
        decrypted = JSON.parse(jsonStr);
      }
    }
  } catch {}

  try {
    const all = safeLoadLocal();
    const idx = all.findIndex(i => i.code === code);
    if (idx >= 0) {
      all[idx] = { ...all[idx], uses: all[idx].uses + 1 } as LocalInvite;
      safeSaveLocal(all);
    }
  } catch {}

  return { circleId: invite.circleId, circleName: invite.circleName, decrypted };
}

export async function acceptInviteUnified(code: string): Promise<{ data: { circleId: string; circleName?: string; decrypted?: any } | null; error?: string }> {
  try {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await (client as any).rpc('accept_circle_invite', { invite_code: code });
      if (!error && data) {
        let decrypted = null;
        try {
          const local = getLocalInviteByCode(code);
          if (local?.encryptedBlob) {
            const mod = await import('./credentialService').then((m: any) => m).catch(() => null);
            if (mod?.decryptWithKeyPair) decrypted = await mod.decryptWithKeyPair(local.encryptedBlob);
          }
        } catch {}
        return { data: { circleId: data as string, decrypted } };
      }
    }
  } catch {}

  const local = await acceptLocalInvite(code);
  if (local) {
    return { data: { circleId: local.circleId, circleName: local.circleName, decrypted: local.decrypted } };
  }
  return { data: null, error: 'Invite not found, expired, or exhausted' };
}

export function removeLocalInvite(code: string): void {
  const all = safeLoadLocal();
  safeSaveLocal(all.filter(i => i.code !== code));
}

export function clearExpiredLocalInvites(): number {
  const all = safeLoadLocal();
  const now = Date.now();
  const valid = all.filter(i => new Date(i.expiresAt).getTime() > now && i.uses < i.maxUses);
  const removed = all.length - valid.length;
  if (removed > 0) safeSaveLocal(valid);
  return removed;
}
