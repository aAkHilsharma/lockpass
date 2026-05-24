import { generateKey, encrypt, decrypt, toBase64url, fromBase64url } from '@lockpass/crypto';
import { api } from './api';
import { session } from './session';

// sessionStorage so the unlock survives a page reload but clears when the tab/
// window closes. We persist only the ciphertext of userRootKey; the key that
// decrypts it (ClientKey) is held server-side and fetched per app-load. Neither
// half is usable alone, so a stolen storage snapshot — or the server itself —
// cannot recover the vault key.
const SS_KEY = 'lp_unlock';

interface StoredBlob {
  unlockKeyId: string;
  ct: string;
  nonce: string;
}

function read(): StoredBlob | null {
  if (typeof sessionStorage === 'undefined') return null;
  const raw = sessionStorage.getItem(SS_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredBlob;
    if (parsed.unlockKeyId && parsed.ct && parsed.nonce) return parsed;
  } catch {}
  return null;
}

export async function createUnlockSession(userRootKey: Uint8Array): Promise<void> {
  const token = session.getAccessToken();
  if (!token || typeof sessionStorage === 'undefined') return;
  const clientKey = generateKey();
  const sealed = encrypt(userRootKey, clientKey);
  const { unlockKeyId } = await api.unlock.store(toBase64url(clientKey), token);
  sessionStorage.setItem(SS_KEY, JSON.stringify({
    unlockKeyId,
    ct: toBase64url(sealed.ciphertext),
    nonce: toBase64url(sealed.nonce),
  } satisfies StoredBlob));
}

export async function restoreUnlockSession(): Promise<Uint8Array | null> {
  const blob = read();
  const token = session.getAccessToken();
  if (!blob || !token) return null;
  try {
    const { clientKey } = await api.unlock.get(blob.unlockKeyId, token);
    return decrypt(fromBase64url(blob.ct), fromBase64url(blob.nonce), fromBase64url(clientKey));
  } catch {
    clearUnlockSession();
    return null;
  }
}

export function clearUnlockSession(): void {
  const blob = read();
  if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(SS_KEY);
  if (blob) {
    const token = session.getAccessToken();
    if (token) api.unlock.remove(blob.unlockKeyId, token).catch(() => {});
  }
}
