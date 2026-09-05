"use client";

import { LoaderCircle, Lock, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { EmptyState } from "@/components/layout/empty-state";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useCreateCheckoutOrder, useVerifyRazorpayPayment } from "@/hooks/use-checkout";
import { ApiError } from "@/lib/api/client";
import { catalogProductTypeLabel } from "@/lib/api/checkout";
import { formatPrice } from "@/lib/format";
import { productPath } from "@/lib/paths";
import { cn } from "@/lib/utils";

type PayState =
  | "idle"
  | "creating_order"
  | "opening_payment"
  | "processing"
  | "success"
  | "failed"
  | "cancelled";

export function CheckoutExperience() {
  const router = useRouter();
  const { user } = useAuth();
  const cart = useCart();
  const createOrder = useCreateCheckoutOrder();
  const verifyPayment = useVerifyRazorpayPayment();
  const [state, setState] = useState<PayState>("idle");
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);

  const items = cart.data?.items ?? [];
  const summary = cart.data?.summary;
  const busy =
    state === "creating_order" ||
    state === "opening_payment" ||
    state === "processing";

  async function onPay() {
    if (lock.current || busy || items.length === 0) return;
    lock.current = true;
    setError(null);
    setState("creating_order");
    try {
      const session = await createOrder.mutateAsync();
      setState("opening_payment");
      if (!window.Razorpay) {
        throw new Error("Razorpay Checkout failed to load. Refresh and try again.");
      }
      const checkout = new window.Razorpay({
        key: session.keyId,
        amount: session.amount,
        currency: session.currency,
        name: "Lumen",
        description: "Digital products",
        order_id: session.razorpayOrderId,
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: { color: "#111111" },
        handler: (response) => {
          setState("processing");
          void verifyPayment
            .mutateAsync(response)
            .then((result) => {
              setState("success");
              router.push(`/checkout/success?orderId=${encodeURIComponent(result.order.id)}`);
            })
            .catch((verifyError: unknown) => {
              setState("failed");
              setError(
                verifyError instanceof ApiError
                  ? verifyError.message
                  : "We could not confirm this payment. Your bag is still saved.",
              );
              router.push("/checkout/failed");
            })
            .finally(() => {
              lock.current = false;
            });
        },
        modal: {
          ondismiss: () => {
            setState("cancelled");
            setError("Payment was cancelled. Your bag is unchanged.");
            lock.current = false;
          },
        },
      });
      checkout.open();
    } catch (payError) {
      setState("failed");
      setError(
        payError instanceof ApiError
          ? payError.message
          : payError instanceof Error
            ? payError.message
            : "Checkout could not start.",
      );
      lock.current = false;
    }
  }

  if (cart.isPending) {
    return (
      <Container className="py-8 sm:py-12">
        <PageHeader
          eyebrow="Checkout"
          title="Review and pay"
          description="Loading the products in your bag."
        />
      </Container>
    );
  }

  if (user?.role !== "CUSTOMER") {
    return (
      <EmptyState
        icon={Lock}
        title="Customer checkout only"
        description="Payments are billed to a customer account. Switch to a customer login to buy."
        actionHref="/discover"
        actionLabel="Back to Discover"
      />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Your bag is empty"
        description="Add a product, then return here. Nothing is charged until Razorpay confirms the payment with our server."
        actionHref="/discover"
        actionLabel="Discover products"
      />
    );
  }

  const payLabel =
    state === "creating_order"
      ? "Preparing order"
      : state === "opening_payment"
        ? "Opening Razorpay"
        : state === "processing"
          ? "Confirming payment"
          : "Pay with Razorpay";

  return (
    <Container className="py-8 sm:py-12">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <PageHeader
        eyebrow="Checkout"
        title="Complete your purchase"
        description="Digital products are delivered to your library after the bank confirms payment. We never trust the browser alone."
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:items-start">
        <div className="space-y-5">
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
              Account
            </p>
            <p className="mt-3 font-display text-2xl tracking-tight">{user?.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
            <p className="mt-4 text-sm text-muted-foreground">
              Instant access. No shipping address — these are files, not parcels.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
              Payment
            </p>
            <p className="mt-3 font-display text-2xl tracking-tight">Razorpay Checkout</p>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Cards, UPI, and netbanking run on Razorpay’s hosted sheet. Lumen only marks the order paid after signature verification on the server.
            </p>
            {error ? (
              <p className="mt-4 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            {state === "cancelled" && !error ? (
              <p className="mt-4 text-sm text-muted-foreground">
                You closed the payment window. Your bag is still here.
              </p>
            ) : null}
          </section>
        </div>

        <aside className="lg:sticky lg:top-24">
          <Card className="overflow-hidden py-0">
            <CardContent className="p-0">
              <div className="border-b border-border px-5 py-4">
                <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
                  Order summary
                </p>
              </div>
              <ul className="divide-y divide-border">
                {items.map((item) => (
                  <li key={item.id} className="flex gap-3 p-4">
                    <Link
                      href={productPath(item.product.slug)}
                      className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted"
                    >
                      <Image
                        src={item.product.coverImage}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={productPath(item.product.slug)}
                        className="line-clamp-2 text-sm font-medium transition-colors hover:text-brand"
                      >
                        {item.product.title}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.product.creator.storeName} ·{" "}
                        {catalogProductTypeLabel(item.product.productType)}
                      </p>
                      <p className="mt-2 text-sm">
                        {formatPrice(item.product.priceCents, item.product.currency)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="space-y-2 border-t border-border px-5 py-4 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>
                    {formatPrice(summary?.subtotalCents ?? 0, summary?.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Discount</span>
                  <span>—</span>
                </div>
                <div className="flex justify-between pt-2 font-medium">
                  <span>Total</span>
                  <span className="font-display text-2xl tracking-tight">
                    {formatPrice(summary?.totalCents ?? 0, summary?.currency)}
                  </span>
                </div>
              </div>
              <div className="px-5 pb-5">
                <Button
                  size="xl"
                  className="w-full rounded-xl"
                  onClick={() => void onPay()}
                  disabled={busy}
                >
                  {busy ? <LoaderCircle className="animate-spin" /> : <Lock />}
                  {payLabel}
                </Button>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Your bag stays until payment is verified.
                </p>
                <Link
                  href="/cart"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "lg" }),
                    "mt-1 w-full rounded-xl",
                  )}
                >
                  Back to bag
                </Link>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </Container>
  );
}
