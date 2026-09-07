import type { Metadata } from "next";
import { AccountReviewsExperience } from "@/components/account/account-reviews-experience";

export const metadata: Metadata = {
  title: "Reviews · Account",
  robots: { index: false, follow: false },
};

export default function AccountReviewsPage() {
  return <AccountReviewsExperience />;
}
