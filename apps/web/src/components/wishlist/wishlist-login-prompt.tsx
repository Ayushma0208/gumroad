"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { loginPath } from "@/lib/auth/paths";
import { cn } from "@/lib/utils";

export function WishlistLoginPrompt({
  open,
  onOpenChange,
  nextPath,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nextPath?: string | null;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-2xl px-5 py-6">
        <SheetHeader className="p-0 text-left">
          <SheetTitle className="font-display text-2xl tracking-tight">
            Save this product
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            Log in to save products to your wishlist and find them later.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link
            href={loginPath(nextPath)}
            className={cn(buttonVariants({ size: "lg" }), "rounded-xl")}
          >
            Log in
          </Link>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
