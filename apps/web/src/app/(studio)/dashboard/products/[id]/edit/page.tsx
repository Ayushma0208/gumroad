"use client";

import { useParams } from "next/navigation";
import { EmptyState } from "@/components/layout/empty-state";
import { ProductEditor } from "@/components/studio/product-editor";
import { StudioQueryError } from "@/components/studio/query-error";
import { TableSkeleton } from "@/components/studio/skeletons";
import { StudioPage } from "@/components/studio/studio-page";
import { useAuth } from "@/hooks/use-auth";
import { useStudioProduct } from "@/hooks/use-studio";
import { Package } from "lucide-react";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const query = useStudioProduct(user?.id, params.id);

  if (query.isPending) {
    return (
      <StudioPage>
        <TableSkeleton rows={5} />
      </StudioPage>
    );
  }

  if (query.isError) {
    return (
      <StudioPage>
        <StudioQueryError onRetry={() => void query.refetch()} />
      </StudioPage>
    );
  }

  if (!query.data) {
    return (
      <StudioPage>
        <EmptyState
          full={false}
          icon={Package}
          title="Product not found"
          description="It may have been deleted, or it belongs to another store."
          actionHref="/dashboard/products"
          actionLabel="Back to products"
        />
      </StudioPage>
    );
  }

  return <ProductEditor mode="edit" product={query.data} />;
}
