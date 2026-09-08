import type { ErrorRequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { env } from "../config/env";
import { AppError } from "../utils/app-error";

function isPayloadTooLarge(err: unknown) {
  if (!err || typeof err !== "object") return false;
  const error = err as { type?: string; status?: number; statusCode?: number };
  return (
    error.type === "entity.too.large" ||
    error.status === 413 ||
    error.statusCode === 413
  );
}

export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    res.status(409).json({
      success: false,
      message: "A record with that value already exists.",
    });
    return;
  }

  if (isPayloadTooLarge(err)) {
    res.status(413).json({
      success: false,
      message: "This request is too large. Upload images separately, or use a smaller file.",
    });
    return;
  }

  if (env.NODE_ENV !== "production") {
    console.error(err);
  }

  res.status(500).json({
    success: false,
    message: "Something went wrong",
  });
};
