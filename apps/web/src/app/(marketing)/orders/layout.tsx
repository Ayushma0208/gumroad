import type { Metadata } from "next";
import { ProtectedLayout } from "@/components/auth/protected-layout";

export const metadata: Metadata = {
  title: "Orders",
};

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
