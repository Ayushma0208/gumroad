import type { Metadata } from "next";
import { ReviewsExperience } from "@/components/studio/reviews-experience";

export const metadata: Metadata = {
  title: "Reviews",
};

export default function DashboardReviewsPage() {
  return <ReviewsExperience />;
}
