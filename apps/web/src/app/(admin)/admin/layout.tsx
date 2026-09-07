import type { Metadata } from "next";
import { ProtectedLayout } from "@/components/auth/protected-layout";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedLayout gate="admin">
      <AdminShell>{children}</AdminShell>
    </ProtectedLayout>
  );
}
