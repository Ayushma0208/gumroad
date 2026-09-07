import type { CreatorProfile, User } from "@prisma/client";

export type CreatorSocialLinks = {
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
  github?: string;
};

export type PublicCreator = {
  id: string;
  storeName: string;
  displayName: string;
  slug: string;
  bio: string;
  description: string | null;
  avatar: string | null;
  banner: string | null;
  website: string | null;
  socialLinks: CreatorSocialLinks;
  category: string | null;
};

type ProfileRecord = CreatorProfile & {
  user?: Pick<User, "id" | "name" | "avatarUrl">;
};

function compactSocials(profile: CreatorProfile): CreatorSocialLinks {
  const links: CreatorSocialLinks = {};
  if (profile.instagram) links.instagram = profile.instagram;
  if (profile.twitter) links.twitter = profile.twitter;
  if (profile.linkedin) links.linkedin = profile.linkedin;
  if (profile.youtube) links.youtube = profile.youtube;
  if (profile.github) links.github = profile.github;
  return links;
}

export function serializePublicCreator(profile: ProfileRecord): PublicCreator {
  const avatar = profile.avatar ?? profile.user?.avatarUrl ?? null;
  return {
    id: profile.id,
    storeName: profile.storeName,
    displayName: profile.displayName,
    slug: profile.slug,
    bio: profile.bio,
    description: profile.description,
    avatar,
    banner: profile.banner,
    website: profile.website,
    socialLinks: compactSocials(profile),
    category: profile.category,
  };
}
