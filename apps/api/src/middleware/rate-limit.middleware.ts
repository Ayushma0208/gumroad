import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/app-error";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Best-effort in-memory limiter (per process). Document multi-instance limits. */
export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  keyPrefix: string;
  /** Optional secondary key (e.g. email) besides IP */
  keyFromRequest?: (req: Request) => string | undefined;
}) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const now = Date.now();
    const ip =
      (typeof req.headers["x-forwarded-for"] === "string"
        ? req.headers["x-forwarded-for"].split(",")[0]?.trim()
        : undefined) ||
      req.ip ||
      "unknown";
    const extra = options.keyFromRequest?.(req);
    const key = `${options.keyPrefix}:${ip}${extra ? `:${extra}` : ""}`;

    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + options.windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;

    if (bucket.count > options.max) {
      next(
        new AppError(429, "Too many requests. Please try again shortly."),
      );
      return;
    }
    next();
  };
}

/** Test helper */
export function resetRateLimitBuckets() {
  buckets.clear();
}
