import { env } from "../../config/env";

export function appUrl(path = "") {
  const base = (env.APP_URL ?? env.CLIENT_URL).replace(/\/$/, "");
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function emailFromAddress() {
  return env.EMAIL_FROM ?? "Lumen <noreply@lumen.local>";
}
