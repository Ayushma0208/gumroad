"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMyReviews } from "@/hooks/use-account";
import { formatRelativeDate } from "@/lib/format";
import { productPath } from "@/lib/paths";
import { useState } from "react";

export function AccountReviewsExperience() {
  const [page, setPage] = useState(1);
  const query = useMyReviews(page);
  const items = query.data?.items ?? [];
  const meta = query.data?.pagination;

  return (
    <div>
      <h1 className="font-display text-3xl tracking-tight">Your reviews</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Reviews you’ve left on products you purchased.
      </p>

      {query.isPending ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading reviews…</p>
      ) : query.isError ? (
        <div className="mt-8">
          <p className="text-sm font-medium">Unable to load reviews</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => void query.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border px-4 py-12 text-center">
          <p className="font-medium">You haven’t reviewed any products yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            After a purchase, open the product page to leave a review.
          </p>
          <Link href="/library" className="mt-4 inline-flex text-sm font-medium hover:underline">
            Go to library
          </Link>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-border border-t border-border">
          {items.map((review) => (
            <li key={review.id} className="py-5">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-1 font-medium">
                  <Star className="size-3.5 fill-current" />
                  {review.rating}
                </span>
                {review.verifiedPurchase ? (
                  <span className="text-xs text-muted-foreground">Verified purchase</span>
                ) : null}
                <span className="text-xs text-muted-foreground">
                  {formatRelativeDate(review.createdAt)}
                </span>
              </div>
              {review.product ? (
                <Link
                  href={productPath(review.product.slug)}
                  className="mt-1 block text-sm font-medium hover:text-brand"
                >
                  {review.product.title}
                </Link>
              ) : null}
              <p className="mt-1 text-sm font-medium">{review.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p>
            </li>
          ))}
        </ul>
      )}

      {meta && meta.totalPages > 1 ? (
        <div className="mt-8 flex gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={!meta.hasPreviousPage}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!meta.hasNextPage}
            onClick={() => setPage((value) => value + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
