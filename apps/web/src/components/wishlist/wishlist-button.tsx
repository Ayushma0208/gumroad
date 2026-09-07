"use client";

import { Heart, LoaderCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, type MouseEvent } from "react";
import { WishlistLoginPrompt } from "@/components/wishlist/wishlist-login-prompt";
import { useAuth } from "@/hooks/use-auth";
import { useIsWishlisted, useToggleWishlist } from "@/hooks/use-wishlist";
import { cn } from "@/lib/utils";

export function WishlistButton({
  productId,
  className,
  variant = "icon",
}: {
  productId: string;
  className?: string;
  variant?: "icon" | "label";
}) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const wishlisted = useIsWishlisted(productId);
  const toggle = useToggleWishlist();
  const [loginOpen, setLoginOpen] = useState(false);
  const busy = toggle.isPending && toggle.variables?.productId === productId;

  async function onClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (isLoading || busy) return;
    if (!isAuthenticated) {
      setLoginOpen(true);
      return;
    }
    await toggle.mutateAsync({ productId, wishlisted });
  }

  const label = wishlisted ? "Remove from wishlist" : "Add to wishlist";

  return (
    <>
      <button
        type="button"
        aria-label={label}
        aria-pressed={wishlisted}
        disabled={busy || isLoading}
        onClick={(event) => {
          void onClick(event);
        }}
        className={cn(
          variant === "icon"
            ? "flex size-9 items-center justify-center rounded-full border border-white/15 bg-background/90 text-foreground shadow-sm backdrop-blur-md transition-colors hover:bg-background disabled:opacity-80"
            : "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-70",
          className,
        )}
      >
        {busy ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Heart
            className={cn(
              "size-4 transition-transform duration-200 motion-safe:active:scale-90",
              wishlisted && "fill-current text-brand",
            )}
          />
        )}
        {variant === "label" ? (
          <span>{wishlisted ? "Saved" : "Save to wishlist"}</span>
        ) : (
          <span className="sr-only">{label}</span>
        )}
      </button>
      <WishlistLoginPrompt
        open={loginOpen}
        onOpenChange={setLoginOpen}
        nextPath={pathname}
      />
    </>
  );
}
