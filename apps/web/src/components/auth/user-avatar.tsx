"use client";

import Image from "next/image";
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

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-medium",
        dim,
        className,
      )}
    >
      {src ? (
        src.startsWith("data:") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="size-full object-cover" />
        ) : (
          <Image src={src} alt="" fill sizes="64px" className="object-cover" />
        )
      ) : (
        initialsForName(user.name)
      )}
    </span>
  );
}
