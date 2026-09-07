import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminCreatorsExperience } from "@/components/admin/admin-creators-experience";
import { AdminPage } from "@/components/admin/admin-page";
import { TableSkeleton } from "@/components/studio/skeletons";

export const metadata: Metadata = {
  title: "Creators · Admin",
  robots: { index: false, follow: false },
};

export default function AdminCreatorsPage() {
  return (
    <Suspense
      fallback={
        <AdminPage>
          <TableSkeleton />
        </AdminPage>
      }
    >
      <AdminCreatorsExperience />
    </Suspense>
  );
}
