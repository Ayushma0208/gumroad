import type { Metadata } from "next";
import { ProtectedLayout } from "@/components/auth/protected-layout";

export const metadata: Metadata = {
  title: "Library",
};

export default function LibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
