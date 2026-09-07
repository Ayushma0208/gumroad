import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/paths";
import { remoteApiEnabled } from "@/lib/api/http";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** Mock auth is for local demos only — never serve when remote API is enabled or in production. */
export function mockAuthForbidden() {
  const production = process.env.NODE_ENV === "production";
  const allowExplicit =
    process.env.ALLOW_MOCK_AUTH === "true" && !production;
  if (remoteApiEnabled() || (production && !allowExplicit)) {
    return NextResponse.json(
      { error: "Mock authentication is disabled." },
      { status: 404 },
    );
  }
  return null;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}

export { SESSION_COOKIE };
