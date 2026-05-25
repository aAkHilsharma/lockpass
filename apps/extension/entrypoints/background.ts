import { defineBackground } from 'wxt/utils/define-background';
import * as vault from '../src/vault';
import type { BgRequest, BgResponse } from '../src/messages';

export default defineBackground(() => {
  // Open onboarding automatically on install (Welcome → Connect/Create).
  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
      chrome.tabs.create({ url: chrome.runtime.getURL('/welcome.html') });
    }
  });

  chrome.runtime.onMessage.addListener((msg: { type?: string }, _sender, sendResponse) => {
    // 'lp:kdf' is handled by the offscreen document, not here.
    if (!msg || typeof msg.type !== 'string' || msg.type === 'lp:kdf') return;
    handle(msg as BgRequest)
      .then(sendResponse)
      .catch((e: unknown) => sendResponse({ ok: false, error: e instanceof Error ? e.message : String(e) }));
    return true; // async sendResponse
  });
});

async function handle(msg: BgRequest): Promise<BgResponse> {
  switch (msg.type) {
    case 'status':
      return { ok: true, status: await vault.getStatus() };
    case 'signup':
      return { ok: true, ...(await vault.signup(msg.email, msg.password)) };
    case 'login':
      await vault.login(msg.email, msg.password);
      return { ok: true };
    case 'unlock':
      await vault.unlock(msg.password);
      return { ok: true };
    case 'lock':
      await vault.lock();
      return { ok: true };
    case 'logout':
      await vault.logout();
      return { ok: true };
    case 'getItems':
      return { ok: true, items: await vault.getItems() };
    case 'getMatches':
      return { ok: true, matches: await vault.getMatches(msg.url) };
    case 'fillCredential':
      return { ok: true, credential: await vault.fillCredential(msg.id) };
    default:
      return { ok: false, error: 'Unknown request' };
  }
}
