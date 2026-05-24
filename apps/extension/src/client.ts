import { createClient } from '@lockpass/api-client';
import { localStorageAdapter, sessionStorageAdapter } from './storage';
import { deriveKeyViaOffscreen } from './kdf';

const API_BASE = 'http://localhost:3001';

// Single client instance for the background service worker — the one context
// that holds keys and talks to the API. Popup/content scripts message the SW.
export const client = createClient({
  baseUrl: API_BASE,
  storage: localStorageAdapter,
  sessionStore: sessionStorageAdapter,
  deriveKey: deriveKeyViaOffscreen,
});
