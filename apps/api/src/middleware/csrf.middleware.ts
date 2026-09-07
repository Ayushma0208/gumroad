import type { RequestHandler } from "express";
import { forbidden } from "../utils/app-error";

export const CSRF_HEADER = "x-lumen-client";
export const CSRF_HEADER_VALUE = "web";

/**
 * Cookie sessions need CSRF defense when SameSite=None (cross-origin API).
 * Browsers will not send custom headers on simple cross-site form posts without
 * a CORS preflight, which fails for untrusted origins.
 *
 * Exempt: Razorpay webhook (signature-authenticated) and safe methods.
 */
export const requireCsrfHeader: RequestHandler = (req, _res, next) => {
  // Integration tests omit the header unless ENFORCE_CSRF=true.
  if (process.env.NODE_ENV === "test" && process.env.ENFORCE_CSRF !== "true") {
    next();
    return;
  }

  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    next();
    return;
  }

  if (req.path.includes("/payments/razorpay/webhook")) {
    next();
    return;
  }

  const value = req.header(CSRF_HEADER);
  if (value !== CSRF_HEADER_VALUE) {
    next(forbidden("Missing or invalid client header."));
    return;
  }
  next();
};
