import { requestJson } from "@/lib/api/http";
import type { PaginationMeta } from "@/types/catalog";

export type ReviewUser = {
  name: string;
  avatar: string | null;
};

export type PublicReview = {
  id: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
  status?: "PUBLISHED" | "HIDDEN";
  user: ReviewUser;
  verifiedPurchase: boolean;
  reply?: {
    comment: string;
    createdAt: string;
    creatorName?: string;
  } | null;
  product?: {
    id: string;
    title: string;
    slug: string;
  };
};

export type ReviewSummary = {
  averageRating: number;
  totalReviews: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
};

export type ReviewEligibility = {
  canReview: boolean;
  reason: "unauthenticated" | "own_product" | "not_purchased" | "already_reviewed" | "eligible";
  review: PublicReview | null;
};

export type ReviewSort = "newest" | "oldest" | "highest" | "lowest";

export type ReviewInput = {
  rating: number;
  title: string;
  comment: string;
};

export function getProductReviews(
  productId: string,
  params: { sort?: ReviewSort; page?: number; limit?: number } = {},
) {
  const query = new URLSearchParams();
  if (params.sort) query.set("sort", params.sort);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  const suffix = query.size ? `?${query.toString()}` : "";
  return requestJson<{ items: PublicReview[]; pagination: PaginationMeta }>(
    `/api/v1/products/${encodeURIComponent(productId)}/reviews${suffix}`,
  );
}

export function getReviewSummary(productId: string) {
  return requestJson<ReviewSummary>(
    `/api/v1/products/${encodeURIComponent(productId)}/reviews/summary`,
  );
}

export function getReviewEligibility(productId: string) {
  return requestJson<ReviewEligibility>(
    `/api/v1/products/${encodeURIComponent(productId)}/reviews/eligibility`,
  );
}

export function createReview(productId: string, input: ReviewInput) {
  return requestJson<{ review: PublicReview }>(
    `/api/v1/products/${encodeURIComponent(productId)}/reviews`,
    { method: "POST", body: input },
  );
}

export function updateReview(reviewId: string, input: Partial<ReviewInput>) {
  return requestJson<{ review: PublicReview }>(
    `/api/v1/reviews/${encodeURIComponent(reviewId)}`,
    { method: "PATCH", body: input },
  );
}

export function deleteReview(reviewId: string) {
  return requestJson<{ ok: true }>(`/api/v1/reviews/${encodeURIComponent(reviewId)}`, {
    method: "DELETE",
  });
}

export function replyToReview(reviewId: string, comment: string) {
  return requestJson<{ reply: NonNullable<PublicReview["reply"]> }>(
    `/api/v1/reviews/${encodeURIComponent(reviewId)}/reply`,
    { method: "POST", body: { comment } },
  );
}

export function getCreatorReviews(params: {
  rating?: number;
  sort?: "newest" | "oldest";
  page?: number;
} = {}) {
  const query = new URLSearchParams();
  if (params.rating) query.set("rating", String(params.rating));
  if (params.sort) query.set("sort", params.sort);
  if (params.page) query.set("page", String(params.page));
  const suffix = query.size ? `?${query.toString()}` : "";
  return requestJson<{
    summary: { averageRating: number; reviewCount: number };
    items: PublicReview[];
    pagination: PaginationMeta;
  }>(`/api/v1/creators/me/reviews${suffix}`);
}

export function getAdminReviews(params: {
  status?: "PUBLISHED" | "HIDDEN";
  rating?: number;
  page?: number;
} = {}) {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.rating) query.set("rating", String(params.rating));
  if (params.page) query.set("page", String(params.page));
  const suffix = query.size ? `?${query.toString()}` : "";
  return requestJson<{ items: PublicReview[]; pagination: PaginationMeta }>(
    `/api/v1/admin/reviews${suffix}`,
  );
}

export function moderateReview(reviewId: string, status: "PUBLISHED" | "HIDDEN") {
  return requestJson<{ review: PublicReview }>(
    `/api/v1/admin/reviews/${encodeURIComponent(reviewId)}`,
    { method: "PATCH", body: { status } },
  );
}

export function adminDeleteReview(reviewId: string) {
  return requestJson<{ ok: true }>(
    `/api/v1/admin/reviews/${encodeURIComponent(reviewId)}`,
    { method: "DELETE" },
  );
}
