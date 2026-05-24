import type { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { vaults, vaultMembers, vaultMemberKeys } from "../db/schema.js";
import { badRequest, notFound, forbidden, conflict, sendError } from "../lib/errors.js";

export async function vaultRoutes(app: FastifyInstance) {
  app.get("/vaults", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { userId } = request.user;

    const memberships = await db.query.vaultMembers.findMany({
      where: and(eq(vaultMembers.userId, userId), eq(vaultMembers.status, "active")),
    });

    const vaultIds = memberships.map((m) => m.vaultId);
    if (vaultIds.length === 0) return reply.send({ data: [] });

    const vaultRows = await db.query.vaults.findMany({
      where: inArray(vaults.id, vaultIds),
    });

    const vaultMap = new Map(vaultRows.map((v) => [v.id, v]));

    return reply.send({
      data: memberships.map((m) => {
        const vault = vaultMap.get(m.vaultId)!;
        return {
          id: vault.id,
          role: m.role,
          metadataSchemaVersion: vault.metadataSchemaVersion,
          metadataRevision: vault.metadataRevision,
          metadataCiphertext: vault.metadataCiphertext,
          metadataNonce: vault.metadataNonce,
          currentKeyVersion: vault.currentKeyVersion,
          createdAt: vault.createdAt,
          updatedAt: vault.updatedAt,
        };
      }),
    });
  });

  app.post("/vaults", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { userId } = request.user;
    const body = request.body as Record<string, unknown>;
    if (!body) return sendError(reply, badRequest("Invalid request"));

    const now = new Date().toISOString();
    const vaultId = randomUUID();

    await db.transaction(async (tx) => {
      await tx.insert(vaults).values({
        id: vaultId,
        ownerUserId: userId,
        metadataSchemaVersion: body.metadataSchemaVersion as number,
        metadataRevision: 0,
        metadataCiphertext: body.metadataCiphertext as string,
        metadataNonce: body.metadataNonce as string,
        currentKeyVersion: body.currentKeyVersion as number,
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

      const memberKey = body.memberKey as Record<string, string>;
      await tx.insert(vaultMemberKeys).values({
        id: randomUUID(),
        vaultId,
        userId,
        keyVersion: body.currentKeyVersion as number,
        wrappedVaultKey: memberKey.wrappedVaultKey,
        wrappedVaultKeyNonce: memberKey.wrappedVaultKeyNonce,
        createdAt: now,
      });
    });

    return reply.status(201).send({ data: { id: vaultId, createdAt: now } });
  });

  app.get("/vaults/:vaultId/key", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { userId } = request.user;
    const { vaultId } = request.params as { vaultId: string };

    const vault = await db.query.vaults.findFirst({ where: eq(vaults.id, vaultId) });
    if (!vault) return sendError(reply, notFound("Vault"));

    const membership = await db.query.vaultMembers.findFirst({
      where: and(eq(vaultMembers.vaultId, vaultId), eq(vaultMembers.userId, userId), eq(vaultMembers.status, "active")),
    });
    if (!membership) return sendError(reply, forbidden());

    const memberKey = await db.query.vaultMemberKeys.findFirst({
      where: and(
        eq(vaultMemberKeys.vaultId, vaultId),
        eq(vaultMemberKeys.userId, userId),
        eq(vaultMemberKeys.keyVersion, vault.currentKeyVersion)
      ),
    });
    if (!memberKey) return sendError(reply, notFound("Vault key"));

    return reply.send({
      data: {
        vaultId,
        keyVersion: memberKey.keyVersion,
        wrappedVaultKey: memberKey.wrappedVaultKey,
        wrappedVaultKeyNonce: memberKey.wrappedVaultKeyNonce,
      },
    });
  });

  app.delete("/vaults/:vaultId", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { userId } = request.user;
    const { vaultId } = request.params as { vaultId: string };

    const membership = await db.query.vaultMembers.findFirst({
      where: and(eq(vaultMembers.vaultId, vaultId), eq(vaultMembers.userId, userId), eq(vaultMembers.status, "active")),
    });
    if (!membership || membership.role !== "owner") return sendError(reply, forbidden());

    const now = new Date().toISOString();
    await db.transaction(async (tx) => {
      await tx.update(vaults).set({ archivedAt: now, updatedAt: now }).where(eq(vaults.id, vaultId));
      await tx.update(vaultMembers).set({ status: "inactive", updatedAt: now })
        .where(and(eq(vaultMembers.vaultId, vaultId), eq(vaultMembers.userId, userId)));
    });

    return reply.send({ data: { success: true } });
  });

  app.put("/vaults/:vaultId/metadata", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { userId } = request.user;
    const { vaultId } = request.params as { vaultId: string };
    const body = request.body as Record<string, unknown>;

    const vault = await db.query.vaults.findFirst({ where: eq(vaults.id, vaultId) });
    if (!vault) return sendError(reply, notFound("Vault"));

    const membership = await db.query.vaultMembers.findFirst({
      where: and(eq(vaultMembers.vaultId, vaultId), eq(vaultMembers.userId, userId), eq(vaultMembers.status, "active")),
    });
    if (!membership || membership.role !== "owner") return sendError(reply, forbidden());

    if (vault.metadataRevision !== (body.expectedRevision as number)) {
      return sendError(reply, conflict("VAULT_REVISION_CONFLICT", "Vault metadata revision mismatch", {
        currentRevision: vault.metadataRevision,
      }));
    }

    const now = new Date().toISOString();
    const newRevision = vault.metadataRevision + 1;

    await db.update(vaults)
      .set({
        metadataSchemaVersion: body.metadataSchemaVersion as number,
        metadataCiphertext: body.metadataCiphertext as string,
        metadataNonce: body.metadataNonce as string,
        metadataRevision: newRevision,
        updatedAt: now,
      })
      .where(eq(vaults.id, vaultId));

    return reply.send({ data: { revision: newRevision, updatedAt: now } });
  });
}
