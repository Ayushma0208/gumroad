import type { CookieOptions } from "express";
import { env } from "./env";

export function sessionCookieOptions(): CookieOptions {
  const production = env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: production,
    sameSite: production ? "none" : "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export function cookieName() {
  return env.COOKIE_NAME;
}
