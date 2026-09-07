import type { Prisma, ReviewStatus, Role } from "@prisma/client";
import { Prisma as PrismaNS } from "@prisma/client";
import { prisma } from "../../config/database";
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
} from "../../utils/app-error";
import {
  paginationMeta,
  parsePagination,
  skipTake,
} from "../../utils/pagination";
import { getCustomerProductAccess } from "../access/access.service";
import { notifyReviewCreated } from "../notifications/notification.events";
import type {
  AdminReviewsQuery,
  CreateReviewInput,
  CreatorReviewsQuery,
  ListReviewsQuery,
  UpdateReviewInput,
} from "./review.schema";
import { serializePublicReview, serializeSummary } from "./review.types";

const publicUserSelect = { id: true, name: true, avatarUrl: true } as const;

const reviewInclude = {
  user: { select: publicUserSelect },
  reply: { include: { creator: { select: { storeName: true } } } },
} satisfies Prisma.ReviewInclude;

function assertRating(rating: number) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw badRequest("Choose a rating from 1 to 5.");
  }
}

async function loadProduct(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, creatorId: true, creator: { select: { userId: true } } },
  });
  if (!product) throw notFound("Product not found");
  return product;
}

async function verifiedBuyerIds(productId: string, userIds: string[]) {
  if (userIds.length === 0) return new Set<string>();
  const purchases = await prisma.purchase.findMany({
    where: {
      productId,
      userId: { in: userIds },
      order: { status: "PAID" },
    },
    select: { userId: true },
  });
  return new Set(purchases.map((row) => row.userId));
}

function reviewOrderBy(sort?: string): Prisma.ReviewOrderByWithRelationInput[] {
  if (sort === "oldest") return [{ createdAt: "asc" }];
  if (sort === "highest") return [{ rating: "desc" }, { createdAt: "desc" }];
  if (sort === "lowest") return [{ rating: "asc" }, { createdAt: "desc" }];
  return [{ createdAt: "desc" }];
}

export async function getReviewSummary(productId: string) {
  await loadProduct(productId);
  const where = { productId, status: "PUBLISHED" as const };
  const [aggregate, counts] = await Promise.all([
    prisma.review.aggregate({
      where,
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.review.groupBy({
      by: ["rating"],
      where,
      _count: true,
    }),
  ]);
  return serializeSummary({
    average: aggregate._avg.rating,
    total: aggregate._count._all,
    counts: counts.map((row) => ({ rating: row.rating, _count: row._count })),
  });
}

export async function getCreatorReviewStats(creatorId: string) {
  const where = {
    status: "PUBLISHED" as const,
    product: { creatorId },
  };
  const aggregate = await prisma.review.aggregate({
    where,
    _avg: { rating: true },
    _count: { _all: true },
  });
  const averageRating =
    aggregate._count._all === 0 || aggregate._avg.rating == null
      ? 0
      : Math.round(aggregate._avg.rating * 10) / 10;
  return {
    averageRating,
    reviewCount: aggregate._count._all,
  };
}

export async function listPublishedReviews(
  productId: string,
  query: ListReviewsQuery,
) {
  await loadProduct(productId);
  const pagination = parsePagination(query.page, query.limit ?? 10);
  const where = { productId, status: "PUBLISHED" as const };
  const [total, reviews] = await prisma.$transaction([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      include: reviewInclude,
      orderBy: reviewOrderBy(query.sort ?? "newest"),
      ...skipTake(pagination),
    }),
  ]);
  const verified = await verifiedBuyerIds(
    productId,
    reviews.map((review) => review.userId),
  );
  return {
    items: reviews.map((review) =>
      serializePublicReview(review, { verified: verified.has(review.userId) }),
    ),
    pagination: paginationMeta(pagination.page, pagination.limit, total),
  };
}

export async function getReviewEligibility(userId: string | undefined, productId: string) {
  const product = await loadProduct(productId);
  if (!userId) {
    return { canReview: false, reason: "unauthenticated" as const, review: null };
  }
  if (product.creator.userId === userId) {
    return { canReview: false, reason: "own_product" as const, review: null };
  }
  const access = await getCustomerProductAccess(userId, productId);
  if (!access) {
    return { canReview: false, reason: "not_purchased" as const, review: null };
  }
  const existing = await prisma.review.findUnique({
    where: { userId_productId: { userId, productId } },
    include: reviewInclude,
  });
  if (existing) {
    return {
      canReview: false,
      reason: "already_reviewed" as const,
      review: serializePublicReview(existing, {
        verified: true,
        includeStatus: true,
      }),
    };
  }
  return { canReview: true, reason: "eligible" as const, review: null };
}

export async function createReview(
  userId: string,
  productId: string,
  input: CreateReviewInput,
) {
  assertRating(input.rating);
  const product = await loadProduct(productId);
  if (product.creator.userId === userId) {
    throw forbidden("You cannot review your own product.");
  }
  const access = await getCustomerProductAccess(userId, productId);
  if (!access) {
    throw forbidden("Only customers who purchased this product can leave a review.");
  }
  try {
    const review = await prisma.review.create({
      data: {
        userId,
        productId,
        orderId: access.orderId,
        rating: input.rating,
        title: input.title,
        comment: input.comment,
        status: "PUBLISHED",
      },
      include: reviewInclude,
    });
    void notifyReviewCreated(review.id);
    return serializePublicReview(review, { verified: true });
  } catch (error) {
    if (error instanceof PrismaNS.PrismaClientKnownRequestError && error.code === "P2002") {
      throw conflict("You have already reviewed this product.");
    }
    throw error;
  }
}

export async function updateReview(
  userId: string,
  role: Role,
  reviewId: string,
  input: UpdateReviewInput,
) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw notFound("Review not found");
  if (role !== "ADMIN" && review.userId !== userId) {
    throw forbidden("You can only edit your own review.");
  }
  if (input.rating !== undefined) assertRating(input.rating);
  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: {
      ...(input.rating !== undefined ? { rating: input.rating } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.comment !== undefined ? { comment: input.comment } : {}),
    },
    include: reviewInclude,
  });
  return serializePublicReview(updated, { verified: true, includeStatus: true });
}

export async function deleteReview(userId: string, role: Role, reviewId: string) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw notFound("Review not found");
  if (role !== "ADMIN" && review.userId !== userId) {
    throw forbidden("You can only delete your own review.");
  }
  await prisma.review.delete({ where: { id: reviewId } });
  return { ok: true as const };
}

async function requireCreatorProfile(userId: string, role: Role) {
  if (role === "ADMIN") {
    return prisma.creatorProfile.findUnique({ where: { userId } });
  }
  const profile = await prisma.creatorProfile.findUnique({ where: { userId } });
  if (!profile) throw forbidden("Create a store first.");
  return profile;
}

export async function listCreatorReviews(
  userId: string,
  role: Role,
  query: CreatorReviewsQuery,
) {
  const profile = await requireCreatorProfile(userId, role);
  if (!profile && role !== "ADMIN") throw forbidden();
  const pagination = parsePagination(query.page, query.limit ?? 20);
  const where: Prisma.ReviewWhereInput = {
    status: "PUBLISHED",
    ...(query.rating ? { rating: query.rating } : {}),
    ...(role === "ADMIN" && !profile
      ? {}
      : { product: { creatorId: profile!.id } }),
  };
  const [total, reviews, summary] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      include: {
        ...reviewInclude,
        product: { select: { id: true, title: true, slug: true } },
      },
      orderBy: reviewOrderBy(query.sort ?? "newest"),
      ...skipTake(pagination),
    }),
    profile
      ? getCreatorReviewStats(profile.id)
      : prisma.review
          .aggregate({
            where: { status: "PUBLISHED" },
            _avg: { rating: true },
            _count: { _all: true },
          })
          .then((row) => ({
            averageRating:
              row._count._all === 0 || row._avg.rating == null
                ? 0
                : Math.round(row._avg.rating * 10) / 10,
            reviewCount: row._count._all,
          })),
  ]);
  const productIds = [...new Set(reviews.map((review) => review.productId))];
  const purchases = await prisma.purchase.findMany({
    where: {
      productId: { in: productIds },
      userId: { in: reviews.map((review) => review.userId) },
      order: { status: "PAID" },
    },
    select: { userId: true, productId: true },
  });
  const verified = new Set(purchases.map((row) => `${row.userId}:${row.productId}`));
  return {
    summary,
    items: reviews.map((review) =>
      serializePublicReview(review, {
        verified: verified.has(`${review.userId}:${review.productId}`),
      }),
    ),
    pagination: paginationMeta(pagination.page, pagination.limit, total),
  };
}

export async function upsertReviewReply(
  userId: string,
  role: Role,
  reviewId: string,
  comment: string,
) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: { product: { select: { creatorId: true } } },
  });
  if (!review) throw notFound("Review not found");
  const profile = await prisma.creatorProfile.findUnique({ where: { userId } });
  if (role !== "ADMIN") {
    if (!profile) throw forbidden("Create a store first.");
    if (profile.id !== review.product.creatorId) {
      throw forbidden("You can only reply to reviews on your own products.");
    }
  }
  const creatorId = profile?.id ?? review.product.creatorId;
  const reply = await prisma.reviewReply.upsert({
    where: { reviewId },
    create: {
      reviewId,
      creatorId,
      comment,
    },
    update: { comment },
    include: { creator: { select: { storeName: true } } },
  });
  return {
    comment: reply.comment,
    createdAt: reply.createdAt.toISOString(),
    creatorName: reply.creator.storeName,
  };
}

export async function listAdminReviews(query: AdminReviewsQuery) {
  const pagination = parsePagination(query.page, query.limit ?? 20);
  const where: Prisma.ReviewWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.rating ? { rating: query.rating } : {}),
  };
  const [total, reviews] = await prisma.$transaction([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      include: {
        ...reviewInclude,
        product: { select: { id: true, title: true, slug: true } },
      },
      orderBy: reviewOrderBy(query.sort ?? "newest"),
      ...skipTake(pagination),
    }),
  ]);
  return {
    items: reviews.map((review) =>
      serializePublicReview(review, { verified: true, includeStatus: true }),
    ),
    pagination: paginationMeta(pagination.page, pagination.limit, total),
  };
}

export async function moderateReview(reviewId: string, status: ReviewStatus) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw notFound("Review not found");
  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: { status },
    include: {
      ...reviewInclude,
      product: { select: { id: true, title: true, slug: true } },
    },
  });
  return serializePublicReview(updated, { verified: true, includeStatus: true });
}

export async function listMyReviews(
  userId: string,
  query: { page?: number; limit?: number } = {},
) {
  const pagination = parsePagination(query.page, query.limit ?? 20);
  const where = { userId };
  const [total, reviews] = await prisma.$transaction([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      include: {
        ...reviewInclude,
        product: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      ...skipTake(pagination),
    }),
  ]);

  const productIds = [...new Set(reviews.map((review) => review.productId))];
  const purchases =
    productIds.length === 0
      ? []
      : await prisma.purchase.findMany({
          where: {
            userId,
            productId: { in: productIds },
            order: { status: "PAID" },
          },
          select: { productId: true },
        });
  const owned = new Set(purchases.map((row) => row.productId));

  return {
    items: reviews.map((review) =>
      serializePublicReview(review, {
        verified: owned.has(review.productId),
        includeStatus: true,
      }),
    ),
    pagination: paginationMeta(pagination.page, pagination.limit, total),
  };
}
