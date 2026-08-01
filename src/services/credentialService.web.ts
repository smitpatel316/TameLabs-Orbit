import { useState, useEffect } from 'react';
import type { QuietKeyPair } from '../services/credentialService';

type CredListener = () => void;
const listeners = new Set<CredListener>();
let storedKeyPair: QuietKeyPair | null = null;
let initialized = false;

function safeLoadWeb(): QuietKeyPair | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('quiet-cred-keypair-v1');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as QuietKeyPair;
    if (!parsed.publicKey || !parsed.privateKey) return null;
    return parsed;
  } catch {
    return null;
  }
}

function safeSaveWeb(kp: QuietKeyPair | null) {
  if (typeof window === 'undefined') return;
  try {
    if (!kp) localStorage.removeItem('quiet-cred-keypair-v1');
    else localStorage.setItem('quiet-cred-keypair-v1', JSON.stringify(kp));
  } catch {}
}

let state: { keyPair: QuietKeyPair | null; loading: boolean } = { keyPair: safeLoadWeb(), loading: !safeLoadWeb() };

function notify() {
  listeners.forEach(l => l());
}

function computeFingerprint(pk: string): string {
  return pk.slice(0, 8).toLowerCase();
}

export function useQuietCredential(selector?: any) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick(t => t + 1);
    listeners.add(fn);
    if (!initialized) {
      initialized = true;
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem('quiet-cred-keypair-v1') : null;
        if (raw) {
          state = { keyPair: JSON.parse(raw), loading: false };
        } else {
          state = { keyPair: null, loading: false };
        }
      } catch {
        state = { keyPair: null, loading: false };
      }
      notify();
    }
    return () => { listeners.delete(fn); };
  }, []);

  const api = {
    keyPair: state.keyPair,
    fingerprint: state.keyPair?.fingerprint || null,
    publicKey: state.keyPair?.publicKey || null,
    loading: state.loading,
    hasKeyPair: !!state.keyPair,

    getStoredKeyPair: (): QuietKeyPair | null => state.keyPair,

    getOrCreateKeyPair: async (): Promise<QuietKeyPair> => {
      if (state.keyPair) return state.keyPair;
      try {
        const gen = await tryGenerateKeyPair();
        state = { keyPair: gen, loading: false };
        safeSaveWeb(gen);
        notify();
        return gen;
      } catch {
        const fallback = genFallbackKeyPair();
        state = { keyPair: fallback, loading: false };
        safeSaveWeb(fallback);
        notify();
        return fallback;
      }
    },

    rotateKeyPair: async (): Promise<QuietKeyPair> => {
      const gen = await tryGenerateKeyPair();
      state = { keyPair: gen, loading: false };
      safeSaveWeb(gen);
      notify();
      return gen;
    },

    clearKeyPair: () => {
      state = { keyPair: null, loading: false };
      safeSaveWeb(null);
      notify();
    },
  };

  if (typeof selector === 'function') return selector(api);
  return api;
}

async function tryGenerateKeyPair(): Promise<QuietKeyPair> {
  try {
    const mod = await import('../cloud/identity/sync/inviteService').then((m: any) => m).catch(() => null);
    let kp: { publicKey: string; privateKey: string } | null = null;
    if (mod?.generateKeyPair) kp = await mod.generateKeyPair();
    if (kp) {
      return {
        publicKey: kp.publicKey,
        privateKey: kp.privateKey,
        createdAt: new Date().toISOString(),
        fingerprint: computeFingerprint(kp.publicKey),
      };
    }
  } catch {}
  return genFallbackKeyPair();
}

function genFallbackKeyPair(): QuietKeyPair {
  const arr = new Uint8Array(32);
  for (let i = 0; i < 32; i++) arr[i] = Math.floor(Math.random() * 256);
  let b64 = '';
  try {
    if (typeof Buffer !== 'undefined') b64 = Buffer.from(arr).toString('base64');
    else {
      let s = '';
      for (let ii=0; ii<arr.length; ii++) s += String.fromCharCode(arr[ii]);
      b64 = btoa(s);
    }
  } catch { b64 = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2); }
  return {
    publicKey: b64,
    privateKey: b64,
    createdAt: new Date().toISOString(),
    fingerprint: computeFingerprint(b64),
  };
}
