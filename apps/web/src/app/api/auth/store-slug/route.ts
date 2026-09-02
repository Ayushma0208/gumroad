import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionUser, slugIsAvailable } from "@/lib/mock/auth-db";
import { SESSION_COOKIE } from "@/app/api/auth/_shared";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug")?.trim().toLowerCase() ?? "";
  const jar = await cookies();
  const current = getSessionUser(jar.get(SESSION_COOKIE)?.value);
  const available = slugIsAvailable(slug, current?.id);
  return NextResponse.json({ slug, available });
}
