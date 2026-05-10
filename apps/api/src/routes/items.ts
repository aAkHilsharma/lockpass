import type { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "../db/index.js";
import { vaults, vaultMembers, items, itemVersions } from "../db/schema.js";
import { badRequest, notFound, forbidden, conflict, sendError } from "../lib/errors.js";

const ALLOWED_ITEM_TYPES = ["login", "note"] as const;

async function assertVaultAccess(userId: string, vaultId: string) {
  const vault = await db.query.vaults.findFirst({ where: eq(vaults.id, vaultId) });
  if (!vault) return null;

  const membership = await db.query.vaultMembers.findFirst({
    where: and(
      eq(vaultMembers.vaultId, vaultId),
      eq(vaultMembers.userId, userId),
      eq(vaultMembers.status, "active")
    ),
  });
  if (!membership) return null;

  return vault;
}

export async function itemRoutes(app: FastifyInstance) {
  app.get("/vaults/:vaultId/items", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { userId } = request.user;
    const { vaultId } = request.params as { vaultId: string };
    const query = request.query as { updatedAfter?: string; includeDeleted?: string };

    const vault = await assertVaultAccess(userId, vaultId);
    if (!vault) return sendError(reply, notFound("Vault"));

    const rows = await db.query.items.findMany({
      where: eq(items.vaultId, vaultId),
    });

    const includeDeleted = query.includeDeleted !== "false";
    const updatedAfter = query.updatedAfter;

    const filtered = rows.filter((item) => {
      if (!includeDeleted && item.deletedAt) return false;
      if (updatedAfter && item.updatedAt <= updatedAfter) return false;
      return true;
    });

    return reply.send({
      data: {
        items: filtered.map((item) => ({
          itemId: item.id,
          vaultId: item.vaultId,
          itemType: item.itemType,
          schemaVersion: item.schemaVersion,
          revision: item.revision,
          vaultKeyVersion: item.vaultKeyVersion,
          ciphertext: item.contentCiphertext,
          nonce: item.contentNonce,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          deletedAt: item.deletedAt ?? undefined,
        })),
        serverTime: new Date().toISOString(),
      },
    });
  });

  app.post("/vaults/:vaultId/items", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { userId } = request.user;
    const { vaultId } = request.params as { vaultId: string };
    const body = request.body as Record<string, unknown>;

    const vault = await assertVaultAccess(userId, vaultId);
    if (!vault) return sendError(reply, notFound("Vault"));

    if (!ALLOWED_ITEM_TYPES.includes(body.itemType as typeof ALLOWED_ITEM_TYPES[number])) {
      return sendError(reply, badRequest("Invalid item type"));
    }

    const now = new Date().toISOString();
    const itemId = (body.itemId as string) ?? randomUUID();

    await db.insert(items).values({
      id: itemId,
      vaultId,
      itemType: body.itemType as string,
      schemaVersion: body.schemaVersion as number,
      revision: 0,
      vaultKeyVersion: body.vaultKeyVersion as number,
      contentCiphertext: body.ciphertext as string,
      contentNonce: body.nonce as string,
      createdAt: (body.createdAt as string) ?? now,
      updatedAt: (body.updatedAt as string) ?? now,
    });

    return reply.status(201).send({
      data: {
        itemId,
        revision: 0,
        createdAt: (body.createdAt as string) ?? now,
        updatedAt: (body.updatedAt as string) ?? now,
      },
    });
  });

  app.put("/vaults/:vaultId/items/:itemId", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { userId } = request.user;
    const { vaultId, itemId } = request.params as { vaultId: string; itemId: string };
    const body = request.body as Record<string, unknown>;

    const vault = await assertVaultAccess(userId, vaultId);
    if (!vault) return sendError(reply, notFound("Vault"));

    const item = await db.query.items.findFirst({
      where: and(eq(items.id, itemId), eq(items.vaultId, vaultId), isNull(items.deletedAt)),
    });
    if (!item) return sendError(reply, notFound("Item"));

    if (item.revision !== (body.expectedRevision as number)) {
      return sendError(reply, conflict("ITEM_REVISION_CONFLICT", "Item revision mismatch", {
        currentRevision: item.revision,
      }));
    }

    const now = new Date().toISOString();
    const newRevision = item.revision + 1;

    await db.transaction(async (tx) => {
      await tx.insert(itemVersions).values({
        id: randomUUID(),
        itemId: item.id,
        vaultId,
        revision: item.revision,
        schemaVersion: item.schemaVersion,
        vaultKeyVersion: item.vaultKeyVersion,
        contentCiphertext: item.contentCiphertext,
        contentNonce: item.contentNonce,
        createdAt: now,
      });

      await tx.update(items)
        .set({
          schemaVersion: body.schemaVersion as number,
          vaultKeyVersion: body.vaultKeyVersion as number,
          contentCiphertext: body.ciphertext as string,
          contentNonce: body.nonce as string,
          revision: newRevision,
          updatedAt: (body.updatedAt as string) ?? now,
        })
        .where(eq(items.id, itemId));
    });

    return reply.send({
      data: { itemId, revision: newRevision, updatedAt: (body.updatedAt as string) ?? now },
    });
  });

  app.delete("/vaults/:vaultId/items/:itemId", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { userId } = request.user;
    const { vaultId, itemId } = request.params as { vaultId: string; itemId: string };
    const body = request.body as Record<string, unknown>;

    const vault = await assertVaultAccess(userId, vaultId);
    if (!vault) return sendError(reply, notFound("Vault"));

    const item = await db.query.items.findFirst({
      where: and(eq(items.id, itemId), eq(items.vaultId, vaultId), isNull(items.deletedAt)),
    });
    if (!item) return sendError(reply, notFound("Item"));

    if (body?.expectedRevision !== undefined && item.revision !== (body.expectedRevision as number)) {
      return sendError(reply, conflict("ITEM_REVISION_CONFLICT", "Item revision mismatch", {
        currentRevision: item.revision,
      }));
    }

    const now = new Date().toISOString();
    const newRevision = item.revision + 1;

    await db.update(items)
      .set({ deletedAt: now, revision: newRevision, updatedAt: now })
      .where(eq(items.id, itemId));

    return reply.send({ data: { itemId, revision: newRevision, deletedAt: now } });
  });
}
