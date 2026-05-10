import { z } from "zod";

const ItemTypeSchema = z.enum(["login", "note"]);

const ItemEnvelopeBaseSchema = z.object({
  itemId: z.string().uuid(),
  vaultId: z.string().uuid(),
  itemType: ItemTypeSchema,
  schemaVersion: z.number().int().positive(),
  revision: z.number().int().nonnegative(),
  vaultKeyVersion: z.number().int().positive(),
  ciphertext: z.string(),
  nonce: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ListItemsResponseSchema = z.object({
  items: z.array(
    ItemEnvelopeBaseSchema.extend({ deletedAt: z.string().datetime().optional() })
  ),
  serverTime: z.string().datetime(),
});

export const CreateItemRequestSchema = z.object({
  itemId: z.string().uuid(),
  itemType: ItemTypeSchema,
  schemaVersion: z.number().int().positive(),
  vaultKeyVersion: z.number().int().positive(),
  ciphertext: z.string(),
  nonce: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateItemResponseSchema = z.object({
  itemId: z.string().uuid(),
  revision: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const UpdateItemRequestSchema = z.object({
  expectedRevision: z.number().int().nonnegative(),
  schemaVersion: z.number().int().positive(),
  vaultKeyVersion: z.number().int().positive(),
  ciphertext: z.string(),
  nonce: z.string(),
  updatedAt: z.string().datetime(),
});

export const UpdateItemResponseSchema = z.object({
  itemId: z.string().uuid(),
  revision: z.number().int().nonnegative(),
  updatedAt: z.string().datetime(),
});

export const DeleteItemRequestSchema = z.object({
  expectedRevision: z.number().int().nonnegative(),
});

export const DeleteItemResponseSchema = z.object({
  itemId: z.string().uuid(),
  revision: z.number().int().nonnegative(),
  deletedAt: z.string().datetime(),
});

export type ListItemsResponse = z.infer<typeof ListItemsResponseSchema>;
export type CreateItemRequest = z.infer<typeof CreateItemRequestSchema>;
export type CreateItemResponse = z.infer<typeof CreateItemResponseSchema>;
export type UpdateItemRequest = z.infer<typeof UpdateItemRequestSchema>;
export type UpdateItemResponse = z.infer<typeof UpdateItemResponseSchema>;
export type DeleteItemRequest = z.infer<typeof DeleteItemRequestSchema>;
export type DeleteItemResponse = z.infer<typeof DeleteItemResponseSchema>;
