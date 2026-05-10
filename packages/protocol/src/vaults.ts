import { z } from "zod";

export const VaultSummarySchema = z.object({
  id: z.string().uuid(),
  role: z.literal("owner"),
  metadataSchemaVersion: z.number().int().positive(),
  metadataRevision: z.number().int().nonnegative(),
  metadataCiphertext: z.string(),
  metadataNonce: z.string(),
  currentKeyVersion: z.number().int().positive(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ListVaultsResponseSchema = z.array(VaultSummarySchema);

export const CreateVaultRequestSchema = z.object({
  metadataSchemaVersion: z.literal(1),
  metadataCiphertext: z.string(),
  metadataNonce: z.string(),
  currentKeyVersion: z.number().int().positive(),
  memberKey: z.object({
    wrappedVaultKey: z.string(),
    wrappedVaultKeyNonce: z.string(),
  }),
});

export const CreateVaultResponseSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
});

export const GetVaultKeyResponseSchema = z.object({
  vaultId: z.string().uuid(),
  keyVersion: z.number().int().positive(),
  wrappedVaultKey: z.string(),
  wrappedVaultKeyNonce: z.string(),
});

export const UpdateVaultMetadataRequestSchema = z.object({
  expectedRevision: z.number().int().nonnegative(),
  metadataSchemaVersion: z.number().int().positive(),
  metadataCiphertext: z.string(),
  metadataNonce: z.string(),
});

export const UpdateVaultMetadataResponseSchema = z.object({
  revision: z.number().int().nonnegative(),
  updatedAt: z.string().datetime(),
});

export type VaultSummary = z.infer<typeof VaultSummarySchema>;
export type ListVaultsResponse = z.infer<typeof ListVaultsResponseSchema>;
export type CreateVaultRequest = z.infer<typeof CreateVaultRequestSchema>;
export type CreateVaultResponse = z.infer<typeof CreateVaultResponseSchema>;
export type GetVaultKeyResponse = z.infer<typeof GetVaultKeyResponseSchema>;
export type UpdateVaultMetadataRequest = z.infer<typeof UpdateVaultMetadataRequestSchema>;
export type UpdateVaultMetadataResponse = z.infer<typeof UpdateVaultMetadataResponseSchema>;
