import type { Metadata } from "next";
import { CheckoutExperience } from "@/components/checkout/checkout-experience";
import { ProtectedLayout } from "@/components/auth/protected-layout";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Pay securely with Razorpay. Orders are marked paid only after server verification.",
};

export default function CheckoutPage() {
  return (
    <ProtectedLayout>
      <CheckoutExperience />
    </ProtectedLayout>
  );
}
