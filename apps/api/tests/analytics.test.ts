import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";

const {
  userFindUnique,
  creatorFindUnique,
  productCount,
  productFindFirst,
  productFindMany,
  orderItemFindMany,
  reviewAggregate,
  queryRaw,
} = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  creatorFindUnique: vi.fn(),
  productCount: vi.fn(),
  productFindFirst: vi.fn(),
  productFindMany: vi.fn(),
  orderItemFindMany: vi.fn(),
  reviewAggregate: vi.fn(),
  queryRaw: vi.fn(),
}));

vi.mock("../src/config/cloudinary", () => ({
  destroyCloudinaryAsset: vi.fn(),
  uploadPublicImage: vi.fn(),
  uploadPrivateFile: vi.fn(),
  signedDeliveryUrl: vi.fn(),
  cloudinaryFolders: {
    productImages: () => "img",
    productFiles: () => "files",
    creatorAvatar: () => "avatar",
    creatorBanner: () => "banner",
  },
}));

vi.mock("../src/modules/payments/razorpay.service", () => ({
  createRazorpayOrder: vi.fn(),
  getRazorpayKeyId: vi.fn(() => "rzp_test_key"),
  verifyCheckoutSignature: vi.fn(() => true),
  verifyWebhookSignature: vi.fn(() => true),
}));

vi.mock("../src/config/database", () => ({
  prisma: {
    user: { findUnique: userFindUnique },
    creatorProfile: { findUnique: creatorFindUnique },
    product: {
      count: productCount,
      findFirst: productFindFirst,
      findMany: productFindMany,
    },
    orderItem: { findMany: orderItemFindMany },
    review: { aggregate: reviewAggregate },
    $queryRaw: queryRaw,
    $connect: vi.fn(),
  },
}));

import { createApp } from "../src/app";
import { cookieName } from "../src/config/cookies";

const app = createApp();

function session(user: { id: string; email: string; role: Role }) {
  const token = jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "1d" },
  );
  userFindUnique.mockResolvedValue(user);
  return [`${cookieName()}=${token}`];
}

const leah = { id: "u_leah", email: "leah@example.com", role: "CUSTOMER" as const };
const mira = { id: "u_mira", email: "mira@example.com", role: "CREATOR" as const };
const kenji = { id: "u_kenji", email: "kenji@example.com", role: "CREATOR" as const };

function totalsRow(overrides: Record<string, number> = {}) {
  return {
    gross_revenue: overrides.gross ?? 10_000,
    discount: overrides.discount ?? 500,
    orders: overrides.orders ?? 2,
    units_sold: overrides.units ?? 3,
    customers: overrides.customers ?? 2,
    new_customers: overrides.newCustomers ?? 1,
    returning_customers: overrides.returning ?? 1,
  };
}

function sqlText(args: unknown[]): string {
  const strings = args[0];
  if (Array.isArray(strings)) return strings.join(" ");
  return String(strings ?? "");
}

describe("creator analytics API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    creatorFindUnique.mockResolvedValue({ id: "cr_mira" });
    productCount.mockResolvedValue(4);
    productFindFirst.mockResolvedValue({ currency: "USD" });
    productFindMany.mockResolvedValue([
      {
        id: "p1",
        title: "Atlas UI Kit",
        slug: "atlas",
        coverImage: "https://example.com/a.jpg",
        currency: "USD",
        status: "PUBLISHED",
        createdAt: new Date("2026-01-01"),
      },
    ]);
    orderItemFindMany.mockResolvedValue([]);
    reviewAggregate.mockResolvedValue({ _avg: { rating: 4.5 }, _count: { _all: 2 } });

    let totalsCalls = 0;
    queryRaw.mockImplementation(async (...args: unknown[]) => {
      const text = sqlText(args);
      if (text.includes("paid_items") || text.includes("gross_revenue")) {
        totalsCalls += 1;
        if (totalsCalls === 1) return [totalsRow({ gross: 10_000 })];
        return [totalsRow({ gross: 8_000, discount: 400, orders: 1, units: 1, customers: 1 })];
      }
      if (text.includes("GROUP BY o.status")) {
        return [{ status: "PAID", count: 2 }];
      }
      if (text.includes("bucket_ts") || text.includes("date_trunc")) {
        return [
          {
            bucket: "2026-09-01",
            revenue: 5000,
            orders: 1,
            units_sold: 1,
            new_customers: 1,
          },
        ];
      }
      if (text.includes("product_id")) {
        return [
          {
            product_id: "p1",
            units_sold: 3,
            orders: 2,
            revenue: 9500,
            refunded_orders: 0,
          },
        ];
      }
      if (text.includes("coupon_id") || text.includes("redemptions")) {
        return [
          {
            coupon_id: "cpn_1",
            code: "SUMMER20",
            redemptions: 2,
            discount: 800,
            attributed_revenue: 5000,
          },
        ];
      }
      if (text.includes("customer_id") || text.includes("total_spent")) {
        return [
          {
            customer_id: "u_leah",
            name: "Leah",
            email: "leah@example.com",
            avatar_url: null,
            purchase_count: 2,
            total_spent: 5000,
            last_purchase_at: new Date("2026-09-01"),
          },
        ];
      }
      return [];
    });
  });

  it("rejects customers", async () => {
    const res = await request(app)
      .get("/api/v1/creators/me/analytics/overview")
      .set("Cookie", session(leah));
    expect(res.status).toBe(403);
  });

  it("requires auth", async () => {
    const res = await request(app).get("/api/v1/creators/me/analytics/overview");
    expect(res.status).toBe(401);
  });

  it("returns overview for the authenticated creator only", async () => {
    const res = await request(app)
      .get("/api/v1/creators/me/analytics/overview?range=30d")
      .set("Cookie", session(mira));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.metrics.revenueCents).toBe(9500);
    expect(res.body.data.metrics.orders).toBe(2);
    expect(res.body.data.metrics.unitsSold).toBe(3);
    expect(res.body.data.metrics.customers).toBe(2);
    expect(res.body.data.metrics.averageOrderValueCents).toBe(4750);
    expect(Number.isFinite(res.body.data.metrics.revenueChange)).toBe(true);
    expect(creatorFindUnique).toHaveBeenCalledWith({
      where: { userId: "u_mira" },
      select: { id: true },
    });
  });

  it("isolates creators by session profile", async () => {
    creatorFindUnique.mockResolvedValue({ id: "cr_kenji" });
    queryRaw.mockImplementation(async (...args: unknown[]) => {
      const text = sqlText(args);
      if (text.includes("paid_items") || text.includes("gross_revenue")) {
        return [
          totalsRow({
            gross: 0,
            discount: 0,
            orders: 0,
            units: 0,
            customers: 0,
            newCustomers: 0,
            returning: 0,
          }),
        ];
      }
      return [];
    });

    const res = await request(app)
      .get("/api/v1/creators/me/analytics/overview")
      .set("Cookie", session(kenji));

    expect(res.status).toBe(200);
    expect(creatorFindUnique).toHaveBeenCalledWith({
      where: { userId: "u_kenji" },
      select: { id: true },
    });
    expect(res.body.data.metrics.revenueCents).toBe(0);
    expect(res.body.data.metrics.revenueChange).toBe(0);
  });

  it("handles previous-period zero as New (null change)", async () => {
    let totalsCalls = 0;
    queryRaw.mockImplementation(async (...args: unknown[]) => {
      const text = sqlText(args);
      if (text.includes("paid_items") || text.includes("gross_revenue")) {
        totalsCalls += 1;
        if (totalsCalls === 1) {
          return [totalsRow({ gross: 5000, discount: 0 })];
        }
        return [
          totalsRow({
            gross: 0,
            discount: 0,
            orders: 0,
            units: 0,
            customers: 0,
            newCustomers: 0,
            returning: 0,
          }),
        ];
      }
      return [];
    });

    const res = await request(app)
      .get("/api/v1/creators/me/analytics/overview?range=7d")
      .set("Cookie", session(mira));

    expect(res.status).toBe(200);
    expect(res.body.data.metrics.revenueChange).toBeNull();
  });

  it("serves product analytics with ownership from session", async () => {
    queryRaw.mockImplementation(async (...args: unknown[]) => {
      const text = sqlText(args);
      if (text.includes("product_id")) {
        return [
          {
            product_id: "p1",
            units_sold: 2,
            orders: 2,
            revenue: 4000,
            refunded_orders: 0,
          },
        ];
      }
      return [];
    });

    const res = await request(app)
      .get("/api/v1/creators/me/analytics/products?sort=revenue")
      .set("Cookie", session(mira));

    expect(res.status).toBe(200);
    expect(res.body.data.items[0].productId).toBe("p1");
    expect(res.body.data.items[0].revenueCents).toBe(4000);
    expect(res.body.data.items[0].averagePriceCents).toBe(2000);
  });

  it("rejects product detail for another creator’s product", async () => {
    productFindFirst.mockResolvedValue(null);
    const res = await request(app)
      .get("/api/v1/creators/me/analytics/products/p_other")
      .set("Cookie", session(mira));
    expect(res.status).toBe(404);
  });

  it("returns coupon analytics from aggregations", async () => {
    let couponCalls = 0;
    queryRaw.mockImplementation(async (...args: unknown[]) => {
      const text = sqlText(args);
      if (text.includes("coupon_id") || text.includes("attributed_revenue")) {
        couponCalls += 1;
        return [
          {
            coupon_id: "cpn_1",
            code: "SUMMER20",
            redemptions: 2,
            discount: 800,
            attributed_revenue: 5000,
          },
        ];
      }
      if (text.includes("paid_items") || text.includes("gross_revenue")) {
        return [totalsRow({ discount: 800 })];
      }
      return [];
    });

    const res = await request(app)
      .get("/api/v1/creators/me/analytics/coupons?range=90d")
      .set("Cookie", session(mira));

    expect(res.status).toBe(200);
    expect(res.body.data.couponsUsed).toBe(2);
    expect(res.body.data.discountCents).toBe(800);
    expect(res.body.data.items[0].code).toBe("SUMMER20");
    expect(couponCalls).toBeGreaterThan(0);
  });
});
