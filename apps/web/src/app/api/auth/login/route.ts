import { loginSchema } from "@/lib/auth/schema";
import {
  createSession,
  findAccountByEmail,
  toPublicUser,
} from "@/lib/mock/auth-db";
import {
  jsonError,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/app/api/auth/_shared";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Enter a valid email and password.", 400);
  }

  const account = findAccountByEmail(parsed.data.email);
  if (!account || account.password !== parsed.data.password) {
    return jsonError("Email or password is incorrect.", 401);
  }

  const sessionId = createSession(account.id);
  const response = NextResponse.json({ user: toPublicUser(account) });
  response.cookies.set(SESSION_COOKIE, sessionId, sessionCookieOptions());
  return response;
}
