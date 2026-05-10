# Lockpass V1 API

## Purpose

This document defines the V1 API shape for `lockpass`.

Principles:

- JSON transport
- explicit request and response schemas
- encrypted payloads passed through as opaque envelopes
- server validates ownership, session state, shape, and revision semantics
- server does not decrypt vault contents

## Auth Model

V1 uses:

- account auth with email + password
- refresh-token-backed sessions
- separate client-side vault unlock after login

This means:

- login proves identity to the server
- unlock decrypts vault data locally on the client

## Session Model

Recommended:

- short-lived access token
- long-lived rotating refresh token
- refresh token stored and compared by hash server-side

Headers:

- `Authorization: Bearer <access_token>`

## Common Response Shape

Success responses:

```ts
type ApiSuccess<T> = {
  data: T;
};
```

Error responses:

```ts
type ApiError = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};
```

## Auth Endpoints

### `POST /auth/signup`

Creates the user account, device, initial keyset, and default personal vault.

Request:

```ts
type SignupRequest = {
  email: string;
  password: string;
  device: {
    label: string;
    type: "web" | "extension";
    platform?: string;
    userAgent?: string;
  };
  keyset: {
    version: number;
    kdfAlgorithm: "argon2id";
    kdfParams: {
      memoryKiB: number;
      iterations: number;
      parallelism: number;
    };
    kdfSalt: string;
    wrappedUserRootKey: string;
    wrappedUserRootKeyNonce: string;
    wrappedUserRootKeyRecovery?: string;
    wrappedUserRootKeyRecoveryNonce?: string;
  };
  initialVault: {
    metadataSchemaVersion: 1;
    metadataCiphertext: string;
    metadataNonce: string;
    currentKeyVersion: number;
    wrappedVaultKey: string;
    wrappedVaultKeyNonce: string;
  };
};
```

Response:

```ts
type SignupResponse = {
  user: {
    id: string;
    email: string;
  };
  device: {
    id: string;
    label: string;
    type: "web" | "extension";
  };
  session: {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
  };
  vault: {
    id: string;
  };
};
```

Notes:

- the client generates key material before signup request is sent
- the server stores wrapped keys and encrypted vault metadata

### `POST /auth/login`

Authenticates the account and creates or refreshes device/session state.

Request:

```ts
type LoginRequest = {
  email: string;
  password: string;
  device: {
    label: string;
    type: "web" | "extension";
    platform?: string;
    userAgent?: string;
  };
};
```

Response:

```ts
type LoginResponse = {
  user: {
    id: string;
    email: string;
  };
  device: {
    id: string;
    label: string;
    type: "web" | "extension";
  };
  session: {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
  };
  keyset: {
    version: number;
    kdfAlgorithm: "argon2id";
    kdfParams: {
      memoryKiB: number;
      iterations: number;
      parallelism: number;
    };
    kdfSalt: string;
    wrappedUserRootKey: string;
    wrappedUserRootKeyNonce: string;
    wrappedUserRootKeyRecovery?: string;
    wrappedUserRootKeyRecoveryNonce?: string;
  };
};
```

Important:

- successful login does not mean the vault is unlocked yet
- the client still needs the master password to derive the unlock key locally

### `POST /auth/refresh`

Rotates refresh token and returns a new access token.

Request:

```ts
type RefreshRequest = {
  refreshToken: string;
};
```

Response:

```ts
type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
};
```

### `POST /auth/logout`

Revokes the current session.

Request:

```ts
type LogoutRequest = {
  refreshToken: string;
};
```

Response:

```ts
type LogoutResponse = {
  success: true;
};
```

## Account Endpoints

### `GET /me`

Returns basic account metadata.

Response:

```ts
type MeResponse = {
  id: string;
  email: string;
  createdAt: string;
};
```

### `GET /me/keyset`

Fetches wrapped root-key material for vault unlock.

Response:

```ts
type MeKeysetResponse = {
  version: number;
  kdfAlgorithm: "argon2id";
  kdfParams: {
    memoryKiB: number;
    iterations: number;
    parallelism: number;
  };
  kdfSalt: string;
  wrappedUserRootKey: string;
  wrappedUserRootKeyNonce: string;
  wrappedUserRootKeyRecovery?: string;
  wrappedUserRootKeyRecoveryNonce?: string;
};
```

### `PUT /me/keyset`

Used when changing the master password or rotating recovery wrapping.

Request:

```ts
type UpdateKeysetRequest = {
  version: number;
  kdfAlgorithm: "argon2id";
  kdfParams: {
    memoryKiB: number;
    iterations: number;
    parallelism: number;
  };
  kdfSalt: string;
  wrappedUserRootKey: string;
  wrappedUserRootKeyNonce: string;
  wrappedUserRootKeyRecovery?: string;
  wrappedUserRootKeyRecoveryNonce?: string;
};
```

Response:

```ts
type UpdateKeysetResponse = {
  success: true;
};
```

## Device Endpoints

### `GET /me/devices`

Response:

```ts
type ListDevicesResponse = Array<{
  id: string;
  label: string;
  type: "web" | "extension";
  platform?: string;
  lastSeenAt?: string;
  createdAt: string;
}>;
```

### `DELETE /me/devices/:deviceId`

Revokes sessions for the device and removes trust.

Response:

```ts
type DeleteDeviceResponse = {
  success: true;
};
```

## Vault Endpoints

### `GET /vaults`

Lists vaults visible to the user plus encrypted metadata envelope info.

Response:

```ts
type ListVaultsResponse = Array<{
  id: string;
  role: "owner";
  metadataSchemaVersion: number;
  metadataRevision: number;
  metadataCiphertext: string;
  metadataNonce: string;
  currentKeyVersion: number;
  createdAt: string;
  updatedAt: string;
}>;
```

### `POST /vaults`

Creates an additional vault.

Request:

```ts
type CreateVaultRequest = {
  metadataSchemaVersion: 1;
  metadataCiphertext: string;
  metadataNonce: string;
  currentKeyVersion: number;
  memberKey: {
    wrappedVaultKey: string;
    wrappedVaultKeyNonce: string;
  };
};
```

Response:

```ts
type CreateVaultResponse = {
  id: string;
  createdAt: string;
};
```

### `GET /vaults/:vaultId/key`

Fetches the caller's wrapped vault key for the current key version.

Response:

```ts
type GetVaultKeyResponse = {
  vaultId: string;
  keyVersion: number;
  wrappedVaultKey: string;
  wrappedVaultKeyNonce: string;
};
```

### `PUT /vaults/:vaultId/metadata`

Updates encrypted vault metadata such as vault name.

Request:

```ts
type UpdateVaultMetadataRequest = {
  expectedRevision: number;
  metadataSchemaVersion: number;
  metadataCiphertext: string;
  metadataNonce: string;
};
```

Response:

```ts
type UpdateVaultMetadataResponse = {
  revision: number;
  updatedAt: string;
};
```

## Item Endpoints

### `GET /vaults/:vaultId/items`

Lists current item envelopes.

Query params:

- `updatedAfter` optional for incremental sync
- `includeDeleted` optional, default `true`

Response:

```ts
type ListItemsResponse = {
  items: Array<{
    itemId: string;
    vaultId: string;
    itemType: "login" | "note";
    schemaVersion: number;
    revision: number;
    vaultKeyVersion: number;
    ciphertext: string;
    nonce: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
  }>;
  serverTime: string;
};
```

### `POST /vaults/:vaultId/items`

Creates a new encrypted item.

Request:

```ts
type CreateItemRequest = {
  itemId: string;
  itemType: "login" | "note";
  schemaVersion: number;
  vaultKeyVersion: number;
  ciphertext: string;
  nonce: string;
  createdAt: string;
  updatedAt: string;
};
```

Response:

```ts
type CreateItemResponse = {
  itemId: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
};
```

### `PUT /vaults/:vaultId/items/:itemId`

Updates an encrypted item using optimistic concurrency.

Request:

```ts
type UpdateItemRequest = {
  expectedRevision: number;
  schemaVersion: number;
  vaultKeyVersion: number;
  ciphertext: string;
  nonce: string;
  updatedAt: string;
};
```

Response:

```ts
type UpdateItemResponse = {
  itemId: string;
  revision: number;
  updatedAt: string;
};
```

Conflict response:

```ts
type ConflictError = {
  error: {
    code: "ITEM_REVISION_CONFLICT";
    message: string;
    details: {
      currentRevision: number;
    };
  };
};
```

### `DELETE /vaults/:vaultId/items/:itemId`

Soft-deletes an item.

Request:

```ts
type DeleteItemRequest = {
  expectedRevision: number;
};
```

Response:

```ts
type DeleteItemResponse = {
  itemId: string;
  revision: number;
  deletedAt: string;
};
```

## Sync Semantics

V1 sync should use revision-based optimistic concurrency.

Rules:

- every item has a numeric `revision`
- client updates must include `expectedRevision`
- server increments revision on success
- server rejects stale writes with a conflict error
- client resolves by refetching and reapplying changes

This is enough for V1 and does not require CRDTs.

## Validation Rules

The server validates:

- authenticated user and session
- ownership or membership of the vault
- outer request shape
- item type allowlist
- schema version is supported
- revision semantics
- required ciphertext and nonce fields are present

The server does not validate decrypted password-manager fields because it cannot read them.

## What Unlock Looks Like In Practice

Unlock is not its own API route.

Practical flow:

1. client calls `POST /auth/login`
2. server returns session + wrapped user root key
3. user enters master password locally
4. client derives `MasterUnlockKey` with returned KDF params
5. client unwraps `UserRootKey`
6. client fetches vault list and wrapped vault keys
7. client unwraps vault key locally
8. client decrypts item envelopes locally

That is why vault unlock remains zero-knowledge.

## How This Evolves Later

This API leaves room for:

- passkeys for login
- mobile clients
- vault sharing
- item-history endpoints
- attachments
- protobuf-generated contracts if needed later

The API shape already assumes the server handles envelopes and wrapped keys, not plaintext secret fields.
