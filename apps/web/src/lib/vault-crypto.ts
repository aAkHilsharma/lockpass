import {
  generateKey, generateKdfSalt,
  wrapKey, unwrapKey, encrypt, decrypt, deriveItemKey,
  toBase64url, fromBase64url, DEFAULT_KDF_PARAMS,
} from '@lockpass/crypto';
import type { VaultItemV1 } from '@lockpass/domain';
import { deriveUnlockKeyAsync } from './kdf-client';

// Recovery key: 32 random bytes shown as 8 groups of 4 uppercase hex chars
// e.g. A3F2-9B1C-E74D-...
export function generateRecoveryKey(): { raw: Uint8Array; formatted: string } {
  const raw = generateKey();
  const hex = Array.from(raw)
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join('');
  const formatted = (hex.match(/.{4}/g) ?? []).join('-');
  return { raw, formatted };
}

export async function signupCrypto(password: string) {
  const kdfSalt = generateKdfSalt();
  const masterUnlockKey = await deriveUnlockKeyAsync(password, kdfSalt, DEFAULT_KDF_PARAMS);

  const userRootKey = generateKey();
  const vaultKey = generateKey();
  const { raw: recoveryKeyBytes, formatted: recoveryKeyFormatted } = generateRecoveryKey();

  const wrappedRootKey = wrapKey(userRootKey, masterUnlockKey);
  const wrappedVaultKey = wrapKey(vaultKey, userRootKey);
  const wrappedRootKeyRecovery = wrapKey(userRootKey, recoveryKeyBytes);

  const metadataBytes = new TextEncoder().encode(
    JSON.stringify({ schemaVersion: 1, name: 'Personal' })
  );
  const encryptedMetadata = encrypt(metadataBytes, vaultKey);

  return {
    userRootKey,
    vaultKey,
    recoveryKeyFormatted,
    keyset: {
      version: 1,
      kdfAlgorithm: 'argon2id' as const,
      kdfParams: DEFAULT_KDF_PARAMS,
      kdfSalt: toBase64url(kdfSalt),
      wrappedUserRootKey: toBase64url(wrappedRootKey.ciphertext),
      wrappedUserRootKeyNonce: toBase64url(wrappedRootKey.nonce),
      wrappedUserRootKeyRecovery: toBase64url(wrappedRootKeyRecovery.ciphertext),
      wrappedUserRootKeyRecoveryNonce: toBase64url(wrappedRootKeyRecovery.nonce),
    },
    initialVault: {
      metadataSchemaVersion: 1 as const,
      metadataCiphertext: toBase64url(encryptedMetadata.ciphertext),
      metadataNonce: toBase64url(encryptedMetadata.nonce),
      currentKeyVersion: 1,
      wrappedVaultKey: toBase64url(wrappedVaultKey.ciphertext),
      wrappedVaultKeyNonce: toBase64url(wrappedVaultKey.nonce),
    },
  };
}

export async function loginCrypto(
  password: string,
  keyset: {
    kdfSalt: string;
    kdfParams: { memoryKiB: number; iterations: number; parallelism: number };
    wrappedUserRootKey: string;
    wrappedUserRootKeyNonce: string;
  }
): Promise<Uint8Array> {
  const masterUnlockKey = await deriveUnlockKeyAsync(
    password,
    fromBase64url(keyset.kdfSalt),
    keyset.kdfParams
  );
  return unwrapKey(
    fromBase64url(keyset.wrappedUserRootKey),
    fromBase64url(keyset.wrappedUserRootKeyNonce),
    masterUnlockKey
  );
}

export function unlockVaultKey(
  userRootKey: Uint8Array,
  wrapped: { wrappedVaultKey: string; wrappedVaultKeyNonce: string }
): Uint8Array {
  return unwrapKey(
    fromBase64url(wrapped.wrappedVaultKey),
    fromBase64url(wrapped.wrappedVaultKeyNonce),
    userRootKey
  );
}

export function encryptItem(
  item: VaultItemV1,
  vaultKey: Uint8Array
): { ciphertext: string; nonce: string } {
  const itemKey = deriveItemKey(vaultKey, item.id);
  const plaintext = new TextEncoder().encode(JSON.stringify(item));
  const sealed = encrypt(plaintext, itemKey);
  return {
    ciphertext: toBase64url(sealed.ciphertext),
    nonce: toBase64url(sealed.nonce),
  };
}

export function decryptItem(
  envelope: { ciphertext: string; nonce: string; itemId: string },
  vaultKey: Uint8Array
): VaultItemV1 {
  const itemKey = deriveItemKey(vaultKey, envelope.itemId);
  const plaintext = decrypt(
    fromBase64url(envelope.ciphertext),
    fromBase64url(envelope.nonce),
    itemKey
  );
  return JSON.parse(new TextDecoder().decode(plaintext)) as VaultItemV1;
}

export interface VaultMetadata {
  name: string;
  icon?: string;
  color?: string;
}

export function decryptVaultMetadata(ciphertext: string, nonce: string, vaultKey: Uint8Array): VaultMetadata {
  const plaintext = decrypt(fromBase64url(ciphertext), fromBase64url(nonce), vaultKey);
  return JSON.parse(new TextDecoder().decode(plaintext)) as VaultMetadata;
}

export function encryptVaultMetadata(meta: VaultMetadata, vaultKey: Uint8Array) {
  const bytes = new TextEncoder().encode(JSON.stringify({ schemaVersion: 1, ...meta }));
  const sealed = encrypt(bytes, vaultKey);
  return { ciphertext: toBase64url(sealed.ciphertext), nonce: toBase64url(sealed.nonce) };
}

export function createVaultCrypto(meta: VaultMetadata, userRootKey: Uint8Array) {
  const vaultKey = generateKey();
  const wrappedVaultKey = wrapKey(vaultKey, userRootKey);
  const metadataBytes = new TextEncoder().encode(JSON.stringify({ schemaVersion: 1, ...meta }));
  const encryptedMetadata = encrypt(metadataBytes, vaultKey);
  return {
    vaultKey,
    request: {
      metadataSchemaVersion: 1 as const,
      metadataCiphertext: toBase64url(encryptedMetadata.ciphertext),
      metadataNonce: toBase64url(encryptedMetadata.nonce),
      currentKeyVersion: 1,
      memberKey: {
        wrappedVaultKey: toBase64url(wrappedVaultKey.ciphertext),
        wrappedVaultKeyNonce: toBase64url(wrappedVaultKey.nonce),
      },
    },
  };
}

export function downloadRecoveryKey(formatted: string, email: string) {
  const date = new Date().toISOString().split('T')[0];
  const content = [
    'LockPass Recovery Key',
    '=====================',
    '',
    `Issued: ${date}`,
    `Account: ${email}`,
    '',
    formatted,
    '',
    'Store this key somewhere safe. If you lose your master password',
    'and this key, your vault cannot be recovered.',
  ].join('\n');

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lockpass-recovery-key-${date}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
