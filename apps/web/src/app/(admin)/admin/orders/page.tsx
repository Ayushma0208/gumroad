import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminOrdersExperience } from "@/components/admin/admin-orders-experience";
import { AdminPage } from "@/components/admin/admin-page";
import { TableSkeleton } from "@/components/studio/skeletons";

export const metadata: Metadata = {
  title: "Orders · Admin",
  robots: { index: false, follow: false },
};

export default function AdminOrdersPage() {
  return (
    <Suspense
      fallback={
        <AdminPage>
          <TableSkeleton />
        </AdminPage>
      }
    >
      <AdminOrdersExperience />
    </Suspense>
  );
}
