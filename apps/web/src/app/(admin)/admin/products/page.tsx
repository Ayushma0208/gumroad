import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminProductsExperience } from "@/components/admin/admin-products-experience";
import { AdminPage } from "@/components/admin/admin-page";
import { TableSkeleton } from "@/components/studio/skeletons";

export const metadata: Metadata = {
  title: "Products · Admin",
  robots: { index: false, follow: false },
};

export default function AdminProductsPage() {
  return (
    <Suspense
      fallback={
        <AdminPage>
          <TableSkeleton />
        </AdminPage>
      }
    >
      <AdminProductsExperience />
    </Suspense>
  );
}
