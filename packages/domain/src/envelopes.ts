import { z } from "zod";

export const EncryptedItemEnvelopeSchema = z.object({
  itemId: z.string().uuid(),
  vaultId: z.string().uuid(),
  itemType: z.enum(["login", "note"]),
  schemaVersion: z.number().int().positive(),
  revision: z.number().int().nonnegative(),
  vaultKeyVersion: z.number().int().positive(),
  ciphertext: z.string(),
  nonce: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const EncryptedVaultMetadataEnvelopeSchema = z.object({
  vaultId: z.string().uuid(),
  schemaVersion: z.literal(1),
  revision: z.number().int().nonnegative(),
  ciphertext: z.string(),
  nonce: z.string(),
});

export type EncryptedItemEnvelope = z.infer<typeof EncryptedItemEnvelopeSchema>;
export type EncryptedVaultMetadataEnvelope = z.infer<
  typeof EncryptedVaultMetadataEnvelopeSchema
>;
