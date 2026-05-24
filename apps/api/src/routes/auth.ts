import type { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  users,
  authPasswordCredentials,
  userKeysets,
  devices,
  sessions,
  vaults,
  vaultMembers,
  vaultMemberKeys,
  sessionUnlockKeys,
} from "../db/schema.js";
import { hashPassword, verifyPassword } from "../lib/passwords.js";
import {
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiresAt,
} from "../lib/tokens.js";
import {
  SignupRequestSchema,
  LoginRequestSchema,
  RefreshRequestSchema,
  LogoutRequestSchema,
} from "@lockpass/protocol";
import { AppError, badRequest, unauthorized, sendError } from "../lib/errors.js";

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/signup", async (request, reply) => {
    const parsed = SignupRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendError(reply, badRequest("Invalid request", parsed.error.flatten()));
    }
    const body = parsed.data;
    const email = body.email.toLowerCase();

    const existing = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    if (existing) {
      return sendError(reply, new AppError(409, "EMAIL_TAKEN", "Email already registered"));
    }

    const userId = randomUUID();
    const deviceId = randomUUID();
    const sessionId = randomUUID();
    const vaultId = randomUUID();
    const now = new Date().toISOString();

    const passwordHash = hashPassword(body.password);
    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashRefreshToken(refreshToken);
    const expiresAt = refreshTokenExpiresAt();

    await db.transaction(async (tx) => {
      await tx.insert(users).values({ id: userId, email, status: "active", createdAt: now, updatedAt: now });

      await tx.insert(authPasswordCredentials).values({
        id: randomUUID(),
        userId,
        passwordHash,
        algorithm: "argon2id",
        createdAt: now,
        updatedAt: now,
      });

      await tx.insert(userKeysets).values({
        id: randomUUID(),
        userId,
        version: body.keyset.version,
        kdfAlgorithm: body.keyset.kdfAlgorithm,
        kdfParamsJson: body.keyset.kdfParams,
        kdfSalt: body.keyset.kdfSalt,
        wrappedUserRootKey: body.keyset.wrappedUserRootKey,
        wrappedUserRootKeyNonce: body.keyset.wrappedUserRootKeyNonce,
        wrappedUserRootKeyRecovery: body.keyset.wrappedUserRootKeyRecovery,
        wrappedUserRootKeyRecoveryNonce: body.keyset.wrappedUserRootKeyRecoveryNonce,
        createdAt: now,
        updatedAt: now,
      });

      await tx.insert(devices).values({
        id: deviceId,
        userId,
        deviceLabel: body.device.label,
        deviceType: body.device.type,
        platform: body.device.platform,
        userAgent: body.device.userAgent,
        createdAt: now,
        updatedAt: now,
      });

      await tx.insert(sessions).values({
        id: sessionId,
        userId,
        deviceId,
        refreshTokenHash,
        expiresAt,
        createdAt: now,
      });

      await tx.insert(vaults).values({
        id: vaultId,
        ownerUserId: userId,
        metadataSchemaVersion: body.initialVault.metadataSchemaVersion,
        metadataRevision: 0,
        metadataCiphertext: body.initialVault.metadataCiphertext,
        metadataNonce: body.initialVault.metadataNonce,
        currentKeyVersion: body.initialVault.currentKeyVersion,
        createdAt: now,
        updatedAt: now,
      });

      await tx.insert(vaultMembers).values({
        vaultId,
        userId,
        role: "owner",
        status: "active",
        createdAt: now,
        updatedAt: now,
      });

      await tx.insert(vaultMemberKeys).values({
        id: randomUUID(),
        vaultId,
        userId,
        keyVersion: body.initialVault.currentKeyVersion,
        wrappedVaultKey: body.initialVault.wrappedVaultKey,
        wrappedVaultKeyNonce: body.initialVault.wrappedVaultKeyNonce,
        createdAt: now,
      });
    });

    const accessToken = app.jwt.sign(
      { userId, deviceId, sessionId },
      { expiresIn: "15m" }
    );

    return reply.status(201).send({
      data: {
        user: { id: userId, email },
        device: { id: deviceId, label: body.device.label, type: body.device.type },
        session: { accessToken, refreshToken, expiresAt },
        vault: { id: vaultId },
      },
    });
  });

  app.post("/auth/login", async (request, reply) => {
    const parsed = LoginRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendError(reply, badRequest("Invalid request", parsed.error.flatten()));
    }
    const body = parsed.data;
    const email = body.email.toLowerCase();

    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user) return sendError(reply, unauthorized("Invalid credentials"));

    const creds = await db.query.authPasswordCredentials.findFirst({
      where: eq(authPasswordCredentials.userId, user.id),
    });
    if (!creds || !verifyPassword(body.password, creds.passwordHash)) {
      return sendError(reply, unauthorized("Invalid credentials"));
    }

    const keyset = await db.query.userKeysets.findFirst({
      where: eq(userKeysets.userId, user.id),
    });
    if (!keyset) return sendError(reply, unauthorized("No keyset found"));

    const now = new Date().toISOString();
    const deviceId = randomUUID();
    const sessionId = randomUUID();
    const refreshToken = generateRefreshToken();
    const expiresAt = refreshTokenExpiresAt();

    await db.transaction(async (tx) => {
      await tx.insert(devices).values({
        id: deviceId,
        userId: user.id,
        deviceLabel: body.device.label,
        deviceType: body.device.type,
        platform: body.device.platform,
        userAgent: body.device.userAgent,
        lastSeenAt: now,
        createdAt: now,
        updatedAt: now,
      });

      await tx.insert(sessions).values({
        id: sessionId,
        userId: user.id,
        deviceId,
        refreshTokenHash: hashRefreshToken(refreshToken),
        expiresAt,
        lastUsedAt: now,
        createdAt: now,
      });

      await tx.update(users).set({ lastLoginAt: now, updatedAt: now }).where(eq(users.id, user.id));
    });

    const accessToken = app.jwt.sign(
      { userId: user.id, deviceId, sessionId },
      { expiresIn: "15m" }
    );

    const kdfParams = keyset.kdfParamsJson as { memoryKiB: number; iterations: number; parallelism: number };

    return reply.send({
      data: {
        user: { id: user.id, email: user.email },
        device: { id: deviceId, label: body.device.label, type: body.device.type },
        session: { accessToken, refreshToken, expiresAt },
        keyset: {
          version: keyset.version,
          kdfAlgorithm: keyset.kdfAlgorithm,
          kdfParams,
          kdfSalt: keyset.kdfSalt,
          wrappedUserRootKey: keyset.wrappedUserRootKey,
          wrappedUserRootKeyNonce: keyset.wrappedUserRootKeyNonce,
          wrappedUserRootKeyRecovery: keyset.wrappedUserRootKeyRecovery ?? undefined,
          wrappedUserRootKeyRecoveryNonce: keyset.wrappedUserRootKeyRecoveryNonce ?? undefined,
        },
      },
    });
  });

  app.post("/auth/refresh", async (request, reply) => {
    const parsed = RefreshRequestSchema.safeParse(request.body);
    if (!parsed.success) return sendError(reply, badRequest("Invalid request"));

    const tokenHash = hashRefreshToken(parsed.data.refreshToken);
    const now = new Date().toISOString();

    const session = await db.query.sessions.findFirst({
      where: eq(sessions.refreshTokenHash, tokenHash),
    });

    if (!session || session.revokedAt || session.expiresAt < now) {
      return sendError(reply, unauthorized("Invalid or expired refresh token"));
    }

    const newRefreshToken = generateRefreshToken();
    const expiresAt = refreshTokenExpiresAt();

    await db
      .update(sessions)
      .set({
        refreshTokenHash: hashRefreshToken(newRefreshToken),
        expiresAt,
        lastUsedAt: now,
      })
      .where(eq(sessions.id, session.id));

    const accessToken = app.jwt.sign(
      { userId: session.userId, deviceId: session.deviceId, sessionId: session.id },
      { expiresIn: "15m" }
    );

    return reply.send({
      data: { accessToken, refreshToken: newRefreshToken, expiresAt },
    });
  });

  app.post("/auth/logout", { preHandler: [app.authenticate] }, async (request, reply) => {
    const parsed = LogoutRequestSchema.safeParse(request.body);
    if (!parsed.success) return sendError(reply, badRequest("Invalid request"));

    const tokenHash = hashRefreshToken(parsed.data.refreshToken);
    const now = new Date().toISOString();

    await db
      .update(sessions)
      .set({ revokedAt: now })
      .where(eq(sessions.refreshTokenHash, tokenHash));

    await db
      .delete(sessionUnlockKeys)
      .where(eq(sessionUnlockKeys.sessionId, request.user.sessionId));

    return reply.send({ data: { success: true } });
  });
}
