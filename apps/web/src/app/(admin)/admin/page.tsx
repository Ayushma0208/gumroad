import type { Metadata } from "next";
import { AdminOverviewExperience } from "@/components/admin/admin-overview-experience";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminHomePage() {
  return <AdminOverviewExperience />;
}
