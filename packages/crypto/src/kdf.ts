import { argon2id } from "@noble/hashes/argon2";
import { KEY_BYTES } from "./random.js";

export type KdfParams = {
  memoryKiB: number;
  iterations: number;
  parallelism: number;
};

export const DEFAULT_KDF_PARAMS: KdfParams = {
  memoryKiB: 65536,
  iterations: 3,
  parallelism: 4,
};

export function deriveUnlockKey(
  password: string,
  salt: Uint8Array,
  params: KdfParams = DEFAULT_KDF_PARAMS
): Uint8Array {
  return argon2id(password, salt, {
    m: params.memoryKiB,
    t: params.iterations,
    p: params.parallelism,
    dkLen: KEY_BYTES,
  });
}
