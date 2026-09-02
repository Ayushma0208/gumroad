"use client";

import Link from "next/link";
import { Container } from "@/components/layout/container";
import { UserAvatar } from "@/components/auth/user-avatar";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { isCreatorRole, roleLabel } from "@/types/auth";

export function ProfileView() {
  const { user } = useAuth();
  if (!user) return null;

  const creator = isCreatorRole(user.role);

  return (
    <Container className="py-12 sm:py-16">
      <p className="text-xs font-medium tracking-[0.18em] text-brand uppercase">
        Account
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight">Profile</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        One account. Buying now, selling when you are ready.
      </p>

      <div className="mt-10 max-w-lg rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <UserAvatar user={user} size="md" />
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between gap-4 border-t border-border pt-3">
            <dt className="text-muted-foreground">Role</dt>
            <dd>{roleLabel(user.role)}</dd>
          </div>
          {user.creatorProfile ? (
            <>
              <div className="flex justify-between gap-4 border-t border-border pt-3">
                <dt className="text-muted-foreground">Store</dt>
                <dd>{user.creatorProfile.storeName}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-border pt-3">
                <dt className="text-muted-foreground">URL</dt>
                <dd className="font-mono text-xs">
                  lumen.app/{user.creatorProfile.slug}
                </dd>
              </div>
            </>
          ) : null}
        </dl>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {creator ? (
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ size: "lg" }), "rounded-xl")}
          >
            Creator dashboard
          </Link>
        ) : (
          <Link
            href="/become-a-creator"
            className={cn(buttonVariants({ size: "lg" }), "rounded-xl")}
          >
            Start selling
          </Link>
        )}
        <Link
          href="/library"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "rounded-xl",
          )}
        >
          My library
        </Link>
      </div>
    </Container>
  );
}
