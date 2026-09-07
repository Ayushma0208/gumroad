import type { Metadata } from "next";
import { WishlistExperience } from "@/components/wishlist/wishlist-experience";

export const metadata: Metadata = {
  title: "Wishlist",
  robots: {
    index: false,
    follow: false,
  },
};

export default function WishlistPage() {
  return <WishlistExperience />;
}
