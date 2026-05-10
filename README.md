# LockPass

A zero-knowledge password manager. The server stores only encrypted envelopes — vault data is encrypted and decrypted exclusively on the client. No plaintext passwords, notes, or secrets ever leave the device.

## Zero-Knowledge Model

- Master password never leaves the device
- All encryption and decryption happens client-side
- The server handles identity, sessions, and sync — not secrets
- Changing a master password only re-wraps the root key, not every item

## Stack

| Layer | Technology |
|---|---|
| Web app | Next.js 15, React 19, TypeScript |
| Browser extension | Plasmo |
| Backend | Fastify, Drizzle, PostgreSQL |
| Crypto | Argon2id, XChaCha20-Poly1305, HKDF-SHA-256 |
| Monorepo | pnpm, Turborepo |

## Repo Structure

```
apps/
  web/        — Web vault UI and marketing site
  extension/  — Browser extension (autofill, save, search)
  api/        — Sync and auth backend

packages/
  crypto/     — Key derivation, encryption, decryption
  domain/     — Item models, schema versioning, sync rules
  protocol/   — API contracts and encrypted envelope shapes
  api-client/ — Shared API client for web and extension
  ui/         — Shared UI primitives
```