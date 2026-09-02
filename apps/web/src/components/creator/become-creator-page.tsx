"use client";

import { RequireAuth } from "@/components/auth/require-auth";
import { BecomeCreatorFlow } from "@/components/creator/become-creator-flow";
import { useAuth } from "@/hooks/use-auth";

export function BecomeCreatorPage() {
  const { user } = useAuth();

  return (
    <RequireAuth>
      {user ? <BecomeCreatorFlow user={user} /> : null}
    </RequireAuth>
  );
}
