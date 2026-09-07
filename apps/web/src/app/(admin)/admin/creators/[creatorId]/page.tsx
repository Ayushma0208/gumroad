import type { Metadata } from "next";
import { AdminCreatorDetailExperience } from "@/components/admin/admin-creator-detail-experience";

export const metadata: Metadata = {
  title: "Creator · Admin",
  robots: { index: false, follow: false },
};

export default function AdminCreatorDetailPage() {
  return <AdminCreatorDetailExperience />;
}
