import type { KdfParams } from '@lockpass/crypto';

// Argon2 is CPU-heavy and synchronous. Running it in the background service
// worker would block message handling, so we run it in an offscreen document
// (the MV3 way to get a DOM/worker-capable context off the SW thread).
const OFFSCREEN_URL = 'offscreen.html';
let creating: Promise<void> | null = null;

async function ensureOffscreen(): Promise<void> {
  if (await chrome.offscreen.hasDocument()) return;
  if (!creating) {
    creating = chrome.offscreen
      .createDocument({
        url: OFFSCREEN_URL,
        reasons: [chrome.offscreen.Reason.WORKERS],
        justification: 'Run Argon2 key derivation off the service worker thread.',
      })
      .finally(() => { creating = null; });
  }
  await creating;
}

interface KdfResponse {
  ok: boolean;
  key?: number[];
  error?: string;
}

export async function deriveKeyViaOffscreen(
  password: string,
  salt: Uint8Array,
  params: KdfParams,
): Promise<Uint8Array> {
  await ensureOffscreen();
  // runtime messaging serializes as JSON, so the salt crosses as a number[].
  const res = (await chrome.runtime.sendMessage({
    type: 'lp:kdf',
    password,
    salt: Array.from(salt),
    params,
  })) as KdfResponse | undefined;
  if (!res?.ok || !res.key) throw new Error(res?.error ?? 'KDF failed');
  return new Uint8Array(res.key);
}
