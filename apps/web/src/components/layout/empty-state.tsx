import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionHref,
  actionLabel,
  full = true,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  full?: boolean;
  className?: string;
}) {
  const body = (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center py-16 text-center sm:py-20",
        className,
      )}
    >
      {Icon ? (
        <div className="mb-5 flex size-12 items-center justify-center rounded-xl border border-border bg-muted/60">
          <Icon className="size-5 text-muted-foreground" aria-hidden />
        </div>
      ) : null}
      <p className="font-display text-3xl tracking-tight sm:text-4xl">{title}</p>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
        {description}
      </p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className={cn(buttonVariants({ size: "xl" }), "mt-8 rounded-xl")}
        >
          {actionLabel}
          <ArrowRight />
        </Link>
      ) : null}
    </div>
  );

  if (!full) return body;

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center">
      {body}
    </Container>
  );
}
