import { encrypt, decrypt, type Sealed } from "./aead.js";

export function wrapKey(keyToWrap: Uint8Array, wrappingKey: Uint8Array): Sealed {
  return encrypt(keyToWrap, wrappingKey);
}

export function unwrapKey(
  ciphertext: Uint8Array,
  nonce: Uint8Array,
  wrappingKey: Uint8Array
): Uint8Array {
  return decrypt(ciphertext, nonce, wrappingKey);
}
