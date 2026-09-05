import { requestJson } from "@/lib/api/http";

export type CheckoutSession = {
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  currency: "USD" | "INR";
  keyId: string;
};

export type RazorpayCheckoutResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type PublicOrderItem = {
  id: string;
  productId: string;
  productTitle: string;
  price: number;
  priceCents: number;
  quantity: number;
  product: {
    slug: string;
    coverImage: string;
    productType: string;
    creator: { storeName: string; slug: string };
  };
};

export type PublicOrder = {
  id: string;
  status: "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED";
  subtotal: number;
  subtotalCents: number;
  discount: number;
  discountCents: number;
  total: number;
  totalCents: number;
  currency: "USD" | "INR";
  createdAt: string;
  updatedAt: string;
  items: PublicOrderItem[];
  payment: {
    id: string;
    status: string;
    provider: string;
    amount: number;
    amountCents: number;
    currency: "USD" | "INR";
  } | null;
};

export type PurchaseRecord = {
  id: string;
  productId: string;
  orderId: string;
  createdAt: string;
  product: {
    id: string;
    title: string;
    slug: string;
    coverImage: string;
    productType: string;
    creator: { storeName: string; slug: string };
  };
};

export function createCheckoutOrder() {
  return requestJson<CheckoutSession>("/api/v1/checkout/create-order", {
    method: "POST",
  });
}

export function verifyRazorpayPayment(input: RazorpayCheckoutResponse) {
  return requestJson<{ order: PublicOrder }>("/api/v1/payments/razorpay/verify", {
    method: "POST",
    body: input,
  });
}

export function getOrders() {
  return requestJson<{ orders: PublicOrder[] }>("/api/v1/orders");
}

export function getOrder(orderId: string) {
  return requestJson<{ order: PublicOrder }>(
    `/api/v1/orders/${encodeURIComponent(orderId)}`,
  );
}

export function getPurchases() {
  return requestJson<{ purchases: PurchaseRecord[] }>("/api/v1/orders/purchases");
}

export function catalogProductTypeLabel(type: string) {
  const labels: Record<string, string> = {
    DIGITAL_DOWNLOAD: "Digital download",
    COURSE: "Course",
    TEMPLATE: "Template",
    BUNDLE: "Bundle",
  };
  return labels[type] ?? type.replaceAll("_", " ").toLowerCase();
}
