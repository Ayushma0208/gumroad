import type { Currency, OrderStatus, PaymentStatus } from "@prisma/client";
import { majorFromMinor } from "../../utils/money";

export function isPaidStatus(status: PaymentStatus | OrderStatus) {
  return status === "PAID" || status === "SUCCESS";
}

export function serializeOrder(order: {
  id: string;
  customerId: string;
  subtotal: number;
  discount: number;
  totalAmount: number;
  currency: Currency;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    id: string;
    productId: string;
    creatorId: string;
    productTitle: string;
    price: number;
    quantity: number;
    product: {
      slug: string;
      coverImage: string;
      productType: string;
      creator: { storeName: string; slug: string };
    };
  }>;
  payment: {
    id: string;
    status: PaymentStatus;
    provider: string;
    amount: number;
    currency: Currency;
    providerOrderId: string | null;
  } | null;
}) {
  return {
    id: order.id,
    status: order.status,
    subtotal: majorFromMinor(order.subtotal),
    subtotalCents: order.subtotal,
    discount: majorFromMinor(order.discount),
    discountCents: order.discount,
    total: majorFromMinor(order.totalAmount),
    totalCents: order.totalAmount,
    currency: order.currency,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productTitle: item.productTitle || item.product.slug,
      price: majorFromMinor(item.price),
      priceCents: item.price,
      quantity: item.quantity,
      product: {
        slug: item.product.slug,
        coverImage: item.product.coverImage,
        productType: item.product.productType,
        creator: item.product.creator,
      },
    })),
    payment: order.payment
      ? {
          id: order.payment.id,
          status: isPaidStatus(order.payment.status) ? "PAID" : order.payment.status,
          provider: order.payment.provider,
          amount: majorFromMinor(order.payment.amount),
          amountCents: order.payment.amount,
          currency: order.payment.currency,
        }
      : null,
  };
}

export type PublicOrder = ReturnType<typeof serializeOrder>;
