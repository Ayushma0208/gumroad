import type { Metadata } from "next";
import { EmptyState } from "@/components/layout/empty-state";
import { CheckoutExperience } from "@/components/checkout/checkout-experience";
import { productToCheckoutLine } from "@/lib/api/checkout";
import { getProductBySlug } from "@/lib/api/products";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Review your Lumen order. Razorpay checkout will connect here.",
};

type CheckoutPageProps = {
  searchParams: Promise<{ product?: string }>;
};

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const { product: slug } = await searchParams;
  const product = slug ? await getProductBySlug(slug) : null;
  if (slug && !product) {
    return (
      <EmptyState
        title="This product is not on the shelf."
        description="The checkout link is missing a product we can sell. Head back to Discover and pick something else."
        actionHref="/discover"
        actionLabel="Back to Discover"
      />
    );
  }

  return (
    <CheckoutExperience
      preset={product ? productToCheckoutLine(product) : null}
    />
  );
}
