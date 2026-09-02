import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { becomeCreatorSchema } from "@/lib/auth/schema";
import { becomeCreator, getSessionUser } from "@/lib/mock/auth-db";
import { jsonError, SESSION_COOKIE } from "@/app/api/auth/_shared";

export async function POST(request: Request) {
  const jar = await cookies();
  const current = getSessionUser(jar.get(SESSION_COOKIE)?.value);
  if (!current) {
    return jsonError("Unauthorized.", 401);
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = becomeCreatorSchema.safeParse(body);
  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ?? "Check the form and try again.";
    return jsonError(message, 400);
  }

  const result = becomeCreator(current.id, {
    displayName: parsed.data.displayName,
    storeName: parsed.data.storeName,
    slug: parsed.data.slug,
    bio: parsed.data.bio,
    category: parsed.data.category,
    avatarUrl: parsed.data.avatarUrl || current.avatarUrl,
  });

  if ("error" in result) {
    return jsonError(result.error, 409);
  }

  return NextResponse.json({ user: result });
}
