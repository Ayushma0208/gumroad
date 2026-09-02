"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import {
  AuthAccessDenied,
  AuthSessionError,
} from "@/components/auth/auth-access-denied";
import { AuthScreenSkeleton } from "@/components/auth/auth-screen-skeleton";
import { useAuth } from "@/hooks/use-auth";
import { loginPath } from "@/lib/auth/paths";
import { isAdminRole, isCreatorRole } from "@/types/auth";

type Gate = "user" | "creator" | "admin";

export function RequireAuth({
  children,
  gate = "user",
}: {
  children: ReactNode;
  gate?: Gate;
}) {
  const router = useRouter();
  const { user, isLoading, isError, refetch } = useAuth();

  useEffect(() => {
    if (isLoading || isError) return;
    if (!user) {
      const next =
        typeof window === "undefined"
          ? "/"
          : `${window.location.pathname}${window.location.search}`;
      router.replace(loginPath(next));
    }
  }, [isError, isLoading, router, user]);

  if (isLoading) {
    return <AuthScreenSkeleton />;
  }

  if (isError) {
    return <AuthSessionError onRetry={() => void refetch()} />;
  }

  if (!user) {
    return <AuthScreenSkeleton />;
  }

  if (gate === "admin" && !isAdminRole(user.role)) {
    return (
      <AuthAccessDenied
        title="This room is locked."
        description="Admin tools are only available to Lumen operators."
        actionHref="/"
        actionLabel="Back to Lumen"
      />
    );
  }

  if (gate === "creator" && !isCreatorRole(user.role)) {
    return (
      <AuthAccessDenied
        title="This is a creator workspace."
        description="Open a store to publish products, see sales, and run your shop."
        actionHref="/become-a-creator"
        actionLabel="Become a creator"
      />
    );
  }

  return children;
}
