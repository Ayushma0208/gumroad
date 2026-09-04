import { requestJson } from "@/lib/api/http";

export type CartProduct = {
  id: string;
  title: string;
  slug: string;
  coverImage: string;
  price: number;
  priceCents: number;
  currency: "USD" | "INR";
  productType: string;
  available: boolean;
  creator: {
    storeName: string;
    slug: string;
  };
};

export type CartLine = {
  id: string;
  quantity: number;
  subtotal: number;
  subtotalCents: number;
  product: CartProduct;
};

export type CartSummary = {
  subtotal: number;
  subtotalCents: number;
  discount: number;
  discountCents: number;
  total: number;
  totalCents: number;
  currency: "USD" | "INR";
  itemCount: number;
};

export type Cart = {
  id: string;
  items: CartLine[];
  summary: CartSummary;
};

export function getCart() {
  return requestJson<Cart>("/api/v1/cart");
}

export function addToCart(productId: string, quantity = 1) {
  return requestJson<Cart>("/api/v1/cart/items", {
    method: "POST",
    body: { productId, quantity },
  });
}

export function updateCartItem(itemId: string, quantity: number) {
  return requestJson<Cart>(`/api/v1/cart/items/${encodeURIComponent(itemId)}`, {
    method: "PATCH",
    body: { quantity },
  });
}

export function removeCartItem(itemId: string) {
  return requestJson<Cart>(`/api/v1/cart/items/${encodeURIComponent(itemId)}`, {
    method: "DELETE",
  });
}

export function clearCart() {
  return requestJson<Cart>("/api/v1/cart", { method: "DELETE" });
}

export function emptyCart(): Cart {
  return {
    id: "",
    items: [],
    summary: {
      subtotal: 0,
      subtotalCents: 0,
      discount: 0,
      discountCents: 0,
      total: 0,
      totalCents: 0,
      currency: "USD",
      itemCount: 0,
    },
  };
}
