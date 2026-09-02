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
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const existing = get().items.find((row) => row.productId === item.productId);
        if (existing) {
          set({
            items: get().items.map((row) =>
              row.productId === item.productId
                ? { ...row, quantity: row.quantity + 1 }
                : row,
            ),
          });
          return;
        }
        set({ items: [...get().items, { ...item, quantity: 1 }] });
      },
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
