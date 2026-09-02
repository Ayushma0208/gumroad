import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { formatCompactNumber } from "@/lib/format";
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
        <span className="relative size-10 overflow-hidden rounded-full bg-muted">
          <Image
            src={creator.avatarUrl}
            alt=""
            fill
            sizes="40px"
            className="object-cover"
          />
        </span>
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
      <span className="relative size-20 shrink-0 overflow-hidden rounded-full bg-muted sm:size-24">
        <Image
          src={creator.avatarUrl}
          alt=""
          fill
          sizes="96px"
          className="object-cover"
        />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-lg font-medium">{creator.name}</p>
        {creator.storeName ? (
          <p className="text-sm text-muted-foreground">{creator.storeName}</p>
        ) : null}
        <p className="mt-3 max-w-xl text-[0.95rem] leading-relaxed text-muted-foreground">
          {creator.bio}
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          {formatCompactNumber(creator.followerCount)} following ·{" "}
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
          Visit store
          <ArrowUpRight />
        </Link>
      </div>
    </div>
  );
}
