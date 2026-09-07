"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { ReviewCard } from "@/components/product/review-card";
import { Button } from "@/components/ui/button";
import { reviewKeys } from "@/hooks/use-reviews";
import {
  adminDeleteReview,
  getAdminReviews,
  moderateReview,
} from "@/lib/api/reviews";
import { useToastStore } from "@/stores/toast-store";

export function AdminReviewsExperience() {
  const [status, setStatus] = useState<"PUBLISHED" | "HIDDEN" | undefined>();
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.show);
  const query = useQuery({
    queryKey: reviewKeys.admin({ status }),
    queryFn: () => getAdminReviews({ status }),
  });
  const hide = useMutation({
    mutationFn: (input: { id: string; status: "PUBLISHED" | "HIDDEN" }) =>
      moderateReview(input.id, input.status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
  const remove = useMutation({
    mutationFn: adminDeleteReview,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });

  return (
    <Container className="py-8 sm:py-12">
      <PageHeader
        eyebrow="Operators"
        title="Reviews"
        description="Hide or remove reviews that don’t belong on the marketplace."
      />
      <div className="mt-8 flex flex-wrap gap-2">
        {([undefined, "PUBLISHED", "HIDDEN"] as const).map((value) => (
          <Button
            key={value ?? "all"}
            type="button"
            size="sm"
            variant={status === value ? "default" : "outline"}
            onClick={() => setStatus(value)}
          >
            {value ?? "All"}
          </Button>
        ))}
      </div>
      <div className="mt-6 divide-y divide-border border-t border-border">
        {(query.data?.items ?? []).map((review) => (
          <div key={review.id}>
            {review.product ? (
              <p className="mt-6 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                {review.product.title}
                {review.status ? ` · ${review.status}` : ""}
              </p>
            ) : null}
            <ReviewCard
              review={review}
              actions={
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      void hide
                        .mutateAsync({
                          id: review.id,
                          status: review.status === "HIDDEN" ? "PUBLISHED" : "HIDDEN",
                        })
                        .then(() =>
                          showToast({
                            title: review.status === "HIDDEN" ? "Review published" : "Review hidden",
                          }),
                        )
                    }
                  >
                    {review.status === "HIDDEN" ? "Unhide" : "Hide"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() =>
                      void remove.mutateAsync(review.id).then(() =>
                        showToast({ title: "Review deleted" }),
                      )
                    }
                  >
                    Delete
                  </Button>
                </>
              }
            />
          </div>
        ))}
      </div>
    </Container>
  );
}
