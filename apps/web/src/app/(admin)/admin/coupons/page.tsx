import type { Metadata } from "next";
import { AdminCouponsExperience } from "@/components/admin/admin-coupons-experience";

export const metadata: Metadata = {
  title: "Coupons · Admin",
  robots: { index: false, follow: false },
};

export default function AdminCouponsPage() {
  return <AdminCouponsExperience />;
}
