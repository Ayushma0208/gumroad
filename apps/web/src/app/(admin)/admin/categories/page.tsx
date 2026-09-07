import type { Metadata } from "next";
import { AdminCategoriesExperience } from "@/components/admin/admin-categories-experience";

export const metadata: Metadata = {
  title: "Categories · Admin",
  robots: { index: false, follow: false },
};

export default function AdminCategoriesPage() {
  return <AdminCategoriesExperience />;
}
