"use client";

import Image from "next/image";
import { useState } from "react";
import { cloudinaryThumb } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";
import { initialsForName } from "@/types/auth";

const sizes = {
  sm: "size-6 text-[10px]",
  md: "size-10 text-xs",
  lg: "size-20 text-lg sm:size-24",
  xl: "size-24 text-xl sm:size-28",
} as const;

export function CreatorAvatar({
  src,
  name,
  size = "md",
  className,
  priority = false,
}: {
  src?: string | null;
  name: string;
  size?: keyof typeof sizes;
  className?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;
  const px = size === "xl" || size === "lg" ? 256 : 80;

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted font-medium tracking-wide text-muted-foreground",
        sizes[size],
        className,
      )}
    >
      {showImage && src ? (
        <Image
          src={cloudinaryThumb(src, px)}
          alt={`${name}’s portrait`}
          fill
          priority={priority}
          sizes={size === "xl" || size === "lg" ? "112px" : "40px"}
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden="true">{initialsForName(name)}</span>
      )}
    </span>
  );
}
