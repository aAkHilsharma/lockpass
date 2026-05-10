# Lockpass V1 Plan

## Goal

Build `lockpass` as a zero-knowledge password manager for:

- web app
- browser extension

The design goal for V1 is:

- simple enough to ship quickly
- strong enough to be credible as a password manager
- structured so Android and iOS can be added later without redesigning the system

## Product Boundaries

Lockpass should have three hard boundaries:

1. **Authentication boundary**
   The server verifies the user identity and issues sessions.
2. **Crypto boundary**
   Vault data is encrypted and decrypted only on the client.
3. **Sync boundary**
   The server stores encrypted data, versions it, and syncs it across devices.

This means the backend should never require plaintext access to passwords, notes, TOTP secrets, or vault contents.

## V1 Scope

V1 should include:

- account signup and login
- one personal vault by default
- support for multiple vaults in the data model
- encrypted login items
- encrypted secure notes
- encrypted TOTP secret storage
- web vault UI
- browser extension with autofill and save/update flows
- encrypted sync between devices

V1 should not include:

- vault sharing
- teams or organizations
- file attachments
- public secure links
- server-side search over secret content
- Android or iOS clients

## Tech Stack

### Frontend

- `Next.js`
- `React`
- `TypeScript`
- `TanStack Query` for server state
- `IndexedDB` for encrypted local cache

### Browser Extension

- `Plasmo`
- `React`
- `TypeScript`
- shared packages reused from the web app

### Backend

- `Fastify`
- `TypeScript`
- `Drizzle` for schema and migrations
- `PostgreSQL`

### Monorepo

- `pnpm`
- `Turborepo`

### Validation and Contracts

- `Zod`
- JSON payloads with explicit schema versioning

### Crypto

- `Argon2id` for master-password-based key derivation
- `XChaCha20-Poly1305` for symmetric encryption
- `HKDF-SHA-256` for subkey derivation
- cryptographically secure random number generation only

## Why JSON First

V1 should use JSON contracts instead of protobuf.

Reasoning:

- web and extension are both TypeScript-first
- JSON is easier to debug in browser tools and network traces
- schema iteration is faster at early stage
- mobile is planned later, not now

To stay ready for protobuf later:

- keep schemas disciplined
- use explicit `schemaVersion`
- use additive evolution where possible
- avoid ambiguous field meanings
- define item types clearly

This keeps migration to protobuf possible later without changing the architecture now.

## Repo Layout

Recommended monorepo layout:

```text
apps/
  web/
  extension/
  api/

packages/
  crypto/
  domain/
  protocol/
  api-client/
  ui/
```

### Package Responsibilities

- `packages/crypto`
  All key derivation, encryption, decryption, wrapping, unwrapping, and random generation.
- `packages/domain`
  Item models, schema versions, migrations, sync merge rules, and business logic.
- `packages/protocol`
  API request and response schemas, encrypted envelope shapes, and shared DTO validation.
- `packages/api-client`
  Shared API client for web app and extension.
- `packages/ui`
  Shared UI primitives where reuse is actually helpful.

This structure matters because it keeps security-critical logic and schema logic shared between the web app and extension.

## Authentication Model

Authentication and vault unlock must be separate.

### Server Authentication

Purpose:

- verify who the user is
- issue sessions
- associate devices with the account

V1 recommendation:

- email + password auth for account access
- refresh-token-based sessions
- per-device session tracking

Future-ready additions:

- WebAuthn passkeys
- TOTP as account MFA

### Vault Unlock

Purpose:

- decrypt vault keys locally
- never depend on the server for plaintext access

V1 recommendation:

- user sets a master password
- client derives an unlock key from the master password
- that key unwraps the user root key locally

This separation gives flexibility later:

- passkeys can be added for server auth
- master password remains the local vault unlock secret

## Crypto Model

### Key Hierarchy

Use this hierarchy:

1. User creates a `master password`
2. Client derives `MasterUnlockKey` from the master password using `Argon2id`
3. Client generates random `UserRootKey`
4. `UserRootKey` is encrypted with `MasterUnlockKey`
5. Each vault gets a random `VaultKey`
6. Each `VaultKey` is encrypted with `UserRootKey`
7. Item encryption keys are derived from the `VaultKey`

### Why This Hierarchy

- changing the master password only requires re-wrapping the root key
- multiple vaults are supported cleanly
- future sharing can operate at the vault-key layer
- item-level derivation avoids using one single key for all content

### Algorithms

- KDF: `Argon2id`
- AEAD: `XChaCha20-Poly1305`
- key derivation: `HKDF-SHA-256`

### Things We Should Not Do

- no custom cryptography
- no server-side vault decryption
- no storing master password or equivalent plaintext secret on the backend
- no weak KDF such as plain SHA or unsafely tuned password hashing

## Data Model

The backend should store encrypted envelopes, not plaintext item fields.

### Item Types in V1

- `login`
- `note`

Planned later:

- `card`
- `identity`
- `passkey`
- `ssh_key`

### Item Shape at the Domain Layer

Example `login` item:

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

The server should not store this as plaintext. The client serializes this payload, encrypts it, and uploads the ciphertext.

### Encrypted Envelope Shape

Conceptual shape:

```ts
type EncryptedItemEnvelope = {
  itemId: string;
  vaultId: string;
  itemType: string;
  schemaVersion: number;
  revision: number;
  nonce: string;
  ciphertext: string;
  createdAt: string;
  updatedAt: string;
};
```

### Plaintext Metadata vs Encrypted Data

Plaintext on server:

- ids
- vault ownership references
- revision numbers
- timestamps
- item type
- schema version

Encrypted:

- title
- username
- password
- URLs
- notes
- TOTP secrets
- tags
- custom field values later

The goal is to leave only operational metadata visible to the backend.

## Database Design

Recommended initial tables:

- `users`
- `auth_identities`
- `sessions`
- `devices`
- `vaults`
- `vault_members`
- `vault_keys`
- `items`
- `item_versions` optional in V1, but recommended if revision history is wanted soon

### Table Intent

- `users`
  Core account record.
- `auth_identities`
  Email/password auth now, passkeys later.
- `sessions`
  Access and refresh session tracking.
- `devices`
  Browser/extension device metadata and trust tracking.
- `vaults`
  Vault container metadata.
- `vault_members`
  Membership model. V1 only uses `owner`, but this makes sharing possible later.
- `vault_keys`
  Wrapped vault keys and key version metadata.
- `items`
  Current encrypted item envelopes.
- `item_versions`
  Historical revisions if we choose to support rollback or audit.

### Future-Proof Decision

Include `vault_members` from the start even if V1 supports only personal vaults. This avoids a schema redesign later when vault sharing arrives.

## Sync Model

The server is a sync engine, not a plaintext data processor.

### Sync Flow

1. Client authenticates with the API
2. Client fetches wrapped keys and encrypted items
3. User unlocks the vault locally with the master password
4. Client decrypts local cache and displays data
5. User edits or creates an item
6. Client encrypts the updated payload locally
7. Client uploads the new envelope with expected revision

### Revision Strategy

Each item should have:

- `revision`
- `updatedAt`

Update requests should require `expectedRevision`.

If the server sees a mismatch, it should reject with a conflict response. The client then refetches and resolves.

This is enough for V1. We should not build CRDTs or advanced merge logic yet.

## Local Storage Model

### Web App

- store encrypted cache in `IndexedDB`
- avoid keeping decrypted content persisted longer than needed

### Extension

- store encrypted cache in extension-managed storage or `IndexedDB`
- decrypt in memory during active usage

### Principle

Local cache should help offline and fast startup, but it should still be encrypted with client-held keys.

## Web and Extension Responsibilities

### Web App Responsibilities

- onboarding
- full vault management
- item create/edit/delete
- import/export later
- account settings
- device/session management
- recovery key handling

### Extension Responsibilities

- autofill
- save new login flow
- update existing login flow
- quick search
- TOTP retrieval and fill

Both should use the same domain and crypto packages.

## API Design Principles

The API should be boring and explicit.

Examples of V1 endpoint groups:

- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /vaults`
- `POST /vaults`
- `GET /vaults/:vaultId/items`
- `POST /vaults/:vaultId/items`
- `PUT /vaults/:vaultId/items/:itemId`
- `DELETE /vaults/:vaultId/items/:itemId`
- `GET /me/devices`
- `DELETE /me/devices/:deviceId`

The API should treat encrypted envelopes as application payloads and should validate only the outer structure, ownership, and revision semantics.

## Schema Evolution Strategy

Every domain object should carry `schemaVersion`.

Rules:

- changes should be additive when possible
- old versions must remain readable by migration logic
- clients should migrate decrypted payloads in memory before rendering or saving
- breaking model changes should increment schema version

This is the design choice that keeps Android, iOS, and protobuf migration practical later.

## Recovery Strategy

V1 should support a recovery key.

Flow:

1. Generate a random recovery key during setup
2. Use it to wrap the `UserRootKey` as a second recovery path
3. Show the recovery key to the user once and encourage secure storage

Security implication:

- if the user loses both master password and recovery key, the vault cannot be recovered

That is acceptable and correct for a zero-knowledge design.

## Search Strategy

Do not build server-side search over secret content in V1.

Search should be client-side over decrypted in-memory data.

This keeps the privacy model clean.

## Import and Export

Not required for the first milestone, but the architecture should allow:

- CSV import from other password managers
- encrypted vault export

This logic should live mostly in the web app plus shared domain packages, not in the backend.

## Testing Strategy

### Crypto

- known-answer tests for encryption and decryption
- key wrap/unwrap tests
- schema migration tests

### Domain

- item validation tests
- sync conflict tests
- revision handling tests

### Integration

- signup/login/unlock flows
- create and sync item flows
- extension save/autofill flows

Crypto and schema logic should be tested at the package level, not only through the UI.

## Implementation Phases

### Phase 1: Foundations

- initialize monorepo
- create packages for crypto, domain, protocol, api-client
- define initial schemas and versioning rules
- define database schema and migrations

### Phase 2: Auth and Vault Bootstrap

- signup/login/session flows
- master password setup
- root key generation and wrapping
- default personal vault creation

### Phase 3: Item CRUD and Sync

- encrypted item create/read/update/delete
- revision-based sync
- encrypted local cache

### Phase 4: Web App

- onboarding UI
- vault list and item list
- create/edit item screens
- device/session settings

### Phase 5: Extension

- unlock flow
- quick search
- autofill
- save/update login

### Phase 6: Hardening

- rate limiting
- audit logging for auth/session events
- security review of crypto boundaries
- import/export design

## Decisions Locked for V1

- web + extension first
- zero-knowledge sync model
- JSON + Zod, not protobuf yet
- TypeScript monorepo
- Fastify + Postgres backend
- shared crypto/domain packages
- separate server authentication and local vault unlock
- per-user root key and per-vault keys
- encrypted envelopes stored on the backend

## Deferred Decisions

These should stay explicitly deferred until later:

- protobuf adoption
- Rust shared core
- Android and iOS app architecture
- vault sharing semantics
- attachment storage design
- organization and team roles
- passkey storage as a vault item type

## Recommendation Summary

V1 should be built as a clean TypeScript monorepo with shared crypto and domain logic, a thin sync backend, and encrypted client-managed vault data. The schema should be disciplined and versioned from the start so that mobile clients and protobuf can be added later without rewriting the system model.

## Related Docs

- `docs/SCHEMA_V1.md`
  Concrete database schema, item schema, and encrypted envelope shapes.
- `docs/API_V1.md`
  Concrete V1 API contracts for auth, vaults, keys, items, and sync behavior.
