import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { CreatorAvatar } from "@/components/creator/creator-avatar";
import { StarRating } from "@/components/product/star-rating";
import { formatRelativeDate } from "@/lib/format";
import type { PublicReview } from "@/lib/api/reviews";

export function ReviewCard({
  review,
  actions,
}: {
  review: PublicReview;
  actions?: ReactNode;
}) {
  return (
    <article className="py-6">
      <div className="flex items-start gap-3">
        <CreatorAvatar src={review.user.avatar} name={review.user.name} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-sm font-medium">{review.user.name}</p>
            <StarRating value={review.rating} />
            <p className="text-xs text-muted-foreground">
              {formatRelativeDate(review.createdAt)}
            </p>
          </div>
          {review.verifiedPurchase ? (
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Check className="size-3.5" aria-hidden />
              Verified purchase
            </p>
          ) : null}
          {review.title ? (
            <h3 className="mt-3 text-[0.95rem] font-medium tracking-tight">{review.title}</h3>
          ) : null}
          <p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {review.comment}
          </p>
          {review.reply ? (
            <div className="mt-4 rounded-xl border border-border bg-muted/40 px-4 py-3">
              <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                {review.reply.creatorName ?? "Creator"}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                {review.reply.comment}
              </p>
            </div>
          ) : null}
          {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      </div>
    </article>
  );
}
