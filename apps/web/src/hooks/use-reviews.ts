"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createReview,
  deleteReview,
  getCreatorReviews,
  getProductReviews,
  getReviewEligibility,
  getReviewSummary,
  replyToReview,
  updateReview,
  type ReviewInput,
  type ReviewSort,
} from "@/lib/api/reviews";

export const reviewKeys = {
  list: (productId: string, params: Record<string, unknown>) =>
    ["reviews", productId, "list", params] as const,
  summary: (productId: string) => ["reviews", productId, "summary"] as const,
  eligibility: (productId: string) => ["reviews", productId, "eligibility"] as const,
  creator: (params: Record<string, unknown>) => ["reviews", "creator", params] as const,
  admin: (params: Record<string, unknown>) => ["reviews", "admin", params] as const,
};

function invalidateProductReviews(
  queryClient: ReturnType<typeof useQueryClient>,
  productId?: string,
) {
  void queryClient.invalidateQueries({ queryKey: ["reviews"] });
  void queryClient.invalidateQueries({ queryKey: ["creator"] });
  if (productId) {
    void queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
  }
}

export function useProductReviews(
  productId: string,
  params: { sort?: ReviewSort; page?: number; limit?: number },
) {
  return useQuery({
    queryKey: reviewKeys.list(productId, params),
    queryFn: () => getProductReviews(productId, params),
    enabled: Boolean(productId),
  });
}

export function useReviewSummary(productId: string) {
  return useQuery({
    queryKey: reviewKeys.summary(productId),
    queryFn: () => getReviewSummary(productId),
    enabled: Boolean(productId),
  });
}

export function useReviewEligibility(productId: string, enabled = true) {
  return useQuery({
    queryKey: reviewKeys.eligibility(productId),
    queryFn: () => getReviewEligibility(productId),
    enabled: Boolean(productId) && enabled,
  });
}

export function useCreateReview(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ReviewInput) => createReview(productId, input),
    onSuccess: () => invalidateProductReviews(queryClient, productId),
  });
}

export function useUpdateReview(productId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { reviewId: string } & Partial<ReviewInput>) =>
      updateReview(input.reviewId, {
        rating: input.rating,
        title: input.title,
        comment: input.comment,
      }),
    onSuccess: () => invalidateProductReviews(queryClient, productId),
  });
}

export function useDeleteReview(productId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: string) => deleteReview(reviewId),
    onSuccess: () => invalidateProductReviews(queryClient, productId),
  });
}

export function useReplyToReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { reviewId: string; comment: string }) =>
      replyToReview(input.reviewId, input.comment),
    onSuccess: () => invalidateProductReviews(queryClient),
  });
}

export function useCreatorReviews(params: {
  rating?: number;
  sort?: "newest" | "oldest";
  page?: number;
}) {
  return useQuery({
    queryKey: reviewKeys.creator(params),
    queryFn: () => getCreatorReviews(params),
  });
}
