import type { CreatorProfile, Role } from "@prisma/client";

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  creatorProfile: {
    displayName: string;
    storeName: string;
    slug: string;
    bio: string;
    category: string;
    avatarUrl: string | null;
  } | null;
};

export function toPublicUser(
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    avatarUrl: string | null;
    creatorProfile: CreatorProfile | null;
  },
): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    creatorProfile: user.creatorProfile
      ? {
          displayName: user.creatorProfile.displayName,
          storeName: user.creatorProfile.storeName,
          slug: user.creatorProfile.slug,
          bio: user.creatorProfile.bio,
          category: user.creatorProfile.category ?? "",
          avatarUrl: user.creatorProfile.avatar,
        }
      : null,
  };
}
