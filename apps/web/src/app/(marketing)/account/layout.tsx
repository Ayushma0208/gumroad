import type { Metadata } from "next";
import { ProtectedLayout } from "@/components/auth/protected-layout";
import { AccountShell } from "@/components/account/account-shell";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedLayout gate="user">
      <AccountShell>{children}</AccountShell>
    </ProtectedLayout>
  );
}
