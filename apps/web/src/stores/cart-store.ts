import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  addItem: (item: Omit<CartItem, "quantity">) => boolean;
  hasItem: (productId: string) => boolean;
  removeItem: (productId: string) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        if (get().items.some((row) => row.productId === item.productId)) {
          return false;
        }
        set({ items: [...get().items, { ...item, quantity: 1 }] });
        return true;
      },
      hasItem: (productId) =>
        get().items.some((row) => row.productId === productId),
      removeItem: (productId) =>
        set({ items: get().items.filter((row) => row.productId !== productId) }),
      clear: () => set({ items: [] }),
    }),
    { name: "lumen-cart" },
  ),
);

export function selectCartCount(state: CartState): number {
  return state.items.reduce((sum, item) => sum + item.quantity, 0);
}

export function selectHasProduct(productId: string) {
  return (state: CartState) =>
    state.items.some((item) => item.productId === productId);
}
