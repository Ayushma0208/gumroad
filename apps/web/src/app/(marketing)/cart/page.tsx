import type { Metadata } from "next";
import { CartExperience } from "@/components/cart/cart-experience";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review the digital products in your Lumen bag.",
};

export default function CartPage() {
  return <CartExperience />;
}
