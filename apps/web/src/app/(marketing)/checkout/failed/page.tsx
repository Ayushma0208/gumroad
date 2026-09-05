import type { Metadata } from "next";
import Link from "next/link";
import { CircleAlert } from "lucide-react";
import { ProtectedLayout } from "@/components/auth/protected-layout";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Payment failed",
};

export default function CheckoutFailedPage() {
  return (
    <ProtectedLayout>
      <Container className="flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <CircleAlert className="size-7" />
        </span>
        <h1 className="mt-8 font-display text-4xl tracking-tight">Payment didn’t go through</h1>
        <p className="mt-4 max-w-md text-muted-foreground">
          Nothing was added to your library, and your bag is still intact. You can try Razorpay again or return to the bag.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/checkout" className={cn(buttonVariants({ size: "xl" }), "rounded-xl")}>
            Try again
          </Link>
          <Link
            href="/cart"
            className={cn(buttonVariants({ variant: "outline", size: "xl" }), "rounded-xl")}
          >
            Return to cart
          </Link>
        </div>
      </Container>
    </ProtectedLayout>
  );
}
