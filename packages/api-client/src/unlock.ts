import { generateKey, encrypt, decrypt, toBase64url, fromBase64url } from '@lockpass/crypto';
import type { Api } from './api.js';
import type { Session } from './session.js';
import type { StorageAdapter } from './storage.js';

// Split-secret unlock persistence: ciphertext of userRootKey lives in the
// ephemeral session store; the ClientKey that decrypts it is held server-side.
// Neither half is usable alone.
const SS_KEY = 'lp_unlock';

interface StoredBlob {
  unlockKeyId: string;
  ct: string;
  nonce: string;
}

export function createUnlock(api: Api, session: Session, sessionStore: StorageAdapter) {
  async function read(): Promise<StoredBlob | null> {
    const raw = await sessionStore.get(SS_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as StoredBlob;
      if (parsed.unlockKeyId && parsed.ct && parsed.nonce) return parsed;
    } catch {}
    return null;
  }

  async function createUnlockSession(userRootKey: Uint8Array): Promise<void> {
    if (!(await session.getAccessToken())) return;
    const clientKey = generateKey();
    const sealed = encrypt(userRootKey, clientKey);
    const { unlockKeyId } = await api.unlock.store(toBase64url(clientKey));
    await sessionStore.set(SS_KEY, JSON.stringify({
      unlockKeyId,
      ct: toBase64url(sealed.ciphertext),
      nonce: toBase64url(sealed.nonce),
    } satisfies StoredBlob));
  }

  async function restoreUnlockSession(): Promise<Uint8Array | null> {
    const blob = await read();
    if (!blob || !(await session.getAccessToken())) return null;
    try {
      const { clientKey } = await api.unlock.get(blob.unlockKeyId);
      return decrypt(fromBase64url(blob.ct), fromBase64url(blob.nonce), fromBase64url(clientKey));
    } catch {
      await clearUnlockSession();
      return null;
    }
  }

  async function clearUnlockSession(): Promise<void> {
    const blob = await read();
    await sessionStore.remove(SS_KEY);
    if (blob) {
      await api.unlock.remove(blob.unlockKeyId).catch(() => {});
    }
  }

  return { createUnlockSession, restoreUnlockSession, clearUnlockSession };
}

export type Unlock = ReturnType<typeof createUnlock>;
