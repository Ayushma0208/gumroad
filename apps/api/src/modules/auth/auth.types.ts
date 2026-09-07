import type { CreatorProfile, Role, UserStatus } from "@prisma/client";

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  avatarUrl: string | null;
  createdAt: string;
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
    status: UserStatus;
    avatarUrl: string | null;
    createdAt?: Date | null;
    creatorProfile: CreatorProfile | null;
  },
): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt
      ? user.createdAt.toISOString()
      : new Date(0).toISOString(),
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
