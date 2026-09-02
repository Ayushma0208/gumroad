import type { Product } from "@/types/catalog";
import { formatPrice } from "@/lib/format";

/**
 * Checkout currently prepares a draft intent from mock catalog data.
 * Swap `createCheckoutIntent` to POST /payments/orders once Razorpay is live.
 */
export type CheckoutLine = {
  productId: string;
  slug: string;
  title: string;
  priceCents: number;
  currency: Product["currency"];
  imageUrl: string;
};

export type CheckoutIntent = {
  id: string;
  provider: "razorpay";
  status: "draft";
  items: CheckoutLine[];
  totalCents: number;
  currency: Product["currency"];
  note: string;
};

export async function createCheckoutIntent(
  items: CheckoutLine[],
): Promise<CheckoutIntent> {
  const totalCents = items.reduce((sum, item) => sum + item.priceCents, 0);
  const currency = items[0]?.currency ?? "USD";

  return {
    id: `draft_${Date.now()}`,
    provider: "razorpay",
    status: "draft",
    items,
    totalCents,
    currency,
    note: `Order total ${formatPrice(totalCents, currency)}. Razorpay checkout is not connected yet.`,
  };
}

export function productToCheckoutLine(product: Product): CheckoutLine {
  return {
    productId: product.id,
    slug: product.slug,
    title: product.title,
    priceCents: product.priceCents,
    currency: product.currency,
    imageUrl: product.imageUrl,
  };
}
