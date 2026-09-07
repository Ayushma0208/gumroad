import type { Metadata } from "next";
import { AdminReviewsExperience } from "@/components/admin/admin-reviews-experience";

export const metadata: Metadata = {
  title: "Reviews · Admin",
  robots: { index: false, follow: false },
};

export default function AdminReviewsPage() {
  return <AdminReviewsExperience />;
}
