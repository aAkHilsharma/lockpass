import type { StorageAdapter } from '@lockpass/api-client';

function adapter(area: chrome.storage.StorageArea): StorageAdapter {
  return {
    async get(key) {
      const r = await area.get(key);
      return (r[key] as string | undefined) ?? null;
    },
    async set(key, value) {
      await area.set({ [key]: value });
    },
    async remove(key) {
      await area.remove(key);
    },
  };
}

// Persistent: auth tokens. Survives browser restarts.
export const localStorageAdapter = adapter(chrome.storage.local);
// Ephemeral: unlock blob. In-memory, cleared when the browser fully closes —
// the MV3 analogue of the web's sessionStorage.
export const sessionStorageAdapter = adapter(chrome.storage.session);
