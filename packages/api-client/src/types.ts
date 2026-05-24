import type { KdfParams } from '@lockpass/crypto';

export interface KeysetData {
  version: number;
  kdfAlgorithm: string;
  kdfParams: KdfParams;
  kdfSalt: string;
  wrappedUserRootKey: string;
  wrappedUserRootKeyNonce: string;
  wrappedUserRootKeyRecovery?: string;
  wrappedUserRootKeyRecoveryNonce?: string;
}

// Argon2id derivation, injected per-platform so the heavy KDF can run wherever
// that platform keeps it off the UI thread (web: Web Worker, extension:
// offscreen document).
export type DeriveKeyFn = (
  password: string,
  salt: Uint8Array,
  params: KdfParams,
) => Promise<Uint8Array>;
