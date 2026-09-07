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
import {
  useAdminProduct,
  useAdminProductStatusMutation,
} from "@/hooks/use-admin";
import { formatDate, formatPrice } from "@/lib/format";
import { useToastStore } from "@/stores/toast-store";

const STATUS_ACTIONS = [
  {
    status: "PUBLISHED" as const,
    label: "Publish",
    confirm: "Publish this product on the marketplace?",
  },
  {
    status: "DRAFT" as const,
    label: "Move to draft",
    confirm: "Unpublish this product and move it to draft?",
  },
  {
    status: "ARCHIVED" as const,
    label: "Archive",
    confirm: "Archive this product? It will no longer be available.",
  },
];

export function AdminProductDetailExperience() {
  const params = useParams<{ productId: string }>();
  const productId = params.productId;
  const query = useAdminProduct(productId);
  const statusMutation = useAdminProductStatusMutation();
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

  if (query.isError || !query.data?.product) {
    return (
      <AdminPage>
        <StudioQueryError onRetry={() => void query.refetch()} />
      </AdminPage>
    );
  }

  const product = query.data.product;

  return (
    <AdminPage>
      <AdminPageHeader
        title={product.title}
        description={`${product.creator.storeName} · ${product.status}`}
        actions={
          <>
            {STATUS_ACTIONS.filter((action) => action.status !== product.status).map(
              (action) => (
                <AdminConfirmButton
                  key={action.status}
                  label={action.label}
                  confirmLabel={action.confirm}
                  variant={action.status === "ARCHIVED" ? "destructive" : "outline"}
                  disabled={statusMutation.isPending}
                  onConfirm={() => {
                    void statusMutation
                      .mutateAsync({
                        productId: product.id,
                        status: action.status,
                      })
                      .then(() =>
                        showToast({ title: `Product set to ${action.status}` }),
                      )
                      .catch((error: Error) =>
                        showToast({ title: error.message || "Action failed" }),
                      );
                  }}
                />
              ),
            )}
          </>
        }
      />

      <p className="mt-4">
        <Link href="/admin/products" className="text-sm text-muted-foreground hover:underline">
          ← All products
        </Link>
      </p>

      <div className="mt-10 flex flex-col gap-8 sm:flex-row">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.coverImage}
          alt=""
          className="aspect-[4/3] w-full max-w-sm rounded-xl object-cover"
        />
        <dl className="grid flex-1 gap-6 sm:grid-cols-2">
          <DetailField
            label="Price"
            value={formatPrice(product.priceCents, product.currency)}
          />
          <DetailField label="Type" value={product.productType} />
          <DetailField label="Category" value={product.category.label} />
          <DetailField label="Sales" value={String(product.salesCount)} />
          <DetailField label="Created" value={formatDate(product.createdAt)} />
          <DetailField label="Updated" value={formatDate(product.updatedAt)} />
          <DetailField
            label="Creator"
            value={
              <Link
                href={`/admin/creators/${product.creator.id}`}
                className="hover:underline"
              >
                {product.creator.storeName}
              </Link>
            }
          />
          <DetailField label="Slug" value={product.slug} />
        </dl>
      </div>
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
