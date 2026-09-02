import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/paths";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export { SESSION_COOKIE };
