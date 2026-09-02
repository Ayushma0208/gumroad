import type { Metadata } from "next";
import { ProtectedLayout } from "@/components/auth/protected-layout";

export const metadata: Metadata = {
  title: "Admin",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedLayout gate="admin">{children}</ProtectedLayout>;
}
