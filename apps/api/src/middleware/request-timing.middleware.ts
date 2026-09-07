import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { logEvent } from "../utils/logger";

const SLOW_MS = 500;

/** Lightweight request duration logging for production bottleneck spotting. */
export function requestTimingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (env.NODE_ENV === "test") {
    next();
    return;
  }

  const started = Date.now();
  res.on("finish", () => {
    const durationMs = Date.now() - started;
    if (durationMs < SLOW_MS) return;
    logEvent("slow_request", {
      method: req.method,
      path: req.originalUrl?.split("?")[0] ?? req.path,
      status: res.statusCode,
      durationMs,
    });
  });
  next();
}
