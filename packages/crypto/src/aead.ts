import { xchacha20poly1305 } from "@noble/ciphers/chacha";
import { generateNonce } from "./random.js";

export type Sealed = {
  ciphertext: Uint8Array;
  nonce: Uint8Array;
};

export function encrypt(plaintext: Uint8Array, key: Uint8Array): Sealed {
  const nonce = generateNonce();
  const cipher = xchacha20poly1305(key, nonce);
  const ciphertext = cipher.encrypt(plaintext);
  return { ciphertext, nonce };
}

export function decrypt(
  ciphertext: Uint8Array,
  nonce: Uint8Array,
  key: Uint8Array
): Uint8Array {
  const cipher = xchacha20poly1305(key, nonce);
  return cipher.decrypt(ciphertext);
}
