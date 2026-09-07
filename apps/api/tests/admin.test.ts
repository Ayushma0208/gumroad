import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";

const {
  userFindUnique,
  userFindMany,
  userCount,
  userUpdate,
  creatorCount,
  creatorFindMany,
  creatorFindUnique,
  productCount,
  productFindMany,
  productFindUnique,
  productUpdate,
  productGroupBy,
  orderCount,
  orderFindMany,
  orderFindUnique,
  orderFindFirst,
  orderAggregate,
  paymentGroupBy,
  reviewCount,
  reviewFindMany,
  reviewFindUnique,
  reviewUpdate,
  reviewDelete,
  reportCount,
  reportFindMany,
  reportFindUnique,
  reportCreate,
  reportUpdate,
  auditCreate,
  auditFindMany,
  auditCount,
  categoryFindMany,
  categoryFindUnique,
  queryRaw,
  transaction,
} = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  userFindMany: vi.fn(),
  userCount: vi.fn(),
  userUpdate: vi.fn(),
  creatorCount: vi.fn(),
  creatorFindMany: vi.fn(),
  creatorFindUnique: vi.fn(),
  productCount: vi.fn(),
  productFindMany: vi.fn(),
  productFindUnique: vi.fn(),
  productUpdate: vi.fn(),
  productGroupBy: vi.fn(),
  orderCount: vi.fn(),
  orderFindMany: vi.fn(),
  orderFindUnique: vi.fn(),
  orderFindFirst: vi.fn(),
  orderAggregate: vi.fn(),
  paymentGroupBy: vi.fn(),
  reviewCount: vi.fn(),
  reviewFindMany: vi.fn(),
  reviewFindUnique: vi.fn(),
  reviewUpdate: vi.fn(),
  reviewDelete: vi.fn(),
  reportCount: vi.fn(),
  reportFindMany: vi.fn(),
  reportFindUnique: vi.fn(),
  reportCreate: vi.fn(),
  reportUpdate: vi.fn(),
  auditCreate: vi.fn(),
  auditFindMany: vi.fn(),
  auditCount: vi.fn(),
  categoryFindMany: vi.fn(),
  categoryFindUnique: vi.fn(),
  queryRaw: vi.fn(),
  transaction: vi.fn(),
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
    user: {
      findUnique: userFindUnique,
      findMany: userFindMany,
      count: userCount,
      update: userUpdate,
    },
    creatorProfile: {
      count: creatorCount,
      findMany: creatorFindMany,
      findUnique: creatorFindUnique,
    },
    product: {
      count: productCount,
      findMany: productFindMany,
      findUnique: productFindUnique,
      update: productUpdate,
      groupBy: productGroupBy,
    },
    order: {
      count: orderCount,
      findMany: orderFindMany,
      findUnique: orderFindUnique,
      findFirst: orderFindFirst,
      aggregate: orderAggregate,
    },
    payment: { groupBy: paymentGroupBy },
    review: {
      count: reviewCount,
      findMany: reviewFindMany,
      findUnique: reviewFindUnique,
      update: reviewUpdate,
      delete: reviewDelete,
      aggregate: vi.fn().mockResolvedValue({ _avg: { rating: null }, _count: { _all: 0 } }),
    },
    report: {
      count: reportCount,
      findMany: reportFindMany,
      findUnique: reportFindUnique,
      create: reportCreate,
      update: reportUpdate,
    },
    adminAuditLog: {
      create: auditCreate,
      findMany: auditFindMany,
      count: auditCount,
    },
    category: {
      findMany: categoryFindMany,
      findUnique: categoryFindUnique,
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
    },
    $queryRaw: queryRaw,
    $transaction: transaction,
    $connect: vi.fn(),
  },
}));

vi.mock("../src/modules/notifications/notification.events", () => ({
  notifyOrderPaid: vi.fn().mockResolvedValue(undefined),
  notifyReviewCreated: vi.fn().mockResolvedValue(undefined),
  notifyProductStatusChange: vi.fn().mockResolvedValue(undefined),
}));

import { createApp } from "../src/app";
import { cookieName } from "../src/config/cookies";

const app = createApp();

function session(user: { id: string; email: string; role: Role; status?: string }) {
  const token = jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "1d" },
  );
  userFindUnique.mockResolvedValue({
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status ?? "ACTIVE",
  });
  return [`${cookieName()}=${token}`];
}

const admin = { id: "u_admin", email: "admin@example.com", role: "ADMIN" as const };
const mira = { id: "u_mira", email: "mira@example.com", role: "CREATOR" as const };
const leah = { id: "u_leah", email: "leah@example.com", role: "CUSTOMER" as const };

describe("admin authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    orderAggregate.mockResolvedValue({ _sum: { totalAmount: 0 }, _count: { _all: 0 } });
    userCount.mockResolvedValue(10);
    creatorCount.mockResolvedValue(3);
    productCount.mockResolvedValue(5);
    reportCount.mockResolvedValue(1);
    reviewCount.mockResolvedValue(0);
    paymentGroupBy.mockResolvedValue([]);
    orderFindFirst.mockResolvedValue({ currency: "USD" });
    auditFindMany.mockResolvedValue([]);
    queryRaw.mockResolvedValue([]);
    transaction.mockImplementation(async (arg: unknown) => {
      if (typeof arg === "function") {
        return arg({
          user: { update: userUpdate },
          product: { update: productUpdate },
          report: { update: reportUpdate },
          adminAuditLog: { create: auditCreate },
        });
      }
      if (Array.isArray(arg)) return Promise.all(arg);
      return arg;
    });
  });

  it("denies customers", async () => {
    const res = await request(app)
      .get("/api/v1/admin/overview")
      .set("Cookie", session(leah));
    expect(res.status).toBe(403);
  });

  it("denies creators", async () => {
    const res = await request(app)
      .get("/api/v1/admin/users")
      .set("Cookie", session(mira));
    expect(res.status).toBe(403);
  });

  it("allows admins overview", async () => {
    const res = await request(app)
      .get("/api/v1/admin/analytics/overview?range=30d")
      .set("Cookie", session(admin));
    expect(res.status).toBe(200);
    expect(res.body.data.metrics.totalUsers).toBe(10);
    expect(res.body.data.metrics.grossRevenueCents).toBe(0);
  });

  it("lists users for admin", async () => {
    userCount.mockResolvedValue(1);
    userFindMany.mockResolvedValue([
      {
        id: "u_leah",
        name: "Leah",
        email: "leah@example.com",
        role: "CUSTOMER",
        status: "ACTIVE",
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        creatorProfile: null,
        _count: { orders: 1, purchases: 1 },
      },
    ]);
    const res = await request(app)
      .get("/api/v1/admin/users")
      .set("Cookie", session(admin));
    expect(res.status).toBe(200);
    expect(res.body.data.items[0].email).toBe("leah@example.com");
    expect(res.body.data.items[0].passwordHash).toBeUndefined();
  });

  it("suspends a user and writes audit log", async () => {
    userFindUnique
      .mockResolvedValueOnce({
        id: admin.id,
        email: admin.email,
        role: "ADMIN",
        status: "ACTIVE",
      })
      .mockResolvedValueOnce({
        id: "u_leah",
        email: "leah@example.com",
        role: "CUSTOMER",
        status: "ACTIVE",
        creatorProfile: null,
      })
      .mockResolvedValueOnce({
        id: "u_leah",
        name: "Leah",
        email: "leah@example.com",
        role: "CUSTOMER",
        status: "SUSPENDED",
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        creatorProfile: null,
        _count: { orders: 0, purchases: 0, reviews: 0 },
      });

    const res = await request(app)
      .patch("/api/v1/admin/users/u_leah/status")
      .set("Cookie", session(admin))
      .send({ status: "SUSPENDED" });

    expect(res.status).toBe(200);
    expect(auditCreate).toHaveBeenCalled();
    expect(res.body.data.user.status).toBe("SUSPENDED");
  });

  it("archives a product with audit", async () => {
    userFindUnique.mockResolvedValue({
      id: admin.id,
      email: admin.email,
      role: "ADMIN",
      status: "ACTIVE",
    });
    productFindUnique
      .mockResolvedValueOnce({
        id: "p1",
        title: "Kit",
        status: "PUBLISHED",
        slug: "kit",
      })
      .mockResolvedValueOnce({
        id: "p1",
        title: "Kit",
        slug: "kit",
        shortDescription: "",
        description: "",
        price: 1000,
        currency: "USD",
        productType: "DIGITAL_DOWNLOAD",
        status: "ARCHIVED",
        coverImage: "https://example.com/a.jpg",
        featured: false,
        trending: false,
        editorsPick: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        creator: {
          id: "cr1",
          storeName: "Mira",
          slug: "mira",
          user: { id: "u_mira", email: "mira@example.com", status: "ACTIVE" },
        },
        category: { id: "c1", label: "UI", slug: "ui" },
        images: [],
        files: [],
        _count: { reviews: 0, wishlistItems: 0, orderItems: 0 },
      });
    queryRaw.mockResolvedValue([{ revenue: 0, units: 0, orders: 0 }]);

    const res = await request(app)
      .patch("/api/v1/admin/products/p1/status")
      .set("Cookie", session(admin))
      .send({ status: "ARCHIVED" });

    expect(res.status).toBe(200);
    expect(auditCreate).toHaveBeenCalled();
  });
});

describe("reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transaction.mockImplementation(async (arg: unknown) => {
      if (typeof arg === "function") {
        return arg({
          report: { update: reportUpdate },
          adminAuditLog: { create: auditCreate },
        });
      }
      return arg;
    });
  });

  it("lets authenticated customers create reports", async () => {
    userFindUnique.mockResolvedValue({
      id: leah.id,
      email: leah.email,
      role: "CUSTOMER",
      status: "ACTIVE",
    });
    productFindUnique.mockResolvedValue({ id: "p1" });
    reportFindUnique.mockResolvedValue(null);
    reportCreate.mockResolvedValue({
      id: "r1",
      reporterId: leah.id,
      targetType: "PRODUCT",
      targetId: "p1",
      reason: "SPAM",
      description: null,
      status: "OPEN",
      createdAt: new Date(),
      updatedAt: new Date(),
      resolvedAt: null,
      resolutionNote: null,
      resolvedById: null,
    });
    // serializeReport second lookups
    reportFindUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "r1",
        reporterId: leah.id,
        targetType: "PRODUCT",
        targetId: "p1",
        reason: "SPAM",
        description: null,
        status: "OPEN",
        createdAt: new Date(),
        updatedAt: new Date(),
        resolvedAt: null,
        resolutionNote: null,
        resolvedById: null,
        reporter: { id: leah.id, name: "Leah", email: leah.email },
        resolvedBy: null,
      });

    const res = await request(app)
      .post("/api/v1/reports")
      .set("Cookie", session(leah))
      .send({
        targetType: "PRODUCT",
        targetId: "p1",
        reason: "SPAM",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.report.id).toBe("r1");
  });

  it("denies non-admin report resolution", async () => {
    const res = await request(app)
      .patch("/api/v1/admin/reports/r1")
      .set("Cookie", session(mira))
      .send({ status: "RESOLVED" });
    expect(res.status).toBe(403);
  });
});
