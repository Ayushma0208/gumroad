"use client";

import { EmptyState } from "@/components/layout/empty-state";
import { RequireAuth } from "@/components/auth/require-auth";
import { useAuthStore } from "@/stores/auth-store";

export default function LibraryPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <RequireAuth>
      <EmptyState
        title={user ? `${user.name.split(" ")[0]}’s library` : "Your library"}
        description="Purchased files will live here after checkout. For now, browse the marketplace."
        actionHref="/discover"
        actionLabel="Discover products"
      />
    </RequireAuth>
  );
}
