import type { Metadata } from "next";
import { ProtectedLayout } from "@/components/auth/protected-layout";

export const metadata: Metadata = {
  title: "Profile",
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
