import { z } from "zod";

export const VaultMetadataV1Schema = z.object({
  schemaVersion: z.literal(1),
  vaultId: z.string().uuid(),
  name: z.string(),
});

export type VaultMetadataV1 = z.infer<typeof VaultMetadataV1Schema>;
