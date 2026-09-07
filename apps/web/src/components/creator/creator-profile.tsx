import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { CreatorAvatar } from "@/components/creator/creator-avatar";
import { buttonVariants } from "@/components/ui/button";
import { creatorPath } from "@/lib/paths";
import { cn } from "@/lib/utils";
import type { CreatorProfile } from "@/types/catalog";

export function CreatorProfile({
  creator,
  variant = "panel",
  className,
}: {
  creator: CreatorProfile;
  variant?: "panel" | "inline";
  className?: string;
}) {
  if (variant === "inline") {
    return (
      <Link
        href={creatorPath(creator.slug)}
        className={cn("inline-flex items-center gap-3", className)}
      >
        <CreatorAvatar src={creator.avatarUrl} name={creator.name} size="md" />
        <span>
          <span className="block text-sm font-medium">{creator.name}</span>
          <span className="text-sm text-muted-foreground">
            {creator.headline}
          </span>
        </span>
      </Link>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8", className)}>
      <CreatorAvatar
        src={creator.avatarUrl}
        name={creator.storeName ?? creator.name}
        size="lg"
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
          Created by
        </p>
        <p className="mt-2 text-lg font-medium">{creator.storeName ?? creator.name}</p>
        <p className="text-sm text-muted-foreground">@{creator.slug}</p>
        <p className="mt-3 max-w-xl text-[0.95rem] leading-relaxed text-muted-foreground">
          {creator.bio}
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          {creator.productCount}{" "}
          {creator.productCount === 1 ? "product" : "products"}
        </p>
        <Link
          href={creatorPath(creator.slug)}
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "mt-6 rounded-xl",
          )}
        >
          View store
          <ArrowUpRight />
        </Link>
      </div>
    </div>
  );
}
