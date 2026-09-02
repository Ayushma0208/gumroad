import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyState({
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
      <p className="font-display text-3xl tracking-tight sm:text-4xl">{title}</p>
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
