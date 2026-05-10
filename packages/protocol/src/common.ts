import { z } from "zod";

export const ApiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({ data: dataSchema });

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

export const DeviceTypeSchema = z.enum(["web", "extension"]);
export type DeviceType = z.infer<typeof DeviceTypeSchema>;

export const KeysetSchema = z.object({
  version: z.number().int().positive(),
  kdfAlgorithm: z.literal("argon2id"),
  kdfParams: z.object({
    memoryKiB: z.number().int().positive(),
    iterations: z.number().int().positive(),
    parallelism: z.number().int().positive(),
  }),
  kdfSalt: z.string(),
  wrappedUserRootKey: z.string(),
  wrappedUserRootKeyNonce: z.string(),
  wrappedUserRootKeyRecovery: z.string().optional(),
  wrappedUserRootKeyRecoveryNonce: z.string().optional(),
});

export type Keyset = z.infer<typeof KeysetSchema>;

export const DeviceInfoSchema = z.object({
  label: z.string(),
  type: DeviceTypeSchema,
  platform: z.string().optional(),
  userAgent: z.string().optional(),
});
