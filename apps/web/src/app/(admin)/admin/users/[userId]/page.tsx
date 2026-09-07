import type { Metadata } from "next";
import { AdminUserDetailExperience } from "@/components/admin/admin-user-detail-experience";

export const metadata: Metadata = {
  title: "User · Admin",
  robots: { index: false, follow: false },
};

export default function AdminUserDetailPage() {
  return <AdminUserDetailExperience />;
}
