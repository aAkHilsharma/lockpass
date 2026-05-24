import { deriveUnlockKey } from '@lockpass/crypto';

// Runs Argon2id off the service worker thread. The SW posts { type: 'lp:kdf' }
// and gets back the derived key as a number[] (runtime messaging is JSON).
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== 'lp:kdf') return;
  try {
    const key = deriveUnlockKey(msg.password, new Uint8Array(msg.salt), msg.params);
    sendResponse({ ok: true, key: Array.from(key) });
  } catch (err) {
    sendResponse({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
});
