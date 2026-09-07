import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { Prisma } from "@prisma/client";

const {
  productFindUnique,
  wishlistFindUnique,
  wishlistFindMany,
  wishlistCreate,
  wishlistDelete,
  wishlistDeleteMany,
  wishlistCount,
  purchaseFindMany,
  userFindUnique,
} = vi.hoisted(() => ({
  productFindUnique: vi.fn(),
  wishlistFindUnique: vi.fn(),
  wishlistFindMany: vi.fn(),
  wishlistCreate: vi.fn(),
  wishlistDelete: vi.fn(),
  wishlistDeleteMany: vi.fn(),
  wishlistCount: vi.fn(),
  purchaseFindMany: vi.fn(),
  userFindUnique: vi.fn(),
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
    wishlistItem: {
      findUnique: wishlistFindUnique,
      findMany: wishlistFindMany,
      create: wishlistCreate,
      delete: wishlistDelete,
      deleteMany: wishlistDeleteMany,
      count: wishlistCount,
    },
    purchase: { findMany: purchaseFindMany },
    user: { findUnique: userFindUnique },
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
const owen = { id: "u_owen", email: "owen@example.com", role: "CUSTOMER" as const };
const mira = { id: "u_mira", email: "mira@example.com", role: "CREATOR" as const };

function publishedProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: "p_atlas",
    status: "PUBLISHED",
    creator: { userId: "u_kenji" },
    ...overrides,
  };
}

function wishlistRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "w_1",
    userId: "u_leah",
    productId: "p_atlas",
    createdAt: new Date("2026-09-01"),
    product: {
      id: "p_atlas",
      title: "Atlas Next Starter",
      slug: "atlas-next-starter",
      coverImage: "https://example.com/atlas.jpg",
      price: 4900,
      currency: "USD",
      productType: "TEMPLATE",
      status: "PUBLISHED",
      shortDescription: "Ship faster.",
      createdAt: new Date("2026-08-01"),
      creator: {
        storeName: "Kenji Labs",
        slug: "kenji",
        displayName: "Kenji",
        avatar: null,
        user: { id: "u_kenji", avatarUrl: null },
      },
      reviews: [{ rating: 5 }],
    },
    ...overrides,
  };
}

describe("wishlist", () => {
  beforeEach(() => {
    productFindUnique.mockReset();
    wishlistFindUnique.mockReset();
    wishlistFindMany.mockReset();
    wishlistCreate.mockReset();
    wishlistDelete.mockReset();
    wishlistDeleteMany.mockReset();
    wishlistCount.mockReset();
    purchaseFindMany.mockReset().mockResolvedValue([]);
    userFindUnique.mockReset();
  });

  it("rejects guests", async () => {
    const res = await request(app).get("/api/v1/wishlist");
    expect(res.status).toBe(401);
  });

  it("lists only the authenticated customer's wishlist", async () => {
    wishlistCount.mockResolvedValue(1);
    wishlistFindMany.mockResolvedValue([wishlistRow()]);
    purchaseFindMany.mockResolvedValue([{ productId: "p_atlas" }]);

    const res = await request(app)
      .get("/api/v1/wishlist")
      .set("Cookie", session(leah));

    expect(res.status).toBe(200);
    expect(wishlistFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "u_leah" }),
      }),
    );
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].product.owned).toBe(true);
    expect(res.body.data.items[0].product.price).toBe(49);
    expect(JSON.stringify(res.body)).not.toContain("password");
    expect(JSON.stringify(res.body)).not.toContain("publicId");
  });

  it("adds a product idempotently", async () => {
    productFindUnique.mockResolvedValue(publishedProduct());
    wishlistFindUnique.mockResolvedValueOnce(null);
    wishlistCreate.mockResolvedValue({
      id: "w_1",
      userId: "u_leah",
      productId: "p_atlas",
      createdAt: new Date("2026-09-01"),
    });

    const created = await request(app)
      .post("/api/v1/wishlist/items")
      .set("Cookie", session(leah))
      .send({ productId: "p_atlas" });
    expect(created.status).toBe(201);
    expect(created.body.data.created).toBe(true);

    wishlistFindUnique.mockResolvedValueOnce({
      id: "w_1",
      userId: "u_leah",
      productId: "p_atlas",
      createdAt: new Date("2026-09-01"),
    });
    const again = await request(app)
      .post("/api/v1/wishlist/items")
      .set("Cookie", session(leah))
      .send({ productId: "p_atlas" });
    expect(again.status).toBe(200);
    expect(again.body.data.created).toBe(false);
    expect(wishlistCreate).toHaveBeenCalledTimes(1);
  });

  it("rejects unavailable products", async () => {
    productFindUnique.mockResolvedValue(
      publishedProduct({ status: "ARCHIVED" }),
    );
    const res = await request(app)
      .post("/api/v1/wishlist/items")
      .set("Cookie", session(leah))
      .send({ productId: "p_atlas" });
    expect(res.status).toBe(400);
  });

  it("rejects missing products", async () => {
    productFindUnique.mockResolvedValue(null);
    const res = await request(app)
      .post("/api/v1/wishlist/items")
      .set("Cookie", session(leah))
      .send({ productId: "missing" });
    expect(res.status).toBe(404);
  });

  it("blocks wishlisting your own product", async () => {
    productFindUnique.mockResolvedValue(
      publishedProduct({ creator: { userId: "u_mira" } }),
    );
    const res = await request(app)
      .post("/api/v1/wishlist/items")
      .set("Cookie", session(mira))
      .send({ productId: "p_atlas" });
    expect(res.status).toBe(403);
  });

  it("removes only the caller's wishlist item", async () => {
    wishlistFindUnique.mockResolvedValue({ id: "w_1" });
    wishlistDelete.mockResolvedValue({ id: "w_1" });
    const res = await request(app)
      .delete("/api/v1/wishlist/items/p_atlas")
      .set("Cookie", session(leah));
    expect(res.status).toBe(200);
    expect(wishlistFindUnique).toHaveBeenCalledWith({
      where: {
        userId_productId: { userId: "u_leah", productId: "p_atlas" },
      },
      select: { id: true },
    });
  });

  it("cannot remove another customer's item by guessing ids", async () => {
    wishlistFindUnique.mockResolvedValue(null);
    const res = await request(app)
      .delete("/api/v1/wishlist/items/p_atlas")
      .set("Cookie", session(owen));
    expect(res.status).toBe(404);
  });

  it("checks wishlist status", async () => {
    wishlistFindUnique.mockResolvedValue({ id: "w_1" });
    const res = await request(app)
      .get("/api/v1/wishlist/check/p_atlas")
      .set("Cookie", session(leah));
    expect(res.status).toBe(200);
    expect(res.body.data.isWishlisted).toBe(true);
  });

  it("returns bulk status without N+1", async () => {
    wishlistFindMany.mockResolvedValue([{ productId: "p_atlas" }]);
    const res = await request(app)
      .get("/api/v1/wishlist/status?productIds=p_atlas,p_northline")
      .set("Cookie", session(leah));
    expect(res.status).toBe(200);
    expect(res.body.data.statuses).toEqual({
      p_atlas: true,
      p_northline: false,
    });
  });

  it("clears the wishlist for the authenticated user only", async () => {
    wishlistDeleteMany.mockResolvedValue({ count: 2 });
    const res = await request(app)
      .delete("/api/v1/wishlist")
      .set("Cookie", session(leah));
    expect(res.status).toBe(200);
    expect(wishlistDeleteMany).toHaveBeenCalledWith({
      where: { userId: "u_leah" },
    });
    expect(res.body.data.removed).toBe(2);
  });

  it("ignores spoofed userId in the body", async () => {
    productFindUnique.mockResolvedValue(publishedProduct());
    wishlistFindUnique.mockResolvedValue(null);
    wishlistCreate.mockResolvedValue({
      id: "w_2",
      userId: "u_leah",
      productId: "p_atlas",
      createdAt: new Date("2026-09-01"),
    });

    const res = await request(app)
      .post("/api/v1/wishlist/items")
      .set("Cookie", session(leah))
      .send({ productId: "p_atlas", userId: "u_owen" });

    expect(res.status).toBe(201);
    expect(wishlistCreate).toHaveBeenCalledWith({
      data: { userId: "u_leah", productId: "p_atlas" },
    });
  });

  it("handles unique race as idempotent success", async () => {
    productFindUnique.mockResolvedValue(publishedProduct());
    wishlistFindUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "w_race",
        userId: "u_leah",
        productId: "p_atlas",
        createdAt: new Date("2026-09-01"),
      });
    wishlistCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique", {
        code: "P2002",
        clientVersion: "test",
      }),
    );

    const res = await request(app)
      .post("/api/v1/wishlist/items")
      .set("Cookie", session(leah))
      .send({ productId: "p_atlas" });
    expect(res.status).toBe(200);
    expect(res.body.data.created).toBe(false);
  });
});
