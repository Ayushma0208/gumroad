const SESSION_COOKIE = "lumen_session";

export function isSafeNextPath(value: string | null | undefined): value is string {
  return Boolean(value && value.startsWith("/") && !value.startsWith("//"));
}

export function safeNextPath(
  value: string | null | undefined,
  fallback = "/",
): string {
  return isSafeNextPath(value) ? value : fallback;
}

export function loginPath(next?: string | null): string {
  if (!isSafeNextPath(next)) return "/login";
  return `/login?next=${encodeURIComponent(next)}`;
}

export function signupPath(next?: string | null): string {
  if (!isSafeNextPath(next)) return "/signup";
  return `/signup?next=${encodeURIComponent(next)}`;
}

export { SESSION_COOKIE };
