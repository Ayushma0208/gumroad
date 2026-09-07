import { prisma } from "../../config/database";
import { unauthorized } from "../../utils/app-error";
import { getUserById } from "../auth/auth.service";
import { toPublicUser } from "../auth/auth.types";
import type { UpdateProfileInput } from "./user.schema";

export async function updateCurrentUserProfile(
  userId: string,
  input: UpdateProfileInput,
) {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      // Whitelist only — never role/email/status/passwordHash.
      name: input.name.trim(),
    },
    include: { creatorProfile: true },
  });
  return toPublicUser(updated);
}

export async function requireCurrentUser(userId: string) {
  const user = await getUserById(userId);
  if (!user) throw unauthorized();
  return user;
}
