"use client";

import Image from "next/image";
import { cloudinaryThumb } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";
import { initialsForName, type AuthUser } from "@/types/auth";

export function UserAvatar({
  user,
  className,
  size = "sm",
}: {
  user: AuthUser;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "lg" ? "size-16" : size === "md" ? "size-10" : "size-8";
  const src = user.avatarUrl || user.creatorProfile?.avatarUrl;
  const localPreview = Boolean(
    src && (src.startsWith("data:") || src.startsWith("blob:")),
  );

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-medium",
        dim,
        className,
      )}
    >
      {src ? (
        localPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="size-full object-cover" />
        ) : (
          <Image
            src={cloudinaryThumb(src, 64)}
            alt=""
            fill
            sizes="64px"
            className="object-cover"
          />
        )
      ) : (
        initialsForName(user.name)
      )}
    </span>
  );
}
