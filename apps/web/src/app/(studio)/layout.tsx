import { RequireAuth } from "@/components/auth/require-auth";
import { StudioShell } from "@/components/layout/studio-shell";

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
