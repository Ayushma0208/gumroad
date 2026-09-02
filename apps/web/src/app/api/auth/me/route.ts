import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mock/auth-db";
import { jsonError, SESSION_COOKIE } from "@/app/api/auth/_shared";

export async function GET() {
  const jar = await cookies();
  const user = getSessionUser(jar.get(SESSION_COOKIE)?.value);
  if (!user) {
    return jsonError("Unauthorized.", 401);
  }
  return NextResponse.json({ user });
}
