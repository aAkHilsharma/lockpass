import { randomBytes } from "@noble/hashes/utils";

export const KDF_SALT_BYTES = 32;
export const XCHACHA20_NONCE_BYTES = 24;
export const KEY_BYTES = 32;

export function generateRandom(bytes: number): Uint8Array {
  return randomBytes(bytes);
}

export function generateKdfSalt(): Uint8Array {
  return randomBytes(KDF_SALT_BYTES);
}

export function generateNonce(): Uint8Array {
  return randomBytes(XCHACHA20_NONCE_BYTES);
}

export function generateKey(): Uint8Array {
  return randomBytes(KEY_BYTES);
}
