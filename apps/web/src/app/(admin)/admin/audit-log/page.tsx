import type { Metadata } from "next";
import { AdminAuditExperience } from "@/components/admin/admin-audit-experience";

export const metadata: Metadata = {
  title: "Audit log · Admin",
  robots: { index: false, follow: false },
};

export default function AdminAuditLogPage() {
  return <AdminAuditExperience />;
}
