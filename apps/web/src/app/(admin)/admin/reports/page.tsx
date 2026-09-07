import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminReportsExperience } from "@/components/admin/admin-reports-experience";
import { AdminPage } from "@/components/admin/admin-page";
import { TableSkeleton } from "@/components/studio/skeletons";

export const metadata: Metadata = {
  title: "Reports · Admin",
  robots: { index: false, follow: false },
};

export default function AdminReportsPage() {
  return (
    <Suspense
      fallback={
        <AdminPage>
          <TableSkeleton />
        </AdminPage>
      }
    >
      <AdminReportsExperience />
    </Suspense>
  );
}
