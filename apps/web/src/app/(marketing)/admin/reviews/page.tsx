import type { Metadata } from "next";
import { AdminReviewsExperience } from "@/components/admin/admin-reviews-experience";

export const metadata: Metadata = {
  title: "Review moderation",
};

export default function AdminReviewsPage() {
  return <AdminReviewsExperience />;
}
