import type { CookieOptions } from "express";
import { env } from "./env";

/**
 * Prefer SameSite=Lax with same-origin Next.js proxy (default).
 * Set COOKIE_SAME_SITE=none only when the API is on a different site and
 * CSRF header middleware remains enabled.
 */
export function sessionCookieOptions(): CookieOptions {
  const production = env.NODE_ENV === "production";
  const sameSite = env.COOKIE_SAME_SITE;
  return {
    httpOnly: true,
    secure: production || sameSite === "none",
    sameSite,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}

export function cookieName() {
  return env.COOKIE_NAME;
}
