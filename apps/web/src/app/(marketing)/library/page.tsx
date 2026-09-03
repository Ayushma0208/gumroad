"use client";

import { Library } from "lucide-react";
import { EmptyState } from "@/components/layout/empty-state";
import { useAuth } from "@/hooks/use-auth";

export default function LibraryPage() {
  const { user } = useAuth();
  const firstName = user?.name.split(" ")[0];

  return (
    <EmptyState
      icon={Library}
      title={firstName ? `${firstName}’s library` : "Your library"}
      description="Purchased files will live here after checkout. For now, browse the marketplace."
      actionHref="/discover"
      actionLabel="Discover products"
    />
  );
}
