import type { FastifyInstance } from "fastify";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, userKeysets, devices, sessions } from "../db/schema.js";
import { badRequest, notFound, sendError } from "../lib/errors.js";

export async function meRoutes(app: FastifyInstance) {
  app.get("/me", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { userId } = request.user;
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) return sendError(reply, notFound("User"));
    return reply.send({ data: { id: user.id, email: user.email, createdAt: user.createdAt } });
  });

  app.get("/me/keyset", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { userId } = request.user;
    const keyset = await db.query.userKeysets.findFirst({
      where: eq(userKeysets.userId, userId),
    });
    if (!keyset) return sendError(reply, notFound("Keyset"));

    const kdfParams = keyset.kdfParamsJson as { memoryKiB: number; iterations: number; parallelism: number };

    return reply.send({
      data: {
        version: keyset.version,
        kdfAlgorithm: keyset.kdfAlgorithm,
        kdfParams,
        kdfSalt: keyset.kdfSalt,
        wrappedUserRootKey: keyset.wrappedUserRootKey,
        wrappedUserRootKeyNonce: keyset.wrappedUserRootKeyNonce,
        wrappedUserRootKeyRecovery: keyset.wrappedUserRootKeyRecovery ?? undefined,
        wrappedUserRootKeyRecoveryNonce: keyset.wrappedUserRootKeyRecoveryNonce ?? undefined,
      },
    });
  });

  app.put("/me/keyset", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { userId } = request.user;
    const body = request.body as Record<string, unknown>;
    if (!body || typeof body !== "object") return sendError(reply, badRequest("Invalid request"));

    const now = new Date().toISOString();
    await db.update(userKeysets)
      .set({
        version: body.version as number,
        kdfAlgorithm: body.kdfAlgorithm as string,
        kdfParamsJson: body.kdfParams,
        kdfSalt: body.kdfSalt as string,
        wrappedUserRootKey: body.wrappedUserRootKey as string,
        wrappedUserRootKeyNonce: body.wrappedUserRootKeyNonce as string,
        wrappedUserRootKeyRecovery: (body.wrappedUserRootKeyRecovery as string) ?? null,
        wrappedUserRootKeyRecoveryNonce: (body.wrappedUserRootKeyRecoveryNonce as string) ?? null,
        updatedAt: now,
      })
      .where(eq(userKeysets.userId, userId));

    return reply.send({ data: { success: true } });
  });

  app.get("/me/devices", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { userId } = request.user;
    const rows = await db.query.devices.findMany({ where: eq(devices.userId, userId) });
    return reply.send({
      data: rows.map((d) => ({
        id: d.id,
        label: d.deviceLabel,
        type: d.deviceType,
        platform: d.platform ?? undefined,
        lastSeenAt: d.lastSeenAt ?? undefined,
        createdAt: d.createdAt,
      })),
    });
  });

  app.delete("/me/devices/:deviceId", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { userId } = request.user;
    const { deviceId } = request.params as { deviceId: string };
    const now = new Date().toISOString();

    const device = await db.query.devices.findFirst({
      where: and(eq(devices.id, deviceId), eq(devices.userId, userId)),
    });
    if (!device) return sendError(reply, notFound("Device"));

    await db.update(sessions)
      .set({ revokedAt: now })
      .where(and(eq(sessions.deviceId, deviceId), eq(sessions.userId, userId)));

    return reply.send({ data: { success: true } });
  });
}
