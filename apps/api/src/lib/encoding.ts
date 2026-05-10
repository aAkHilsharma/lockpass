export function toBase64url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

export function fromBase64url(str: string): Uint8Array {
  return new Uint8Array(Buffer.from(str, "base64url"));
}
