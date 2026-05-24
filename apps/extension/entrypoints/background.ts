import { defineBackground } from 'wxt/utils/define-background';
import { client } from '../src/client';

export default defineBackground(() => {
  // Open onboarding automatically on install (Welcome → Connect/Create).
  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
      chrome.tabs.create({ url: chrome.runtime.getURL('/welcome.html') });
    }
  });

  // Thin RPC for popup/content scripts. The SW owns keys + API; on wake it
  // lazily rehydrates the unlock from chrome.storage.session + the server key.
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'lp:status') {
      (async () => {
        const key = await client.unlock.restoreUnlockSession();
        sendResponse({ unlocked: !!key });
      })();
      return true; // async sendResponse
    }
    return false;
  });
});
