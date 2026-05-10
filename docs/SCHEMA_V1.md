# Lockpass V1 Schema

## What "Schema" Means Here

In `lockpass`, "schema" refers to three related things:

1. **Database schema**
   The tables, columns, indexes, and relationships stored in PostgreSQL.
2. **API schema**
   The JSON request and response shapes sent between clients and the backend.
3. **Domain schema**
   The decrypted item shapes used inside the client before they are encrypted and uploaded.

All three matter, but the most important distinction is:

- the **server database schema** stores encrypted envelopes and account/session metadata
- the **client domain schema** describes the real password-manager objects like logins and notes

## Core Principle

The backend should not store password-manager content as plaintext rows. It should store:

- operational metadata in plaintext
- encrypted item payloads as opaque ciphertext

That means tables like `items` should not have columns like `username`, `password`, or `notes`. Those belong inside encrypted client payloads.

## ID Strategy

V1 recommendation:

- use `uuid` IDs generated in the application
- use the same ID format across web, extension, and API

Main IDs:

- `user_id`
- `device_id`
- `session_id`
- `vault_id`
- `item_id`

## Database Schema

### `users`

Purpose:

- one row per account

Columns:

| column | type | notes |
|---|---|---|
| `id` | `uuid` | primary key |
| `email` | `citext` | unique |
| `status` | `text` | `active`, `pending_verification`, `disabled` |
| `created_at` | `timestamptz` | not null |
| `updated_at` | `timestamptz` | not null |
| `last_login_at` | `timestamptz` | nullable |

Indexes:

- unique index on `email`

### `auth_password_credentials`

Purpose:

- store the server-auth password hash for account login

Columns:

| column | type | notes |
|---|---|---|
| `id` | `uuid` | primary key |
| `user_id` | `uuid` | foreign key to `users.id`, unique |
| `password_hash` | `text` | password hash for account auth |
| `algorithm` | `text` | e.g. `argon2id` |
| `created_at` | `timestamptz` | not null |
| `updated_at` | `timestamptz` | not null |

Notes:

- this is for **server authentication**
- this is not the vault key and not the master password

### `user_keysets`

Purpose:

- store wrapped user root key material and recovery wrapping metadata

Columns:

| column | type | notes |
|---|---|---|
| `id` | `uuid` | primary key |
| `user_id` | `uuid` | foreign key to `users.id`, unique |
| `version` | `integer` | keyset version |
| `kdf_algorithm` | `text` | `argon2id` |
| `kdf_params_json` | `jsonb` | memory, iterations, parallelism |
| `kdf_salt` | `text` | base64url-encoded salt |
| `wrapped_user_root_key` | `text` | base64url ciphertext |
| `wrapped_user_root_key_nonce` | `text` | base64url nonce |
| `wrapped_user_root_key_recovery` | `text` | optional recovery wrapping |
| `wrapped_user_root_key_recovery_nonce` | `text` | optional recovery nonce |
| `created_at` | `timestamptz` | not null |
| `updated_at` | `timestamptz` | not null |

Notes:

- this is what allows the client to unlock the root key locally
- the backend stores wrapped key material but cannot decrypt it

### `devices`

Purpose:

- track browser and extension installations

Columns:

| column | type | notes |
|---|---|---|
| `id` | `uuid` | primary key |
| `user_id` | `uuid` | foreign key to `users.id` |
| `device_label` | `text` | user-visible name |
| `device_type` | `text` | `web`, `extension`, later `android`, `ios` |
| `platform` | `text` | browser/platform string |
| `user_agent` | `text` | nullable |
| `last_seen_at` | `timestamptz` | nullable |
| `created_at` | `timestamptz` | not null |
| `updated_at` | `timestamptz` | not null |

Indexes:

- index on `user_id`

### `sessions`

Purpose:

- refresh-token-backed session tracking

Columns:

| column | type | notes |
|---|---|---|
| `id` | `uuid` | primary key |
| `user_id` | `uuid` | foreign key to `users.id` |
| `device_id` | `uuid` | foreign key to `devices.id` |
| `refresh_token_hash` | `text` | hash only, never raw token |
| `expires_at` | `timestamptz` | not null |
| `revoked_at` | `timestamptz` | nullable |
| `last_used_at` | `timestamptz` | nullable |
| `created_at` | `timestamptz` | not null |

Indexes:

- index on `user_id`
- index on `device_id`
- index on `expires_at`

### `vaults`

Purpose:

- container for a set of encrypted items

Columns:

| column | type | notes |
|---|---|---|
| `id` | `uuid` | primary key |
| `owner_user_id` | `uuid` | foreign key to `users.id` |
| `metadata_schema_version` | `integer` | version of encrypted metadata shape |
| `metadata_revision` | `integer` | optimistic concurrency counter |
| `metadata_ciphertext` | `text` | encrypted vault metadata such as name |
| `metadata_nonce` | `text` | nonce for metadata ciphertext |
| `current_key_version` | `integer` | latest vault key version |
| `created_at` | `timestamptz` | not null |
| `updated_at` | `timestamptz` | not null |
| `archived_at` | `timestamptz` | nullable |

Notes:

- vault name should be encrypted too
- do not store plaintext vault names in V1

### `vault_members`

Purpose:

- future-proof membership model for sharing

Columns:

| column | type | notes |
|---|---|---|
| `vault_id` | `uuid` | foreign key to `vaults.id` |
| `user_id` | `uuid` | foreign key to `users.id` |
| `role` | `text` | V1 only uses `owner` |
| `status` | `text` | `active`, `revoked` |
| `created_at` | `timestamptz` | not null |
| `updated_at` | `timestamptz` | not null |

Primary key:

- composite primary key on `vault_id`, `user_id`

### `vault_member_keys`

Purpose:

- store a wrapped vault key per member per vault

Columns:

| column | type | notes |
|---|---|---|
| `id` | `uuid` | primary key |
| `vault_id` | `uuid` | foreign key to `vaults.id` |
| `user_id` | `uuid` | foreign key to `users.id` |
| `key_version` | `integer` | vault key version |
| `wrapped_vault_key` | `text` | base64url ciphertext |
| `wrapped_vault_key_nonce` | `text` | nonce |
| `created_at` | `timestamptz` | not null |

Indexes:

- unique index on `vault_id`, `user_id`, `key_version`

Notes:

- V1 will usually have one owner and one wrapped key per vault version
- this table is what makes sharing possible later without redesigning key storage

### `items`

Purpose:

- current encrypted item state

Columns:

| column | type | notes |
|---|---|---|
| `id` | `uuid` | primary key |
| `vault_id` | `uuid` | foreign key to `vaults.id` |
| `item_type` | `text` | `login`, `note` |
| `schema_version` | `integer` | domain payload version |
| `revision` | `integer` | optimistic concurrency counter |
| `vault_key_version` | `integer` | key version used for encryption |
| `content_ciphertext` | `text` | encrypted item payload |
| `content_nonce` | `text` | nonce |
| `created_at` | `timestamptz` | not null |
| `updated_at` | `timestamptz` | not null |
| `deleted_at` | `timestamptz` | nullable, soft delete |

Indexes:

- index on `vault_id`
- index on `vault_id`, `updated_at`
- index on `vault_id`, `deleted_at`

Notes:

- no plaintext secret columns belong here
- the server validates shape around the ciphertext, not the secret payload inside it

### `item_versions`

Purpose:

- optional revision history and rollback support

Columns:

| column | type | notes |
|---|---|---|
| `id` | `uuid` | primary key |
| `item_id` | `uuid` | foreign key to `items.id` |
| `vault_id` | `uuid` | foreign key to `vaults.id` |
| `revision` | `integer` | historical revision number |
| `schema_version` | `integer` | payload version at that revision |
| `vault_key_version` | `integer` | key version used |
| `content_ciphertext` | `text` | encrypted content |
| `content_nonce` | `text` | nonce |
| `created_at` | `timestamptz` | not null |

V1 note:

- can be deferred if you want a leaner first milestone

## Relationships

Main relationships:

- one `user` has one `user_keysets` row in V1
- one `user` has many `devices`
- one `user` has many `sessions`
- one `user` owns many `vaults`
- one `vault` has many `vault_members`
- one `vault` has many `vault_member_keys`
- one `vault` has many `items`

Conceptually:

```text
users
  -> user_keysets
  -> devices
  -> sessions
  -> vaults

vaults
  -> vault_members
  -> vault_member_keys
  -> items
  -> item_versions
```

## Domain Schema

These are the decrypted shapes the client works with locally.

### `VaultMetadataV1`

```ts
type VaultMetadataV1 = {
  schemaVersion: 1;
  vaultId: string;
  name: string;
};
```

### `LoginItemV1`

```ts
type LoginItemV1 = {
  schemaVersion: 1;
  type: "login";
  id: string;
  vaultId: string;
  title: string;
  username: string;
  password: string;
  urls: string[];
  notes: string;
  totp?: {
    secret: string;
    digits: number;
    period: number;
    algorithm: "SHA1" | "SHA256" | "SHA512";
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
};
```

### `NoteItemV1`

```ts
type NoteItemV1 = {
  schemaVersion: 1;
  type: "note";
  id: string;
  vaultId: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};
```

### Union Type

```ts
type VaultItemV1 = LoginItemV1 | NoteItemV1;
```

## Envelope Schema

This is the outer shape sent to the backend.

### `EncryptedVaultMetadataEnvelope`

```ts
type EncryptedVaultMetadataEnvelope = {
  vaultId: string;
  schemaVersion: 1;
  revision: number;
  ciphertext: string;
  nonce: string;
};
```

### `EncryptedItemEnvelope`

```ts
type EncryptedItemEnvelope = {
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
};
```

Important:

- `itemType` and `schemaVersion` are safe to expose as operational metadata
- the actual item fields remain encrypted

## Example Lifecycle

Creating a login item:

1. User enters login details in the web app or extension
2. Client builds `LoginItemV1`
3. Client serializes the item JSON
4. Client encrypts it with a key derived from the current `VaultKey`
5. Client sends `EncryptedItemEnvelope` to the API
6. API stores envelope fields in `items`

The server never receives a plaintext `password` column.

## Why This Schema Is Extensible

This design makes future changes easier:

- new item types do not require major DB redesign
- mobile clients can reuse the same envelope contract later
- protobuf can be introduced later if cross-platform schema generation becomes valuable
- vault sharing can be added using `vault_members` and `vault_member_keys`

## Example SQL Skeleton

This is only illustrative, but it shows the intended shape:

```sql
create table users (
  id uuid primary key,
  email citext not null unique,
  status text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  last_login_at timestamptz
);

create table vaults (
  id uuid primary key,
  owner_user_id uuid not null references users(id),
  metadata_schema_version integer not null,
  metadata_revision integer not null,
  metadata_ciphertext text not null,
  metadata_nonce text not null,
  current_key_version integer not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  archived_at timestamptz
);

create table items (
  id uuid primary key,
  vault_id uuid not null references vaults(id),
  item_type text not null,
  schema_version integer not null,
  revision integer not null,
  vault_key_version integer not null,
  content_ciphertext text not null,
  content_nonce text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);
```

## Practical Reading

If you ask "what is the schema for lockpass?", the short answer is:

- PostgreSQL stores users, sessions, vault metadata, wrapped keys, and encrypted item envelopes
- the real password-manager objects live in client-side domain schemas like `LoginItemV1`
- those domain objects are encrypted and stored as ciphertext in the database
