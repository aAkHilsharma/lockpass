import type { FastifyReply } from "fastify";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
  }
}

export function unauthorized(message = "Unauthorized") {
  return new AppError(401, "UNAUTHORIZED", message);
}

export function forbidden(message = "Forbidden") {
  return new AppError(403, "FORBIDDEN", message);
}

export function notFound(resource: string) {
  return new AppError(404, "NOT_FOUND", `${resource} not found`);
}

export function conflict(code: string, message: string, details?: unknown) {
  return new AppError(409, code, message, details);
}

export function badRequest(message: string, details?: unknown) {
  return new AppError(400, "BAD_REQUEST", message, details);
}

export function sendError(reply: FastifyReply, error: AppError) {
  return reply.status(error.statusCode).send({
    error: {
      code: error.code,
      message: error.message,
      ...(error.details !== undefined ? { details: error.details } : {}),
    },
  });
}
