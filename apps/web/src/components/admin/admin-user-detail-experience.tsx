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
import { useAdminUser, useAdminUserStatusMutation } from "@/hooks/use-admin";
import { formatDate } from "@/lib/format";
import { useToastStore } from "@/stores/toast-store";

export function AdminUserDetailExperience() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId;
  const query = useAdminUser(userId);
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

  if (query.isError || !query.data?.user) {
    return (
      <AdminPage>
        <StudioQueryError onRetry={() => void query.refetch()} />
      </AdminPage>
    );
  }

  const user = query.data.user;
  const suspended = user.status === "SUSPENDED";

  return (
    <AdminPage>
      <AdminPageHeader
        title={user.name}
        description={user.email}
        actions={
          <AdminConfirmButton
            label={suspended ? "Restore" : "Suspend"}
            confirmLabel={
              suspended
                ? "Restore this user’s access?"
                : "Are you sure? This will prevent the user from accessing their account."
            }
            variant={suspended ? "outline" : "destructive"}
            disabled={statusMutation.isPending || user.role === "ADMIN"}
            onConfirm={() => {
              void statusMutation
                .mutateAsync({
                  userId: user.id,
                  status: suspended ? "ACTIVE" : "SUSPENDED",
                })
                .then(() =>
                  showToast({
                    title: suspended ? "User restored" : "User suspended",
                  }),
                )
                .catch((error: Error) =>
                  showToast({ title: error.message || "Action failed" }),
                );
            }}
          />
        }
      />

      <p className="mt-4">
        <Link href="/admin/users" className="text-sm text-muted-foreground hover:underline">
          ← All users
        </Link>
      </p>

      <dl className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <DetailField label="Role" value={user.role} />
        <DetailField label="Status" value={user.status} />
        <DetailField label="Joined" value={formatDate(user.createdAt)} />
        <DetailField label="Orders" value={String(user.orderCount)} />
        <DetailField label="Purchases" value={String(user.purchaseCount)} />
        {user.reviewCount != null ? (
          <DetailField label="Reviews" value={String(user.reviewCount)} />
        ) : null}
        {user.creatorProfile ? (
          <DetailField
            label="Creator store"
            value={
              <Link
                href={`/admin/creators/${user.creatorProfile.id}`}
                className="hover:underline"
              >
                {user.creatorProfile.storeName}
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
