import type { Metadata } from "next";
import { AdminProductDetailExperience } from "@/components/admin/admin-product-detail-experience";

export const metadata: Metadata = {
  title: "Product · Admin",
  robots: { index: false, follow: false },
};

export default function AdminProductDetailPage() {
  return <AdminProductDetailExperience />;
}
