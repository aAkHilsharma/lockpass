export { createClient, type ClientConfig, type LockpassClient } from './client.js';
export { createSession, type Session, type SessionData } from './session.js';
export { createApi, ApiError, type Api, type ItemsListResponse } from './api.js';
export { createUnlock, type Unlock } from './unlock.js';
export {
  createCrypto, type Crypto,
  generateRecoveryKey, unlockVaultKey,
  encryptItem, decryptItem, decryptVaultMetadata, encryptVaultMetadata,
  createVaultCrypto, type VaultMetadata,
} from './crypto.js';
export type { StorageAdapter } from './storage.js';
export type { KeysetData, DeriveKeyFn } from './types.js';
