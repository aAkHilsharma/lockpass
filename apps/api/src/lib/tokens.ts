import { randomBytes } from "@noble/hashes/utils";
import { sha256 } from "@noble/hashes/sha256";
import { toBase64url } from "./encoding.js";

const REFRESH_TOKEN_BYTES = 32;
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function generateRefreshToken(): string {
  return toBase64url(randomBytes(REFRESH_TOKEN_BYTES));
}

export function hashRefreshToken(token: string): string {
  return toBase64url(sha256(token));
}

export function refreshTokenExpiresAt(): string {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_MS).toISOString();
}
