"use client";

import { useState } from "react";
import Link from "next/link";
import { ReviewCard } from "@/components/product/review-card";
import { StarRating } from "@/components/product/star-rating";
import { StudioPage } from "@/components/studio/studio-page";
import { StudioQueryError } from "@/components/studio/query-error";
import { Textarea } from "@/components/studio/textarea";
import { Button } from "@/components/ui/button";
import { useCreatorReviews, useReplyToReview } from "@/hooks/use-reviews";
import { productPath } from "@/lib/paths";
import { useToastStore } from "@/stores/toast-store";
import type { PublicReview } from "@/lib/api/reviews";

export function ReviewsExperience() {
  const [rating, setRating] = useState<number | undefined>();
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const query = useCreatorReviews({ rating, sort, page: 1 });

  if (query.isError) {
    return (
      <StudioPage>
        <StudioQueryError onRetry={() => void query.refetch()} />
      </StudioPage>
    );
  }

  const summary = query.data?.summary;

  return (
    <StudioPage>
      <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Reviews</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        What buyers wrote about your products.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border px-5 py-4">
          <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
            Average rating
          </p>
          <p className="mt-2 font-display text-4xl tracking-tight">
            {summary && summary.reviewCount > 0 ? summary.averageRating.toFixed(1) : "—"}
          </p>
          {summary && summary.reviewCount > 0 ? (
            <StarRating value={summary.averageRating} className="mt-2" size="md" />
          ) : null}
        </div>
        <div className="rounded-2xl border border-border px-5 py-4">
          <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
            Total reviews
          </p>
          <p className="mt-2 font-display text-4xl tracking-tight">
            {summary?.reviewCount ?? 0}
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {[undefined, 5, 4, 3, 2, 1].map((value) => (
          <Button
            key={value ?? "all"}
            type="button"
            size="sm"
            variant={rating === value ? "default" : "outline"}
            onClick={() => setRating(value)}
          >
            {value ? `${value} stars` : "All"}
          </Button>
        ))}
        <select
          className="h-7 rounded-lg border border-input bg-background px-2 text-[0.8rem]"
          value={sort}
          onChange={(event) => setSort(event.target.value as "newest" | "oldest")}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>

      <div className="mt-6 divide-y divide-border border-t border-border">
        {(query.data?.items ?? []).map((review) => (
          <CreatorReviewRow key={review.id} review={review} />
        ))}
      </div>
      {query.data && query.data.items.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No reviews yet.</p>
      ) : null}
    </StudioPage>
  );
}

function CreatorReviewRow({ review }: { review: PublicReview }) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState(review.reply?.comment ?? "");
  const reply = useReplyToReview();
  const showToast = useToastStore((state) => state.show);

  return (
    <div>
      {review.product ? (
        <Link
          href={productPath(review.product.slug)}
          className="mt-6 inline-block text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase hover:text-foreground"
        >
          {review.product.title}
        </Link>
      ) : null}
      <ReviewCard
        review={review}
        actions={
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen((value) => !value)}>
            {review.reply ? "Edit reply" : "Reply"}
          </Button>
        }
      />
      {open ? (
        <form
          className="mb-6 max-w-xl"
          onSubmit={(event) => {
            event.preventDefault();
            void reply.mutateAsync({ reviewId: review.id, comment }).then(() => {
              showToast({ title: "Reply published" });
              setOpen(false);
            });
          }}
        >
          <Textarea value={comment} onChange={(event) => setComment(event.target.value)} />
          <Button type="submit" className="mt-3 rounded-xl" disabled={reply.isPending || comment.trim().length < 2}>
            Save reply
          </Button>
        </form>
      ) : null}
    </div>
  );
}
