"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import {
  AdminConfirmButton,
  AdminPage,
  AdminPageHeader,
} from "@/components/admin/admin-page";
import { StudioQueryError } from "@/components/studio/query-error";
import { TableSkeleton } from "@/components/studio/skeletons";
import { useAdminCreator, useAdminUserStatusMutation } from "@/hooks/use-admin";
import { formatCompactNumber, formatDate, formatPrice } from "@/lib/format";
import { useToastStore } from "@/stores/toast-store";

export function AdminCreatorDetailExperience() {
  const params = useParams<{ creatorId: string }>();
  const creatorId = params.creatorId;
  const query = useAdminCreator(creatorId);
  const statusMutation = useAdminUserStatusMutation();
  const showToast = useToastStore((state) => state.show);

  if (query.isPending) {
    return (
      <AdminPage>
        <div className="mt-2">
          <TableSkeleton />
        </div>
      </AdminPage>
    );
  }

  if (query.isError || !query.data?.creator) {
    return (
      <AdminPage>
        <StudioQueryError onRetry={() => void query.refetch()} />
      </AdminPage>
    );
  }

  const creator = query.data.creator;
  const userId = String(creator.userId ?? (creator.user as { id?: string } | undefined)?.id ?? "");
  const suspended = creator.status === "SUSPENDED";
  const revenueCents = Number(creator.revenueCents ?? 0);
  const salesCount = Number(creator.salesCount ?? 0);

  return (
    <AdminPage>
      <AdminPageHeader
        title={creator.storeName}
        description={creator.email}
        actions={
          userId ? (
            <AdminConfirmButton
              label={suspended ? "Restore" : "Suspend"}
              confirmLabel={
                suspended
                  ? "Restore this creator’s account access?"
                  : "Are you sure? This will prevent the user from accessing their account."
              }
              variant={suspended ? "outline" : "destructive"}
              disabled={statusMutation.isPending}
              onConfirm={() => {
                void statusMutation
                  .mutateAsync({
                    userId,
                    status: suspended ? "ACTIVE" : "SUSPENDED",
                  })
                  .then(() => {
                    void query.refetch();
                    showToast({
                      title: suspended ? "Creator restored" : "Creator suspended",
                    });
                  })
                  .catch((error: Error) =>
                    showToast({ title: error.message || "Action failed" }),
                  );
              }}
            />
          ) : null
        }
      />

      <p className="mt-4">
        <Link href="/admin/creators" className="text-sm text-muted-foreground hover:underline">
          ← All creators
        </Link>
      </p>

      <dl className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <DetailField label="Display name" value={creator.displayName} />
        <DetailField label="Slug" value={creator.slug} />
        <DetailField label="Status" value={creator.status} />
        <DetailField label="Joined" value={formatDate(creator.joinedAt)} />
        <DetailField label="Products" value={String(creator.productCount)} />
        <DetailField
          label="Published"
          value={String(creator.publishedProductCount)}
        />
        <DetailField label="Revenue" value={formatPrice(revenueCents)} />
        <DetailField label="Sales" value={formatCompactNumber(salesCount)} />
        {userId ? (
          <DetailField
            label="User"
            value={
              <Link href={`/admin/users/${userId}`} className="hover:underline">
                View account
              </Link>
            }
          />
        ) : null}
      </dl>
    </AdminPage>
  );
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}
