"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AdminConfirmButton,
  AdminListPagination,
  AdminPage,
  AdminPageHeader,
} from "@/components/admin/admin-page";
import { ReviewCard } from "@/components/product/review-card";
import { StudioQueryError } from "@/components/studio/query-error";
import { TableSkeleton } from "@/components/studio/skeletons";
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
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.show);

  const query = useQuery({
    queryKey: reviewKeys.admin({ status, page }),
    queryFn: () => getAdminReviews({ status, page }),
  });

  const moderate = useMutation({
    mutationFn: (input: { id: string; status: "PUBLISHED" | "HIDDEN" }) =>
      moderateReview(input.id, input.status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reviews"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "audit"] });
    },
  });

  const remove = useMutation({
    mutationFn: adminDeleteReview,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reviews"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "audit"] });
    },
  });

  if (query.isPending) {
    return (
      <AdminPage>
        <AdminPageHeader
          title="Reviews"
          description="Hide or remove reviews that don’t belong on the marketplace."
        />
        <div className="mt-8">
          <TableSkeleton />
        </div>
      </AdminPage>
    );
  }

  if (query.isError || !query.data) {
    return (
      <AdminPage>
        <StudioQueryError onRetry={() => void query.refetch()} />
      </AdminPage>
    );
  }

  const { items, pagination } = query.data;

  return (
    <AdminPage>
      <AdminPageHeader
        title="Reviews"
        description="Hide or remove reviews that don’t belong on the marketplace. Actions are audited."
      />

      <div className="mt-8 flex flex-wrap gap-2">
        {([undefined, "PUBLISHED", "HIDDEN"] as const).map((value) => (
          <Button
            key={value ?? "all"}
            type="button"
            size="sm"
            variant={status === value ? "default" : "outline"}
            onClick={() => {
              setStatus(value);
              setPage(1);
            }}
          >
            {value ?? "All"}
          </Button>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="mt-12 text-center text-sm text-muted-foreground">
          No reviews in this filter.
        </p>
      ) : (
        <>
          <div className="mt-6 divide-y divide-border border-t border-border">
            {items.map((review) => (
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
                      <AdminConfirmButton
                        label={review.status === "HIDDEN" ? "Restore" : "Hide"}
                        confirmLabel={
                          review.status === "HIDDEN"
                            ? "Restore this review to published?"
                            : "Hide this review from the product page?"
                        }
                        disabled={moderate.isPending}
                        onConfirm={() => {
                          void moderate
                            .mutateAsync({
                              id: review.id,
                              status:
                                review.status === "HIDDEN" ? "PUBLISHED" : "HIDDEN",
                            })
                            .then(() =>
                              showToast({
                                title:
                                  review.status === "HIDDEN"
                                    ? "Review restored"
                                    : "Review hidden",
                              }),
                            )
                            .catch((error: Error) =>
                              showToast({ title: error.message || "Action failed" }),
                            );
                        }}
                      />
                      <AdminConfirmButton
                        label="Delete"
                        confirmLabel="Permanently delete this review? This cannot be undone."
                        variant="destructive"
                        disabled={remove.isPending}
                        onConfirm={() => {
                          void remove
                            .mutateAsync(review.id)
                            .then(() => showToast({ title: "Review deleted" }))
                            .catch((error: Error) =>
                              showToast({ title: error.message || "Action failed" }),
                            );
                        }}
                      />
                    </>
                  }
                />
              </div>
            ))}
          </div>

          <AdminListPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            hasNextPage={pagination.hasNextPage}
            hasPreviousPage={pagination.hasPreviousPage}
            onPrevious={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => p + 1)}
          />
        </>
      )}
    </AdminPage>
  );
}
