"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuthHydrated } from "@/hooks/use-auth-hydrated";
import { useAuthStore } from "@/stores/auth-store";
import { homeForRole, isCreatorRole } from "@/types/auth";

export function RequireAuth({
  children,
  creatorOnly = false,
}: {
  children: ReactNode;
  creatorOnly?: boolean;
}) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthHydrated();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.replace(creatorOnly ? "/signup?as=creator" : "/login");
      return;
    }
    if (creatorOnly && !isCreatorRole(user.role)) {
      router.replace(homeForRole(user.role));
    }
  }, [creatorOnly, hasHydrated, router, user]);

  if (!hasHydrated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        Loading your workspace…
      </div>
    );
  }

  if (!user || (creatorOnly && !isCreatorRole(user.role))) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        Taking you to the right place…
      </div>
    );
  }

  return children;
}
