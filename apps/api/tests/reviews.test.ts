import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { Prisma } from "@prisma/client";

const {
  productFindUnique,
  reviewFindMany,
  reviewFindUnique,
  reviewCreate,
  reviewUpdate,
  reviewDelete,
  reviewCount,
  reviewAggregate,
  reviewGroupBy,
  purchaseFindUnique,
  purchaseFindMany,
  creatorFindUnique,
  userFindUnique,
  transaction,
} = vi.hoisted(() => ({
  productFindUnique: vi.fn(),
  reviewFindMany: vi.fn(),
  reviewFindUnique: vi.fn(),
  reviewCreate: vi.fn(),
  reviewUpdate: vi.fn(),
  reviewDelete: vi.fn(),
  reviewCount: vi.fn(),
  reviewAggregate: vi.fn(),
  reviewGroupBy: vi.fn(),
  purchaseFindUnique: vi.fn(),
  purchaseFindMany: vi.fn(),
  creatorFindUnique: vi.fn(),
  userFindUnique: vi.fn(),
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

vi.mock("../src/config/database", () => ({
  prisma: {
    product: { findUnique: productFindUnique },
    review: {
      findMany: reviewFindMany,
      findUnique: reviewFindUnique,
      create: reviewCreate,
      update: reviewUpdate,
      delete: reviewDelete,
      count: reviewCount,
      aggregate: reviewAggregate,
      groupBy: reviewGroupBy,
    },
    purchase: {
      findUnique: purchaseFindUnique,
      findMany: purchaseFindMany,
    },
    creatorProfile: { findUnique: creatorFindUnique },
    user: { findUnique: userFindUnique },
    adminAuditLog: { create: vi.fn().mockResolvedValue({ id: "audit_1" }) },
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

function session(user: { id: string; email: string; role: Role }) {
  const token = jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "1d" },
  );
  userFindUnique.mockResolvedValue({ ...user, status: "ACTIVE" });
  return [`${cookieName()}=${token}`];
}

const leah = { id: "u_leah", email: "leah@example.com", role: "CUSTOMER" as const };
const owen = { id: "u_owen", email: "owen@example.com", role: "CUSTOMER" as const };
const mira = { id: "u_mira", email: "mira@example.com", role: "CREATOR" as const };
const kenji = { id: "u_kenji", email: "kenji@example.com", role: "CREATOR" as const };
const admin = { id: "u_admin", email: "admin@example.com", role: "ADMIN" as const };

function product() {
  return {
    id: "p_northline",
    creatorId: "cr_mira",
    creator: { userId: "u_mira" },
  };
}

function reviewRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "rev_1",
    productId: "p_northline",
    userId: "u_leah",
    orderId: "ord_1",
    rating: 5,
    title: "Excellent resource",
    comment: "Very useful and well organized.",
    status: "PUBLISHED",
    createdAt: new Date("2026-09-01"),
    updatedAt: new Date("2026-09-01"),
    user: { id: "u_leah", name: "Leah Okonkwo", avatarUrl: null, email: "hidden@example.com", passwordHash: "hash" },
    reply: null,
    product: { id: "p_northline", title: "Northline UI System", slug: "northline-ui-system" },
    ...overrides,
  };
}

describe("reviews", () => {
  beforeEach(() => {
    productFindUnique.mockReset().mockResolvedValue(product());
    reviewFindMany.mockReset();
    reviewFindUnique.mockReset();
    reviewCreate.mockReset();
    reviewUpdate.mockReset();
    reviewDelete.mockReset();
    reviewCount.mockReset();
    reviewAggregate.mockReset();
    reviewGroupBy.mockReset();
    purchaseFindUnique.mockReset();
    purchaseFindMany.mockReset().mockResolvedValue([]);
    creatorFindUnique.mockReset();
    userFindUnique.mockReset();
    transaction.mockReset();
    transaction.mockImplementation(async (ops: Promise<unknown>[]) => Promise.all(ops));
  });

  it("lets a purchaser create a review", async () => {
    purchaseFindUnique.mockResolvedValue({
      userId: "u_leah",
      productId: "p_northline",
      orderId: "ord_1",
      order: { id: "ord_1", status: "PAID" },
    });
    reviewCreate.mockResolvedValue(reviewRecord());

    const response = await request(app)
      .post("/api/v1/products/p_northline/reviews")
      .set("Cookie", session(leah))
      .send({
        rating: 5,
        title: "Excellent resource",
        comment: "Very useful and well organized.",
      });

    expect(response.status).toBe(201);
    expect(response.body.data.review.verifiedPurchase).toBe(true);
    expect(response.body.data.review.user.email).toBeUndefined();
    expect(JSON.stringify(response.body)).not.toContain("hash");
    expect(reviewCreate.mock.calls[0]?.[0].data.userId).toBe("u_leah");
  });

  it("rejects a non-purchaser", async () => {
    purchaseFindUnique.mockResolvedValue(null);
    const response = await request(app)
      .post("/api/v1/products/p_northline/reviews")
      .set("Cookie", session(owen))
      .send({
        rating: 5,
        title: "Looks fine",
        comment: "I only viewed this product in the catalog.",
      });
    expect(response.status).toBe(403);
    expect(reviewCreate).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated reviewer", async () => {
    const response = await request(app)
      .post("/api/v1/products/p_northline/reviews")
      .send({
        rating: 5,
        title: "Excellent resource",
        comment: "Very useful and well organized.",
      });
    expect(response.status).toBe(401);
  });

  it("rejects a duplicate review", async () => {
    purchaseFindUnique.mockResolvedValue({
      orderId: "ord_1",
      order: { status: "PAID" },
    });
    reviewCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique", {
        code: "P2002",
        clientVersion: "6.19.0",
      }),
    );
    const response = await request(app)
      .post("/api/v1/products/p_northline/reviews")
      .set("Cookie", session(leah))
      .send({
        rating: 5,
        title: "Excellent resource",
        comment: "Very useful and well organized.",
      });
    expect(response.status).toBe(409);
  });

  it("rejects an invalid rating", async () => {
    const cookie = session(leah);
    const response = await request(app)
      .post("/api/v1/products/p_northline/reviews")
      .set("Cookie", cookie)
      .send({
        rating: 4.5,
        title: "Almost",
        comment: "Fractional stars should not be accepted here.",
      });
    expect(response.status).toBe(400);
    expect(reviewCreate).not.toHaveBeenCalled();
  });

  it("rejects a short comment", async () => {
    const response = await request(app)
      .post("/api/v1/products/p_northline/reviews")
      .set("Cookie", session(leah))
      .send({ rating: 5, title: "Hi", comment: "Too short" });
    expect(response.status).toBe(400);
  });

  it("lets the reviewer update their own review", async () => {
    reviewFindUnique.mockResolvedValue(reviewRecord());
    reviewUpdate.mockResolvedValue(reviewRecord({ title: "Updated title" }));
    const response = await request(app)
      .patch("/api/v1/reviews/rev_1")
      .set("Cookie", session(leah))
      .send({ title: "Updated title", comment: "Still useful after another week of use." });
    expect(response.status).toBe(200);
    expect(reviewUpdate).toHaveBeenCalled();
  });

  it("does not let a reviewer update someone else's review", async () => {
    reviewFindUnique.mockResolvedValue(reviewRecord());
    const response = await request(app)
      .patch("/api/v1/reviews/rev_1")
      .set("Cookie", session(owen))
      .send({ title: "Hijack", comment: "This should not work for another customer." });
    expect(response.status).toBe(403);
    expect(reviewUpdate).not.toHaveBeenCalled();
  });

  it("does not let a creator modify a customer review", async () => {
    reviewFindUnique.mockResolvedValue(reviewRecord());
    const response = await request(app)
      .patch("/api/v1/reviews/rev_1")
      .set("Cookie", session(mira))
      .send({ title: "Nope", comment: "Creators should not rewrite buyer reviews." });
    expect(response.status).toBe(403);
  });

  it("lets the reviewer delete their own review", async () => {
    reviewFindUnique.mockResolvedValue(reviewRecord());
    reviewDelete.mockResolvedValue(reviewRecord());
    const response = await request(app)
      .delete("/api/v1/reviews/rev_1")
      .set("Cookie", session(leah));
    expect(response.status).toBe(200);
    expect(reviewDelete).toHaveBeenCalled();
  });

  it("does not let a reviewer delete someone else's review", async () => {
    reviewFindUnique.mockResolvedValue(reviewRecord());
    const response = await request(app)
      .delete("/api/v1/reviews/rev_1")
      .set("Cookie", session(owen));
    expect(response.status).toBe(403);
    expect(reviewDelete).not.toHaveBeenCalled();
  });

  it("lists published reviews without private user data", async () => {
    reviewCount.mockResolvedValue(1);
    reviewFindMany.mockResolvedValue([reviewRecord({ status: "PUBLISHED" })]);
    purchaseFindMany.mockResolvedValue([{ userId: "u_leah" }]);
    const response = await request(app).get("/api/v1/products/p_northline/reviews");
    expect(response.status).toBe(200);
    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.items[0].user.email).toBeUndefined();
    expect(reviewFindMany.mock.calls[0]?.[0].where.status).toBe("PUBLISHED");
    expect(JSON.stringify(response.body)).not.toContain("hash");
  });

  it("lets a creator list reviews for their own products only", async () => {
    creatorFindUnique.mockResolvedValue({ id: "cr_mira", userId: "u_mira" });
    reviewCount.mockResolvedValue(0);
    reviewFindMany.mockResolvedValue([]);
    reviewAggregate.mockResolvedValue({ _avg: { rating: null }, _count: { _all: 0 } });
    const response = await request(app)
      .get("/api/v1/creators/me/reviews")
      .set("Cookie", session(mira));
    expect(response.status).toBe(200);
    expect(reviewFindMany.mock.calls[0]?.[0].where.product).toEqual({ creatorId: "cr_mira" });
  });

  it("does not let a creator manage another store's reviews", async () => {
    creatorFindUnique.mockResolvedValue({ id: "cr_kenji", userId: "u_kenji" });
    reviewFindUnique.mockResolvedValue({
      id: "rev_1",
      product: { creatorId: "cr_mira" },
    });
    const response = await request(app)
      .post("/api/v1/reviews/rev_1/reply")
      .set("Cookie", session(kenji))
      .send({ comment: "This is not my product." });
    expect(response.status).toBe(403);
  });

  it("lets an admin hide a review", async () => {
    reviewFindUnique.mockResolvedValue(reviewRecord());
    reviewUpdate.mockResolvedValue(reviewRecord({ status: "HIDDEN" }));
    const response = await request(app)
      .patch("/api/v1/admin/reviews/rev_1")
      .set("Cookie", session(admin))
      .send({ status: "HIDDEN" });
    expect(response.status).toBe(200);
    expect(reviewUpdate.mock.calls[0]?.[0].data.status).toBe("HIDDEN");
  });

  it("does not let a customer moderate reviews", async () => {
    const response = await request(app)
      .patch("/api/v1/admin/reviews/rev_1")
      .set("Cookie", session(leah))
      .send({ status: "HIDDEN" });
    expect(response.status).toBe(403);
  });
});
