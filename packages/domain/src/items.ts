import { z } from "zod";

const TotpSchema = z.object({
  secret: z.string(),
  digits: z.number().int().min(6).max(8),
  period: z.number().int().positive(),
  algorithm: z.enum(["SHA1", "SHA256", "SHA512"]),
});

export const LoginItemV1Schema = z.object({
  schemaVersion: z.literal(1),
  type: z.literal("login"),
  id: z.string().uuid(),
  vaultId: z.string().uuid(),
  title: z.string(),
  username: z.string(),
  password: z.string(),
  urls: z.array(z.string()),
  notes: z.string(),
  totp: TotpSchema.optional(),
  tags: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const NoteItemV1Schema = z.object({
  schemaVersion: z.literal(1),
  type: z.literal("note"),
  id: z.string().uuid(),
  vaultId: z.string().uuid(),
  title: z.string(),
  body: z.string(),
  tags: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const VaultItemV1Schema = z.discriminatedUnion("type", [
  LoginItemV1Schema,
  NoteItemV1Schema,
]);

export type LoginItemV1 = z.infer<typeof LoginItemV1Schema>;
export type NoteItemV1 = z.infer<typeof NoteItemV1Schema>;
export type VaultItemV1 = z.infer<typeof VaultItemV1Schema>;
export type ItemType = VaultItemV1["type"];
