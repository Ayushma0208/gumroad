/**
 * @deprecated Local cart persistence. Use `useCart` / `/api/v1/cart`.
 */
import { create } from "zustand";

export type CartItem = {
  productId: string;
  slug: string;
  title: string;
  priceCents: number;
  currency: "USD" | "INR";
  imageUrl: string;
  quantity: number;
};

type CartState = {
  items: CartItem[];
};

export const useCartStore = create<CartState>()(() => ({
  items: [],
}));
