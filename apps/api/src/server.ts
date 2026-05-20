import Fastify from "fastify";
import fjwt from "@fastify/jwt";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { env } from "./env.js";
import { authRoutes } from "./routes/auth.js";
import { meRoutes } from "./routes/me.js";
import { vaultRoutes } from "./routes/vaults.js";
import { itemRoutes } from "./routes/items.js";
import { AppError, sendError } from "./lib/errors.js";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { userId: string; deviceId: string; sessionId: string };
    user: { userId: string; deviceId: string; sessionId: string };
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (
      request: import("fastify").FastifyRequest,
      reply: import("fastify").FastifyReply
    ) => Promise<void>;
  }
}

export function buildServer() {
  const app = Fastify({
    logger: env.NODE_ENV === "development" ? { level: "info" } : false,
  });

  app.register(helmet);
  app.register(cors, { origin: env.NODE_ENV === "development" ? true : false });
  app.register(fjwt, { secret: env.JWT_ACCESS_SECRET });

  app.decorate("authenticate", async (request: import("fastify").FastifyRequest, reply: import("fastify").FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ error: { code: "UNAUTHORIZED", message: "Invalid or expired token" } });
    }
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) return sendError(reply, error);
    const cause = (error as any).cause;
    const sourceError = cause?.sourceError ?? cause;
    app.log.error({
      err: { message: error.message, name: error.name },
      cause: cause ? { message: cause.message } : undefined,
      source: sourceError ? { message: sourceError.message, cause: String((sourceError as any)?.cause) } : undefined,
    }, "Unhandled error");
    return reply.status(500).send({ error: { code: "INTERNAL_ERROR", message: error.message ?? "Internal server error" } });
  });

  app.register(authRoutes);
  app.register(meRoutes);
  app.register(vaultRoutes);
  app.register(itemRoutes);

  app.get("/health", async () => ({ status: "ok" }));


  return app;
}
