import type { Review, ReviewReply, ReviewStatus, User } from "@prisma/client";

export type ReviewUser = Pick<User, "id" | "name" | "avatarUrl">;

export type ReviewRecord = Review & {
  user: ReviewUser;
  reply?:
    | (ReviewReply & {
        creator?: { storeName: string };
      })
    | null;
  product?: { id: string; title: string; slug: string };
};

export function serializePublicReview(
  review: ReviewRecord,
  options: { verified: boolean; includeStatus?: boolean } = { verified: true },
) {
  return {
    id: review.id,
    rating: review.rating,
    title: review.title,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
    ...(options.includeStatus ? { status: review.status as ReviewStatus } : {}),
    user: {
      name: review.user.name,
      avatar: review.user.avatarUrl,
    },
    verifiedPurchase: options.verified,
    reply: review.reply
      ? {
          comment: review.reply.comment,
          createdAt: review.reply.createdAt.toISOString(),
          creatorName: review.reply.creator?.storeName,
        }
      : null,
    product: review.product
      ? {
          id: review.product.id,
          title: review.product.title,
          slug: review.product.slug,
        }
      : undefined,
  };
}

export function emptyDistribution() {
  return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
}

export function serializeSummary(input: {
  average: number | null;
  total: number;
  counts: { rating: number; _count: number }[];
}) {
  const distribution = emptyDistribution();
  for (const row of input.counts) {
    if (row.rating >= 1 && row.rating <= 5) {
      distribution[row.rating as 1 | 2 | 3 | 4 | 5] = row._count;
    }
  }
  const averageRating =
    input.total === 0 || input.average == null
      ? 0
      : Math.round(input.average * 10) / 10;
  return { averageRating, totalReviews: input.total, distribution };
}
