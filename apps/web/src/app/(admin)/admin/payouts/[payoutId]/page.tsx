import type { Metadata } from "next";
import { AdminPayoutDetailExperience } from "@/components/admin/admin-payout-detail-experience";

export const metadata: Metadata = {
  title: "Payout · Admin",
  robots: { index: false, follow: false },
};

export default function AdminPayoutDetailPage() {
  return <AdminPayoutDetailExperience />;
}
