import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { destroySession } from "@/lib/mock/auth-db";
import {
  mockAuthForbidden,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/app/api/auth/_shared";

export async function POST() {
  const blocked = mockAuthForbidden();
  if (blocked) return blocked;

  const jar = await cookies();
  destroySession(jar.get(SESSION_COOKIE)?.value);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    ...sessionCookieOptions(),
    maxAge: 0,
  });
  return response;
}
