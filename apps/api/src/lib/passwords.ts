import { argon2id } from "@noble/hashes/argon2";
import { randomBytes } from "@noble/hashes/utils";
import { toBase64url, fromBase64url } from "./encoding.js";

const PARAMS = { m: 19456, t: 2, p: 1 };
const SALT_BYTES = 16;
const KEY_BYTES = 32;

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_BYTES);
  const hash = argon2id(password, salt, { ...PARAMS, dkLen: KEY_BYTES });
  return `${toBase64url(salt)}:${toBase64url(hash)}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [saltB64, hashB64] = stored.split(":");
  if (!saltB64 || !hashB64) return false;
  const salt = fromBase64url(saltB64);
  const expected = fromBase64url(hashB64);
  const actual = argon2id(password, salt, { ...PARAMS, dkLen: KEY_BYTES });
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i]! ^ expected[i]!;
  return diff === 0;
}
