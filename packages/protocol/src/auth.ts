import { z } from "zod";
import { KeysetSchema, DeviceInfoSchema } from "./common.js";

export const SignupRequestSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  device: DeviceInfoSchema,
  keyset: KeysetSchema,
  initialVault: z.object({
    metadataSchemaVersion: z.literal(1),
    metadataCiphertext: z.string(),
    metadataNonce: z.string(),
    currentKeyVersion: z.number().int().positive(),
    wrappedVaultKey: z.string(),
    wrappedVaultKeyNonce: z.string(),
  }),
});

export const SignupResponseSchema = z.object({
  user: z.object({ id: z.string().uuid(), email: z.string().email() }),
  device: z.object({
    id: z.string().uuid(),
    label: z.string(),
    type: z.enum(["web", "extension"]),
  }),
  session: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    expiresAt: z.string().datetime(),
  }),
  vault: z.object({ id: z.string().uuid() }),
});

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  device: DeviceInfoSchema,
});

export const LoginResponseSchema = z.object({
  user: z.object({ id: z.string().uuid(), email: z.string().email() }),
  device: z.object({
    id: z.string().uuid(),
    label: z.string(),
    type: z.enum(["web", "extension"]),
  }),
  session: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    expiresAt: z.string().datetime(),
  }),
  keyset: KeysetSchema,
});

export const RefreshRequestSchema = z.object({ refreshToken: z.string() });

export const RefreshResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresAt: z.string().datetime(),
});

export const LogoutRequestSchema = z.object({ refreshToken: z.string() });

export type SignupRequest = z.infer<typeof SignupRequestSchema>;
export type SignupResponse = z.infer<typeof SignupResponseSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type RefreshRequest = z.infer<typeof RefreshRequestSchema>;
export type RefreshResponse = z.infer<typeof RefreshResponseSchema>;
export type LogoutRequest = z.infer<typeof LogoutRequestSchema>;
