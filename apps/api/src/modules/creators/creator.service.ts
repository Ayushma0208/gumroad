import { prisma } from "../../config/database";
import { conflict, forbidden } from "../../utils/app-error";
import { getUserById } from "../auth/auth.service";
import type { PublicUser } from "../auth/auth.types";
import type { OnboardCreatorInput } from "./creator.schema";

export async function isSlugAvailable(slug: string, ignoreUserId?: string) {
  const existing = await prisma.creatorProfile.findUnique({ where: { slug } });
  if (!existing) return true;
  if (ignoreUserId && existing.userId === ignoreUserId) return true;
  return false;
}

export async function onboardCreator(
  userId: string,
  input: OnboardCreatorInput,
): Promise<PublicUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { creatorProfile: true },
  });
  if (!user) {
    throw forbidden();
  }
  if (user.role === "ADMIN") {
    throw forbidden("Admin accounts do not become creators this way.");
  }
  if (user.creatorProfile) {
    throw conflict("This account already has a store.");
  }

  const available = await isSlugAvailable(input.slug);
  if (!available) {
    throw conflict("That store URL is taken.");
  }

  await prisma.$transaction([
    prisma.creatorProfile.create({
      data: {
        userId,
        displayName: input.displayName,
        storeName: input.storeName,
        slug: input.slug,
        bio: input.bio,
        category: input.category,
        avatar: input.avatarUrl || user.avatarUrl,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { role: "CREATOR" },
    }),
  ]);

  const next = await getUserById(userId);
  if (!next) throw forbidden();
  return next;
}
