import { hkdf } from "@noble/hashes/hkdf";
import { sha256 } from "@noble/hashes/sha256";
import { KEY_BYTES } from "./random.js";

export function deriveSubkey(
  rootKey: Uint8Array,
  info: string
): Uint8Array {
  return hkdf(sha256, rootKey, undefined, info, KEY_BYTES);
}

export function deriveItemKey(
  vaultKey: Uint8Array,
  itemId: string
): Uint8Array {
  return deriveSubkey(vaultKey, `lockpass:item:${itemId}`);
}
