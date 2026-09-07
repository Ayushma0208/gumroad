import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { Prisma } from "@prisma/client";

const {
  userFindUnique,
  creatorFindUnique,
  productFindMany,
  productFindUnique,
  couponCreate,
  couponFindUnique,
  couponFindFirst,
  couponFindMany,
  couponUpdate,
  couponDelete,
  couponCount,
  couponProductDeleteMany,
  couponProductCreateMany,
  couponRedemptionCount,
  couponRedemptionFindUnique,
  couponRedemptionCreate,
  couponRedemptionFindFirst,
  orderAggregate,
  executeRaw,
  transaction,
  cartFindUnique,
  purchaseFindUnique,
  purchaseFindMany,
  orderFindFirst,
  orderUpdateMany,
  orderCreate,
  paymentUpdate,
} = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  creatorFindUnique: vi.fn(),
  productFindMany: vi.fn(),
  productFindUnique: vi.fn(),
  couponCreate: vi.fn(),
  couponFindUnique: vi.fn(),
  couponFindFirst: vi.fn(),
  couponFindMany: vi.fn(),
  couponUpdate: vi.fn(),
  couponDelete: vi.fn(),
  couponCount: vi.fn(),
  couponProductDeleteMany: vi.fn(),
  couponProductCreateMany: vi.fn(),
  couponRedemptionCount: vi.fn(),
  couponRedemptionFindUnique: vi.fn(),
  couponRedemptionCreate: vi.fn(),
  couponRedemptionFindFirst: vi.fn(),
  orderAggregate: vi.fn(),
  executeRaw: vi.fn(),
  transaction: vi.fn(),
  cartFindUnique: vi.fn(),
  purchaseFindUnique: vi.fn(),
  purchaseFindMany: vi.fn(),
  orderFindFirst: vi.fn(),
  orderUpdateMany: vi.fn(),
  orderCreate: vi.fn(),
  paymentUpdate: vi.fn(),
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
  createRazorpayOrder: vi.fn(async ({ amount, currency }: { amount: number; currency: string }) => ({
    id: "order_rzp_1",
    amount,
    currency,
  })),
  getRazorpayKeyId: vi.fn(() => "rzp_test_key"),
  verifyCheckoutSignature: vi.fn(() => true),
  verifyWebhookSignature: vi.fn(() => true),
}));

vi.mock("../src/config/database", () => ({
  prisma: {
    user: { findUnique: userFindUnique },
    creatorProfile: { findUnique: creatorFindUnique },
    product: { findMany: productFindMany, findUnique: productFindUnique },
    coupon: {
      create: couponCreate,
      findUnique: couponFindUnique,
      findFirst: couponFindFirst,
      findMany: couponFindMany,
      update: couponUpdate,
      delete: couponDelete,
      count: couponCount,
    },
    couponProduct: {
      deleteMany: couponProductDeleteMany,
      createMany: couponProductCreateMany,
    },
    couponRedemption: {
      count: couponRedemptionCount,
      findUnique: couponRedemptionFindUnique,
      create: couponRedemptionCreate,
      findFirst: couponRedemptionFindFirst,
    },
    order: {
      aggregate: orderAggregate,
      findFirst: orderFindFirst,
      updateMany: orderUpdateMany,
      create: orderCreate,
    },
    payment: { update: paymentUpdate },
    cart: { findUnique: cartFindUnique },
    purchase: { findUnique: purchaseFindUnique, findMany: purchaseFindMany },
    $executeRaw: executeRaw,
    $transaction: transaction,
    $connect: vi.fn(),
  },
}));

import { createApp } from "../src/app";
import { cookieName } from "../src/config/cookies";
import { calculateDiscountAmount } from "../src/modules/coupons/coupon.service";

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

function couponRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "cpn_1",
    creatorId: "cr_mira",
    code: "SUMMER20",
    type: "PERCENTAGE",
    value: 20,
    maxDiscount: 5000,
    minOrderAmount: 1000,
    maxUses: 100,
    usedCount: 0,
    perUserLimit: 1,
    startsAt: new Date(Date.now() - 60_000),
    expiresAt: new Date(Date.now() + 86_400_000),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    products: [],
    ...overrides,
  };
}

describe("coupon math", () => {
  it("calculates percentage with max discount cap", () => {
    expect(
      calculateDiscountAmount({
        type: "PERCENTAGE",
        value: 20,
        eligibleSubtotal: 20000,
        maxDiscount: 3000,
      }),
    ).toBe(3000);
  });

  it("never discounts more than eligible subtotal for fixed coupons", () => {
    expect(
      calculateDiscountAmount({
        type: "FIXED",
        value: 5000,
        eligibleSubtotal: 2000,
        maxDiscount: null,
      }),
    ).toBe(2000);
  });
});

describe("creator coupons", () => {
  beforeEach(() => {
    userFindUnique.mockReset();
    creatorFindUnique.mockReset();
    productFindMany.mockReset();
    couponCreate.mockReset();
    couponFindFirst.mockReset();
    couponFindMany.mockReset();
    couponCount.mockReset();
    couponUpdate.mockReset();
    transaction.mockReset();
    transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn({
        coupon: { update: couponUpdate },
        couponProduct: {
          deleteMany: couponProductDeleteMany,
          createMany: couponProductCreateMany,
        },
      }),
    );
  });

  it("lets a creator create a coupon", async () => {
    creatorFindUnique.mockResolvedValue({ id: "cr_mira" });
    productFindMany.mockResolvedValue([]);
    couponCreate.mockResolvedValue(couponRecord());

    const res = await request(app)
      .post("/api/v1/coupons")
      .set("Cookie", session(mira))
      .send({
        code: "summer20",
        type: "PERCENTAGE",
        value: 20,
        maxUses: 100,
        perUserLimit: 1,
        productIds: [],
      });

    expect(res.status).toBe(201);
    expect(couponCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          code: "SUMMER20",
          creatorId: "cr_mira",
          value: 20,
        }),
      }),
    );
  });

  it("rejects customers creating coupons", async () => {
    const res = await request(app)
      .post("/api/v1/coupons")
      .set("Cookie", session(leah))
      .send({
        code: "NOPE",
        type: "PERCENTAGE",
        value: 10,
      });
    expect(res.status).toBe(403);
  });

  it("rejects duplicate codes", async () => {
    creatorFindUnique.mockResolvedValue({ id: "cr_mira" });
    productFindMany.mockResolvedValue([]);
    couponCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique", {
        code: "P2002",
        clientVersion: "test",
      }),
    );
    const res = await request(app)
      .post("/api/v1/coupons")
      .set("Cookie", session(mira))
      .send({ code: "SUMMER20", type: "PERCENTAGE", value: 20 });
    expect(res.status).toBe(409);
  });

  it("blocks editing another creator's coupon", async () => {
    creatorFindUnique.mockResolvedValue({ id: "cr_kenji" });
    couponFindFirst.mockResolvedValue(null);
    const res = await request(app)
      .patch("/api/v1/coupons/cpn_1")
      .set("Cookie", session(kenji))
      .send({ value: 30 });
    expect(res.status).toBe(404);
  });
});

describe("checkout coupon preview", () => {
  beforeEach(() => {
    userFindUnique.mockReset();
    cartFindUnique.mockReset();
    productFindUnique.mockReset();
    purchaseFindUnique.mockReset();
    purchaseFindMany.mockReset().mockResolvedValue([]);
    couponFindUnique.mockReset();
    couponRedemptionCount.mockReset().mockResolvedValue(0);
  });

  it("applies a creator-wide percentage coupon to eligible items only", async () => {
    cartFindUnique.mockResolvedValue({
      id: "cart_1",
      customerId: "u_leah",
      items: [
        {
          id: "ci1",
          productId: "p_north",
          quantity: 1,
          product: {
            id: "p_north",
            title: "Northline",
            price: 2000,
            currency: "USD",
            status: "PUBLISHED",
            creatorId: "cr_mira",
            creator: { userId: "u_mira", id: "cr_mira" },
          },
        },
        {
          id: "ci2",
          productId: "p_atlas",
          quantity: 1,
          product: {
            id: "p_atlas",
            title: "Atlas",
            price: 1000,
            currency: "USD",
            status: "PUBLISHED",
            creatorId: "cr_kenji",
            creator: { userId: "u_kenji", id: "cr_kenji" },
          },
        },
      ],
    });
    couponFindUnique.mockResolvedValue(couponRecord());

    const res = await request(app)
      .post("/api/v1/checkout/preview")
      .set("Cookie", session(leah))
      .send({ couponCode: "summer20" });

    expect(res.status).toBe(200);
    // 20% of northline 2000 = 400; atlas unaffected; total 3000-400=2600
    expect(res.body.data.subtotalCents).toBe(3000);
    expect(res.body.data.discountCents).toBe(400);
    expect(res.body.data.totalCents).toBe(2600);
    expect(res.body.data.coupon.code).toBe("SUMMER20");
  });

  it("rejects expired coupons", async () => {
    cartFindUnique.mockResolvedValue({
      id: "cart_1",
      customerId: "u_leah",
      items: [
        {
          id: "ci1",
          productId: "p_north",
          quantity: 1,
          product: {
            id: "p_north",
            title: "Northline",
            price: 2000,
            currency: "USD",
            status: "PUBLISHED",
            creatorId: "cr_mira",
            creator: { userId: "u_mira", id: "cr_mira" },
          },
        },
      ],
    });
    couponFindUnique.mockResolvedValue(
      couponRecord({ expiresAt: new Date(Date.now() - 1000) }),
    );

    const res = await request(app)
      .post("/api/v1/checkout/preview")
      .set("Cookie", session(leah))
      .send({ couponCode: "SUMMER20" });
    expect(res.status).toBe(400);
    expect(res.body.errors?.code).toBe("COUPON_EXPIRED");
  });

  it("rejects below minimum order", async () => {
    cartFindUnique.mockResolvedValue({
      id: "cart_1",
      customerId: "u_leah",
      items: [
        {
          id: "ci1",
          productId: "p_north",
          quantity: 1,
          product: {
            id: "p_north",
            title: "Northline",
            price: 500,
            currency: "USD",
            status: "PUBLISHED",
            creatorId: "cr_mira",
            creator: { userId: "u_mira", id: "cr_mira" },
          },
        },
      ],
    });
    couponFindUnique.mockResolvedValue(couponRecord({ minOrderAmount: 1000 }));

    const res = await request(app)
      .post("/api/v1/checkout/preview")
      .set("Cookie", session(leah))
      .send({ couponCode: "SUMMER20" });
    expect(res.status).toBe(400);
    expect(res.body.errors?.code).toBe("MINIMUM_ORDER_NOT_MET");
  });
});
