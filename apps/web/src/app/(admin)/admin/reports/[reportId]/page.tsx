import type { Metadata } from "next";
import { AdminReportDetailExperience } from "@/components/admin/admin-report-detail-experience";

export const metadata: Metadata = {
  title: "Report · Admin",
  robots: { index: false, follow: false },
};

export default function AdminReportDetailPage() {
  return <AdminReportDetailExperience />;
}
