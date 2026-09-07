import { requestJson } from "@/lib/api/http";
import type { PaginationMeta } from "@/types/catalog";

export type CouponType = "PERCENTAGE" | "FIXED";

export type CouponStatus =
  | "active"
  | "scheduled"
  | "expired"
  | "inactive"
  | "limit_reached";

export type Coupon = {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  maxDiscount: number | null;
  maxDiscountMajor: number | null;
  minOrderAmount: number | null;
  minOrderAmountMajor: number | null;
  maxUses: number | null;
  usedCount: number;
  perUserLimit: number | null;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  status: CouponStatus;
  scope: "products" | "creator";
  productIds: string[];
  products: Array<{ id: string; title: string; slug: string }>;
  createdAt: string;
  updatedAt: string;
};

export type CouponInput = {
  code: string;
  type: CouponType;
  value: number;
  maxDiscount?: number | null;
  minOrderAmount?: number | null;
  maxUses?: number | null;
  perUserLimit?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  isActive?: boolean;
  productIds?: string[];
};

export type CheckoutPreview = {
  subtotal: number;
  subtotalCents: number;
  discount: number;
  discountCents: number;
  total: number;
  totalCents: number;
  currency: "USD" | "INR";
  itemCount: number;
  coupon: {
    code: string;
    type: CouponType;
    value: number;
    affectedProductIds: string[];
  } | null;
};

export type CouponUsage = {
  coupon: Coupon;
  redemptions: number;
  remaining: number | null;
  discountGivenCents: number;
  discountGiven: number;
  revenueCents: number;
  revenue: number;
  averageOrderValueCents: number;
  averageOrderValue: number;
  paidOrders: number;
  firstRedemptionAt: string | null;
  latestRedemptionAt: string | null;
};

export function listCreatorCoupons(params: {
  page?: number;
  limit?: number;
  status?: string;
} = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.status) query.set("status", params.status);
  const suffix = query.size ? `?${query.toString()}` : "";
  return requestJson<{ items: Coupon[]; pagination: PaginationMeta }>(
    `/api/v1/coupons${suffix}`,
  );
}

export function getCreatorCoupon(couponId: string) {
  return requestJson<{ coupon: Coupon }>(
    `/api/v1/coupons/${encodeURIComponent(couponId)}`,
  );
}

export function createCreatorCoupon(input: CouponInput) {
  return requestJson<{ coupon: Coupon }>("/api/v1/coupons", {
    method: "POST",
    body: input,
  });
}

export function updateCreatorCoupon(couponId: string, input: Partial<CouponInput>) {
  return requestJson<{ coupon: Coupon }>(
    `/api/v1/coupons/${encodeURIComponent(couponId)}`,
    { method: "PATCH", body: input },
  );
}

export function deactivateCreatorCoupon(couponId: string) {
  return requestJson<{ coupon: Coupon }>(
    `/api/v1/coupons/${encodeURIComponent(couponId)}/deactivate`,
    { method: "POST" },
  );
}

export function deleteCreatorCoupon(couponId: string) {
  return requestJson<{ ok: boolean; deleted?: boolean; deactivated?: boolean }>(
    `/api/v1/coupons/${encodeURIComponent(couponId)}`,
    { method: "DELETE" },
  );
}

export function getCreatorCouponUsage(couponId: string) {
  return requestJson<CouponUsage>(
    `/api/v1/coupons/${encodeURIComponent(couponId)}/usage`,
  );
}

export function previewCheckout(couponCode?: string) {
  return requestJson<CheckoutPreview>("/api/v1/checkout/preview", {
    method: "POST",
    body: couponCode ? { couponCode } : {},
  });
}
