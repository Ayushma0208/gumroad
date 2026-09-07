"use client";

import Link from "next/link";
import { useState } from "react";
import { ReviewCard } from "@/components/product/review-card";
import { ReviewForm } from "@/components/product/review-form";
import { StarRating } from "@/components/product/star-rating";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import {
  useCreateReview,
  useDeleteReview,
  useProductReviews,
  useReviewEligibility,
  useReviewSummary,
  useUpdateReview,
} from "@/hooks/use-reviews";
import { loginPath } from "@/lib/auth/paths";
import { formatCompactNumber } from "@/lib/format";
import { productPath } from "@/lib/paths";
import { useToastStore } from "@/stores/toast-store";
import type { PublicReview, ReviewSort } from "@/lib/api/reviews";
import type { ReviewFormValues } from "@/lib/reviews/schema";

export function ProductReviewsSection({
  productId,
  productSlug,
}: {
  productId: string;
  productSlug: string;
}) {
  const [sort, setSort] = useState<ReviewSort>("newest");
  const [page, setPage] = useState(1);
  const summary = useReviewSummary(productId);
  const list = useProductReviews(productId, { sort, page, limit: 8 });
  const eligibility = useReviewEligibility(productId);
  const { isAuthenticated } = useAuth();

  return (
    <section>
      <p className="text-xs font-medium tracking-[0.16em] text-brand uppercase">
        Reviews
      </p>
      <h2 className="mt-2 font-display text-3xl tracking-tight">
        Customer reviews
      </h2>

      {summary.isError || list.isError ? (
        <div className="mt-8 rounded-xl border border-border px-5 py-8">
          <p className="font-medium">Couldn’t load reviews.</p>
          <p className="mt-1 text-sm text-muted-foreground">Please try again.</p>
          <Button
            className="mt-4 rounded-xl"
            variant="outline"
            onClick={() => {
              void summary.refetch();
              void list.refetch();
            }}
          >
            Retry
          </Button>
        </div>
      ) : (
        <>
          {summary.isPending ? (
            <ReviewSummarySkeleton />
          ) : summary.data && summary.data.totalReviews > 0 ? (
            <ReviewSummaryBlock data={summary.data} />
          ) : null}

          <WriteReviewPanel
            productId={productId}
            productSlug={productSlug}
            isAuthenticated={isAuthenticated}
            eligibility={eligibility.data}
            isPending={eligibility.isPending}
          />

          {list.isPending ? (
            <ReviewListSkeleton />
          ) : list.data && list.data.items.length > 0 ? (
            <>
              <div className="mt-10 flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  {formatCompactNumber(list.data.pagination.total)}{" "}
                  {list.data.pagination.total === 1 ? "review" : "reviews"}
                </p>
                <label className="text-sm text-muted-foreground">
                  <span className="sr-only">Sort reviews</span>
                  <select
                    className="h-10 rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    value={sort}
                    onChange={(event) => {
                      setSort(event.target.value as ReviewSort);
                      setPage(1);
                    }}
                  >
                    <option value="newest">Most recent</option>
                    <option value="highest">Highest rating</option>
                    <option value="lowest">Lowest rating</option>
                  </select>
                </label>
              </div>
              <ul className="mt-2 divide-y divide-border border-t border-border">
                {list.data.items.map((review) => (
                  <li key={review.id}>
                    <ReviewCard review={review} />
                  </li>
                ))}
              </ul>
              {list.data.pagination.hasNextPage || list.data.pagination.hasPreviousPage ? (
                <div className="mt-6 flex justify-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    disabled={!list.data.pagination.hasPreviousPage}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    disabled={!list.data.pagination.hasNextPage}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Next
                  </Button>
                </div>
              ) : null}
            </>
          ) : (
            <p className="mt-10 max-w-md text-sm leading-relaxed text-muted-foreground">
              No reviews yet. Be the first customer to share your experience.
            </p>
          )}
        </>
      )}
    </section>
  );
}

function ReviewSummaryBlock({
  data,
}: {
  data: { averageRating: number; totalReviews: number; distribution: Record<1 | 2 | 3 | 4 | 5, number> };
}) {
  const max = Math.max(1, ...Object.values(data.distribution));
  return (
    <div className="mt-8 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="font-display text-5xl tracking-tight">{data.averageRating.toFixed(1)}</p>
        <StarRating value={data.averageRating} size="md" className="mt-2" />
        <p className="mt-2 text-sm text-muted-foreground">
          {formatCompactNumber(data.totalReviews)} reviews
        </p>
      </div>
      <ul className="w-full max-w-sm space-y-1.5">
        {([5, 4, 3, 2, 1] as const).map((stars) => {
          const count = data.distribution[stars];
          const percent = Math.round((count / max) * 100);
          return (
            <li key={stars} className="flex items-center gap-3 text-xs">
              <span className="w-6 tabular-nums text-muted-foreground">{stars}★</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-foreground"
                  style={{ width: `${percent}%` }}
                />
              </span>
              <span className="w-8 text-right tabular-nums text-muted-foreground">{count}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function WriteReviewPanel({
  productId,
  productSlug,
  isAuthenticated,
  eligibility,
  isPending,
}: {
  productId: string;
  productSlug: string;
  isAuthenticated: boolean;
  isPending: boolean;
  eligibility?: {
    canReview: boolean;
    reason: string;
    review: PublicReview | null;
  };
}) {
  const [mode, setMode] = useState<"idle" | "write" | "edit" | "confirm">("idle");
  const create = useCreateReview(productId);
  const update = useUpdateReview(productId);
  const remove = useDeleteReview(productId);
  const showToast = useToastStore((state) => state.show);
  const next = productPath(productSlug);

  async function submitNew(values: ReviewFormValues) {
    await create.mutateAsync(values);
    showToast({ title: "Review published" });
    setMode("idle");
  }

  async function submitEdit(values: ReviewFormValues) {
    if (!eligibility?.review) return;
    await update.mutateAsync({ reviewId: eligibility.review.id, ...values });
    showToast({ title: "Review updated" });
    setMode("idle");
  }

  if (isPending) {
    return <Skeleton className="mt-10 h-24 rounded-xl" />;
  }

  if (!isAuthenticated || eligibility?.reason === "unauthenticated") {
    return (
      <p className="mt-10 text-sm text-muted-foreground">
        Bought this?{" "}
        <Link href={loginPath(next)} className="text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>{" "}
        to leave a review.
      </p>
    );
  }

  if (eligibility?.reason === "not_purchased") {
    return (
      <p className="mt-10 text-sm text-muted-foreground">
        Purchase this product to leave a review.
      </p>
    );
  }

  if (eligibility?.reason === "own_product") {
    return null;
  }

  if (eligibility?.review && mode !== "edit" && mode !== "confirm") {
    return (
      <div className="mt-10 rounded-2xl border border-border px-5 py-5">
        <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
          Your review
        </p>
        <ReviewCard
          review={eligibility.review}
          actions={
            <>
              <Button type="button" variant="outline" size="sm" onClick={() => setMode("edit")}>
                Edit review
              </Button>
              <Button type="button" variant="destructive" size="sm" onClick={() => setMode("confirm")}>
                Delete
              </Button>
            </>
          }
        />
      </div>
    );
  }

  if (eligibility?.review && mode === "confirm") {
    return (
      <div className="mt-10 rounded-2xl border border-destructive/30 px-5 py-5">
        <p className="font-medium">Delete review?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          This review will be permanently removed.
        </p>
        <div className="mt-4 flex gap-2">
          <Button type="button" variant="outline" onClick={() => setMode("idle")}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={remove.isPending}
            onClick={() =>
              void remove.mutateAsync(eligibility.review!.id).then(() => {
                showToast({ title: "Review deleted" });
                setMode("idle");
              })
            }
          >
            Delete review
          </Button>
        </div>
      </div>
    );
  }

  if (eligibility?.canReview || mode === "edit") {
    if (mode === "idle" && eligibility?.canReview) {
      return (
        <div className="mt-10">
          <Button type="button" className="rounded-xl" onClick={() => setMode("write")}>
            {eligibility.canReview ? "Write a review" : "Edit review"}
          </Button>
        </div>
      );
    }
    return (
      <div className="mt-10 rounded-2xl border border-border px-5 py-6">
        <ReviewForm
          defaultValues={
            mode === "edit" && eligibility?.review
              ? {
                  rating: eligibility.review.rating,
                  title: eligibility.review.title,
                  comment: eligibility.review.comment,
                }
              : undefined
          }
          submitLabel={mode === "edit" ? "Save review" : "Submit review"}
          onSubmit={mode === "edit" ? submitEdit : submitNew}
          onCancel={() => setMode("idle")}
        />
      </div>
    );
  }

  return null;
}

function ReviewSummarySkeleton() {
  return (
    <div className="mt-8 flex flex-col gap-6 sm:flex-row">
      <div>
        <Skeleton className="h-12 w-20" />
        <Skeleton className="mt-3 h-4 w-28" />
      </div>
      <div className="w-full max-w-sm space-y-2">
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-2 w-4/5" />
        <Skeleton className="h-2 w-2/5" />
      </div>
    </div>
  );
}

function ReviewListSkeleton() {
  return (
    <div className="mt-10 space-y-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
