import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(),
    email: text("email").notNull().unique(),
    status: text("status").notNull().default("active"),
    lastLoginAt: timestamp("last_login_at", {
      withTimezone: true,
      mode: "string",
    }),
    ...timestamps,
  }
);

export const authPasswordCredentials = pgTable("auth_password_credentials", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id)
    .unique(),
  passwordHash: text("password_hash").notNull(),
  algorithm: text("algorithm").notNull().default("argon2id"),
  ...timestamps,
});

export const userKeysets = pgTable("user_keysets", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id)
    .unique(),
  version: integer("version").notNull(),
  kdfAlgorithm: text("kdf_algorithm").notNull(),
  kdfParamsJson: jsonb("kdf_params_json").notNull(),
  kdfSalt: text("kdf_salt").notNull(),
  wrappedUserRootKey: text("wrapped_user_root_key").notNull(),
  wrappedUserRootKeyNonce: text("wrapped_user_root_key_nonce").notNull(),
  wrappedUserRootKeyRecovery: text("wrapped_user_root_key_recovery"),
  wrappedUserRootKeyRecoveryNonce: text("wrapped_user_root_key_recovery_nonce"),
  ...timestamps,
});

export const devices = pgTable(
  "devices",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    deviceLabel: text("device_label").notNull(),
    deviceType: text("device_type").notNull(),
    platform: text("platform"),
    userAgent: text("user_agent"),
    lastSeenAt: timestamp("last_seen_at", {
      withTimezone: true,
      mode: "string",
    }),
    ...timestamps,
  },
  (t) => [index("devices_user_id_idx").on(t.userId)]
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    deviceId: uuid("device_id")
      .notNull()
      .references(() => devices.id),
    refreshTokenHash: text("refresh_token_hash").notNull(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "string" }),
    lastUsedAt: timestamp("last_used_at", {
      withTimezone: true,
      mode: "string",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => [
    index("sessions_user_id_idx").on(t.userId),
    index("sessions_device_id_idx").on(t.deviceId),
    index("sessions_expires_at_idx").on(t.expiresAt),
  ]
);

export const sessionUnlockKeys = pgTable(
  "session_unlock_keys",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id),
    clientKey: text("client_key").notNull(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => [
    index("session_unlock_keys_user_id_idx").on(t.userId),
    index("session_unlock_keys_session_id_idx").on(t.sessionId),
  ]
);

export const vaults = pgTable("vaults", {
  id: uuid("id").primaryKey(),
  ownerUserId: uuid("owner_user_id")
    .notNull()
    .references(() => users.id),
  metadataSchemaVersion: integer("metadata_schema_version").notNull(),
  metadataRevision: integer("metadata_revision").notNull().default(0),
  metadataCiphertext: text("metadata_ciphertext").notNull(),
  metadataNonce: text("metadata_nonce").notNull(),
  currentKeyVersion: integer("current_key_version").notNull(),
  archivedAt: timestamp("archived_at", { withTimezone: true, mode: "string" }),
  ...timestamps,
});

export const vaultMembers = pgTable(
  "vault_members",
  {
    vaultId: uuid("vault_id")
      .notNull()
      .references(() => vaults.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    role: text("role").notNull().default("owner"),
    status: text("status").notNull().default("active"),
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.vaultId, t.userId] })]
);

export const vaultMemberKeys = pgTable(
  "vault_member_keys",
  {
    id: uuid("id").primaryKey(),
    vaultId: uuid("vault_id")
      .notNull()
      .references(() => vaults.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    keyVersion: integer("key_version").notNull(),
    wrappedVaultKey: text("wrapped_vault_key").notNull(),
    wrappedVaultKeyNonce: text("wrapped_vault_key_nonce").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => [
    uniqueIndex("vault_member_keys_unique_idx").on(
      t.vaultId,
      t.userId,
      t.keyVersion
    ),
  ]
);

export const items = pgTable(
  "items",
  {
    id: uuid("id").primaryKey(),
    vaultId: uuid("vault_id")
      .notNull()
      .references(() => vaults.id),
    itemType: text("item_type").notNull(),
    schemaVersion: integer("schema_version").notNull(),
    revision: integer("revision").notNull().default(0),
    vaultKeyVersion: integer("vault_key_version").notNull(),
    contentCiphertext: text("content_ciphertext").notNull(),
    contentNonce: text("content_nonce").notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
    ...timestamps,
  },
  (t) => [
    index("items_vault_id_idx").on(t.vaultId),
    index("items_vault_updated_idx").on(t.vaultId, t.updatedAt),
    index("items_vault_deleted_idx").on(t.vaultId, t.deletedAt),
  ]
);

export const itemVersions = pgTable("item_versions", {
  id: uuid("id").primaryKey(),
  itemId: uuid("item_id")
    .notNull()
    .references(() => items.id),
  vaultId: uuid("vault_id")
    .notNull()
    .references(() => vaults.id),
  revision: integer("revision").notNull(),
  schemaVersion: integer("schema_version").notNull(),
  vaultKeyVersion: integer("vault_key_version").notNull(),
  contentCiphertext: text("content_ciphertext").notNull(),
  contentNonce: text("content_nonce").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
