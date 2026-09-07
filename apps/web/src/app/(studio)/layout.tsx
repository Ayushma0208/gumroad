import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/require-auth";
import { StudioShell } from "@/components/layout/studio-shell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth gate="creator">
      <StudioShell>{children}</StudioShell>
    </RequireAuth>
  );
}
