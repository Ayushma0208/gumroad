import { signupSchema } from "@/lib/auth/schema";
import { createAccount, createSession, toPublicUser } from "@/lib/mock/auth-db";
import {
  jsonError,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/app/api/auth/_shared";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ?? "Check the form and try again.";
    return jsonError(message, 400);
  }

  const created = createAccount({
    name: parsed.data.name,
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if ("error" in created) {
    return jsonError(created.error, 409);
  }

  const sessionId = createSession(created.id);
  const response = NextResponse.json({ user: toPublicUser(created) });
  response.cookies.set(SESSION_COOKIE, sessionId, sessionCookieOptions());
  return response;
}
