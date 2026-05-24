import type { StorageAdapter } from './storage.js';

const KEYS = {
  accessToken: 'lp_access_token',
  refreshToken: 'lp_refresh_token',
  userId: 'lp_user_id',
  email: 'lp_email',
} as const;

export interface SessionData {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
}

// `store` (not `storage`) on purpose: WXT's auto-import injects an import for
// any bare `storage` identifier, which corrupts this package when bundled into
// the extension.
export function createSession(store: StorageAdapter) {
  return {
    async save(data: SessionData) {
      await Promise.all([
        store.set(KEYS.accessToken, data.accessToken),
        store.set(KEYS.refreshToken, data.refreshToken),
        store.set(KEYS.userId, data.userId),
        store.set(KEYS.email, data.email),
      ]);
    },
    async updateTokens(accessToken: string, refreshToken: string) {
      await Promise.all([
        store.set(KEYS.accessToken, accessToken),
        store.set(KEYS.refreshToken, refreshToken),
      ]);
    },
    getAccessToken: () => store.get(KEYS.accessToken),
    getRefreshToken: () => store.get(KEYS.refreshToken),
    getEmail: () => store.get(KEYS.email),
    getUserId: () => store.get(KEYS.userId),
    async isLoggedIn() {
      return !!(await store.get(KEYS.accessToken));
    },
    async clear() {
      await Promise.all(Object.values(KEYS).map((k) => store.remove(k)));
    },
  };
}

export type Session = ReturnType<typeof createSession>;
