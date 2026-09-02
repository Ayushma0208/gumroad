"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { AuthScreenSkeleton } from "@/components/auth/auth-screen-skeleton";
import { useAuth } from "@/hooks/use-auth";
import { safeNextPath } from "@/lib/auth/paths";
import { homeForRole } from "@/types/auth";

export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();
  const next = safeNextPath(searchParams.get("next"), "");

  useEffect(() => {
    if (isLoading || !user) return;
    router.replace(next || homeForRole(user.role));
  }, [isLoading, next, router, user]);

  if (isLoading || user) {
    return <AuthScreenSkeleton />;
  }

  return children;
}
