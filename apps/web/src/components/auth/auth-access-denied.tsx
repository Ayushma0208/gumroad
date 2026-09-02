"use client";

import { ArrowRight, RefreshCw } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function AuthAccessDenied({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="text-xs font-medium tracking-[0.18em] text-brand uppercase">
        Restricted
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight">{title}</h1>
      <p className="mt-3 max-w-md text-muted-foreground">{description}</p>
      <Link
        href={actionHref}
        className={cn(buttonVariants({ size: "xl" }), "mt-8 rounded-xl")}
      >
        {actionLabel}
        <ArrowRight />
      </Link>
    </Container>
  );
}

export function AuthSessionError({ onRetry }: { onRetry: () => void }) {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="text-xs font-medium tracking-[0.18em] text-brand uppercase">
        Session
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight">
        We couldn’t load your account.
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Check your connection and try again. Your session is stored in a secure
        cookie — nothing to paste or copy.
      </p>
      <Button
        type="button"
        size="xl"
        className="mt-8 rounded-xl"
        onClick={onRetry}
      >
        Try again
        <RefreshCw />
      </Button>
    </Container>
  );
}
