import type { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { sessionUnlockKeys } from "../db/schema.js";
import { badRequest, notFound, sendError } from "../lib/errors.js";

// Server-held half of the unlock secret. The client encrypts userRootKey with a
// random ClientKey and keeps only the ciphertext locally; the ClientKey lives
// here and is handed back per app-load to an authenticated client. The server
// never sees the ciphertext, so it cannot recover userRootKey on its own.
const UNLOCK_KEY_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export async function unlockKeyRoutes(app: FastifyInstance) {
  app.post("/unlock-keys", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { userId, sessionId } = request.user;
    const body = request.body as { clientKey?: unknown };
    if (!body || typeof body.clientKey !== "string") {
      return sendError(reply, badRequest("clientKey is required"));
    }

    const id = randomUUID();
    const now = new Date();
    await db.insert(sessionUnlockKeys).values({
      id,
      userId,
      sessionId,
      clientKey: body.clientKey,
      expiresAt: new Date(now.getTime() + UNLOCK_KEY_TTL_MS).toISOString(),
      createdAt: now.toISOString(),
    });

    return reply.send({ data: { unlockKeyId: id } });
  });

  app.get("/unlock-keys/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { userId } = request.user;
    const { id } = request.params as { id: string };

    const row = await db.query.sessionUnlockKeys.findFirst({
      where: and(eq(sessionUnlockKeys.id, id), eq(sessionUnlockKeys.userId, userId)),
    });
    if (!row || row.expiresAt < new Date().toISOString()) {
      return sendError(reply, notFound("Unlock key"));
    }

    return reply.send({ data: { clientKey: row.clientKey } });
  });

  app.delete("/unlock-keys/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { userId } = request.user;
    const { id } = request.params as { id: string };

    await db
      .delete(sessionUnlockKeys)
      .where(and(eq(sessionUnlockKeys.id, id), eq(sessionUnlockKeys.userId, userId)));

    return reply.send({ data: { success: true } });
  });
}
