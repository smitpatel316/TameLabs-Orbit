import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

const KEYPAIR_STORAGE_KEY = 'quiet-cred-keypair-v1';

export interface QuietKeyPair {
  publicKey: string;
  privateKey: string;
  createdAt: string;
  fingerprint: string; // first 8 chars of publicKey
}

function computeFingerprint(pk: string): string {
  return pk.slice(0, 8).toLowerCase();
}

async function persistKeyPair(kp: { publicKey: string; privateKey: string }): Promise<QuietKeyPair> {
  const full: QuietKeyPair = {
    publicKey: kp.publicKey,
    privateKey: kp.privateKey,
    createdAt: new Date().toISOString(),
    fingerprint: computeFingerprint(kp.publicKey),
  };
  try {
    await AsyncStorage.setItem(KEYPAIR_STORAGE_KEY, JSON.stringify(full));
    logger.info('credential', 'keypair persisted', { fp: full.fingerprint });
  } catch (e: any) {
    logger.logError(e, { screen: 'credential', op: 'persist' });
  }
  return full;
}

export async function getStoredKeyPair(): Promise<QuietKeyPair | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYPAIR_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as QuietKeyPair;
    if (!parsed.publicKey || !parsed.privateKey) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getOrCreateKeyPair(): Promise<QuietKeyPair> {
  const existing = await getStoredKeyPair();
  if (existing) return existing;
  try {
    const mod = await import('../cloud/identity/sync/inviteService').then((m: any) => m).catch(() => null);
    let kp: { publicKey: string; privateKey: string } | null = null;
    if (mod?.generateKeyPair) {
      kp = await mod.generateKeyPair();
    }
    if (!kp) {
      const arr = new Uint8Array(32);
      if (typeof globalThis.crypto !== 'undefined' && (globalThis.crypto as any).getRandomValues) {
        (globalThis.crypto as any).getRandomValues(arr);
      } else {
        for (let i = 0; i < 32; i++) arr[i] = Math.floor(Math.random() * 256);
      }
      const b64 = typeof Buffer !== 'undefined' ? Buffer.from(arr).toString('base64') : (() => { let s = ''; for (let ii=0; ii<arr.length; ii++) s += String.fromCharCode(arr[ii]); return btoa(s); })();
      kp = { publicKey: b64, privateKey: b64 };
    }
    return await persistKeyPair(kp);
  } catch (e: any) {
    logger.logError(e, { screen: 'credential', op: 'getOrCreate' });
    const arr = new Uint8Array(32);
    for (let i = 0; i < 32; i++) arr[i] = Math.floor(Math.random() * 256);
    const b64 = typeof Buffer !== 'undefined' ? Buffer.from(arr).toString('base64') : (() => { let s = ''; for (let ii=0; ii<arr.length; ii++) s += String.fromCharCode(arr[ii]); return btoa(s); })();
    return await persistKeyPair({ publicKey: b64, privateKey: b64 });
  }
}

export async function rotateKeyPair(): Promise<QuietKeyPair> {
  try {
    const mod = await import('../cloud/identity/sync/inviteService').then((m: any) => m).catch(() => null);
    let kp: { publicKey: string; privateKey: string } | null = null;
    if (mod?.generateKeyPair) kp = await mod.generateKeyPair();
    if (!kp) {
      const arr = new Uint8Array(32);
      for (let i = 0; i < 32; i++) arr[i] = Math.floor(Math.random() * 256);
      const b64 = typeof Buffer !== 'undefined' ? Buffer.from(arr).toString('base64') : (() => { let s = ''; for (let ii=0; ii<arr.length; ii++) s += String.fromCharCode(arr[ii]); return btoa(s); })();
      kp = { publicKey: b64, privateKey: b64 };
    }
    return await persistKeyPair(kp);
  } catch (e: any) {
    logger.logError(e, { screen: 'credential', op: 'rotate' });
    throw e;
  }
}

export async function clearKeyPair(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEYPAIR_STORAGE_KEY);
  } catch {}
}

export async function encryptForRecipient(payload: any, recipientPublicKey: string): Promise<string> {
  try {
    const mod = await import('../cloud/identity/sync/inviteService').then((m: any) => m).catch(() => null);
    if (mod?.encryptInvitePayload) {
      const res = await mod.encryptInvitePayload(payload, recipientPublicKey);
      return res.blob;
    }
  } catch {}
  const json = JSON.stringify(payload);
  return typeof Buffer !== 'undefined' ? Buffer.from(json).toString('base64') : btoa(json);
}

export async function decryptWithKeyPair(blob: string, keyPair?: QuietKeyPair): Promise<any | null> {
  try {
    const kp = keyPair || (await getStoredKeyPair());
    if (!kp) return null;
    const mod = await import('../cloud/identity/sync/inviteService').then((m: any) => m).catch(() => null);
    if (mod?.decryptInvitePayload) {
      return await mod.decryptInvitePayload(blob, { publicKey: kp.publicKey, privateKey: kp.privateKey });
    }
  } catch {}
  try {
    const jsonStr = typeof Buffer !== 'undefined' ? Buffer.from(blob, 'base64').toString() : atob(blob);
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}
