import { prisma } from "../../config/database";
import { conflict, forbidden, notFound } from "../../utils/app-error";
import { getUserById } from "../auth/auth.service";
import type { PublicUser } from "../auth/auth.types";
import { listPublishedProducts } from "../products/product.service";
import type {
  CreatorProductsQuery,
  OnboardCreatorInput,
  UpdateCreatorProfileInput,
} from "./creator.schema";
import { serializePublicCreator } from "./creator.types";
import { getCreatorReviewStats } from "../reviews/review.service";

const publishedCount = {
  select: {
    products: { where: { status: "PUBLISHED" as const } },
  },
};

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
    throw conflict("This store URL is already taken.");
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

async function loadProfileBySlug(slug: string) {
  const profile = await prisma.creatorProfile.findUnique({
    where: { slug },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
      _count: publishedCount,
    },
  });
  if (!profile) {
    throw notFound("This storefront doesn't exist or is no longer available.");
  }
  return profile;
}

async function publicCreatorPayload(profile: {
  id: string;
  _count: { products: number };
} & Parameters<typeof serializePublicCreator>[0]) {
  const reviews = await getCreatorReviewStats(profile.id);
  return {
    creator: serializePublicCreator(profile),
    stats: {
      productCount: profile._count.products,
      averageRating: reviews.averageRating,
      reviewCount: reviews.reviewCount,
    },
  };
}

export async function getPublicCreatorBySlug(slug: string) {
  const profile = await loadProfileBySlug(slug);
  return publicCreatorPayload(profile);
}

export async function listPublicCreators(input: { limit?: number; exclude?: string }) {
  const limit = input.limit ?? 8;
  const profiles = await prisma.creatorProfile.findMany({
    where: {
      ...(input.exclude ? { slug: { not: input.exclude } } : {}),
      products: { some: { status: "PUBLISHED" } },
    },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
      _count: publishedCount,
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  return {
    items: await Promise.all(profiles.map((profile) => publicCreatorPayload(profile))),
  };
}

export async function listPublicCreatorProducts(slug: string, query: CreatorProductsQuery) {
  await loadProfileBySlug(slug);
  return listPublishedProducts({
    creatorSlug: slug,
    featured: query.featured,
    sort: query.sort,
    page: query.page,
    limit: query.limit,
  });
}

export async function getMyCreatorProfile(userId: string) {
  const profile = await prisma.creatorProfile.findUnique({
    where: { userId },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
      _count: publishedCount,
    },
  });
  if (!profile) {
    throw notFound("Create a store first.");
  }
  return publicCreatorPayload(profile);
}

export async function updateMyCreatorProfile(
  userId: string,
  input: UpdateCreatorProfileInput,
) {
  const profile = await prisma.creatorProfile.findUnique({ where: { userId } });
  if (!profile) {
    throw notFound("Create a store first.");
  }

  if (input.slug && input.slug !== profile.slug) {
    const available = await isSlugAvailable(input.slug, userId);
    if (!available) {
      throw conflict("This store URL is already taken.");
    }
  }

  const updated = await prisma.creatorProfile.update({
    where: { id: profile.id },
    data: {
      ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
      ...(input.storeName !== undefined ? { storeName: input.storeName } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.bio !== undefined ? { bio: input.bio } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.website !== undefined ? { website: input.website } : {}),
      ...(input.instagram !== undefined ? { instagram: input.instagram } : {}),
      ...(input.twitter !== undefined ? { twitter: input.twitter } : {}),
      ...(input.linkedin !== undefined ? { linkedin: input.linkedin } : {}),
      ...(input.youtube !== undefined ? { youtube: input.youtube } : {}),
      ...(input.github !== undefined ? { github: input.github } : {}),
    },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
      _count: publishedCount,
    },
  });

  const user = await getUserById(userId);
  const payload = await publicCreatorPayload(updated);
  return { ...payload, user };
}
