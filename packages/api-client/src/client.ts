import { createSession } from './session.js';
import { createApi } from './api.js';
import { createCrypto } from './crypto.js';
import { createUnlock } from './unlock.js';
import type { StorageAdapter } from './storage.js';
import type { DeriveKeyFn } from './types.js';

export interface ClientConfig {
  baseUrl: string;
  /** Persistent storage (tokens). web: localStorage / ext: chrome.storage.local */
  storage: StorageAdapter;
  /** Ephemeral storage (unlock blob). web: sessionStorage / ext: chrome.storage.session */
  sessionStore: StorageAdapter;
  deriveKey: DeriveKeyFn;
}

export function createClient(cfg: ClientConfig) {
  const session = createSession(cfg.storage);
  const api = createApi(cfg.baseUrl, session);
  const crypto = createCrypto(cfg.deriveKey);
  const unlock = createUnlock(api, session, cfg.sessionStore);
  return { session, api, crypto, unlock };
}

export type LockpassClient = ReturnType<typeof createClient>;
