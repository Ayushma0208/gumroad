import type { Metadata } from "next";
import { AdminOrderDetailExperience } from "@/components/admin/admin-order-detail-experience";

export const metadata: Metadata = {
  title: "Order · Admin",
  robots: { index: false, follow: false },
};

export default function AdminOrderDetailPage() {
  return <AdminOrderDetailExperience />;
}
