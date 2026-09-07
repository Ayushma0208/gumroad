import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";

const {
  creatorFindUnique,
  creatorFindMany,
  creatorUpdate,
  productFindMany,
  productCount,
  userFindUnique,
  transaction,
  reviewAggregate,
} = vi.hoisted(() => ({
  creatorFindUnique: vi.fn(),
  creatorFindMany: vi.fn(),
  creatorUpdate: vi.fn(),
  productFindMany: vi.fn(),
  productCount: vi.fn(),
  userFindUnique: vi.fn(),
  transaction: vi.fn(),
  reviewAggregate: vi.fn(),
}));

vi.mock("../src/config/cloudinary", () => ({
  destroyCloudinaryAsset: vi.fn().mockResolvedValue({ result: "ok" }),
  uploadPublicImage: vi.fn(),
  uploadPrivateFile: vi.fn(),
  signedDeliveryUrl: vi.fn(),
  cloudinaryFolders: {
    productImages: (id: string) => `marketplace/products/${id}/images`,
    productFiles: (id: string) => `marketplace/products/${id}/files`,
    creatorAvatar: (id: string) => `marketplace/creators/${id}/avatar`,
    creatorBanner: (id: string) => `marketplace/creators/${id}/banner`,
  },
}));

vi.mock("../src/config/database", () => ({
  prisma: {
    creatorProfile: {
      findUnique: creatorFindUnique,
      findMany: creatorFindMany,
      update: creatorUpdate,
    },
    product: {
      findMany: productFindMany,
      count: productCount,
    },
    user: { findUnique: userFindUnique },
    review: {
      aggregate: reviewAggregate,
      groupBy: vi.fn(),
    },
    $transaction: transaction,
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

const miraUser = {
  id: "u_mira",
  email: "mira@example.com",
  role: "CREATOR" as const,
};
const kenjiUser = {
  id: "u_kenji",
  email: "kenji@example.com",
  role: "CREATOR" as const,
};
const leahUser = {
  id: "u_leah",
  email: "leah@example.com",
  role: "CUSTOMER" as const,
};

function creatorProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: "cr_mira",
    userId: "u_mira",
    displayName: "Mira Chen",
    storeName: "Northline Studio",
    slug: "mira",
    bio: "Typography and interface systems for studios that still print.",
    description: "Longer notes about the studio and how the kits are made.",
    avatar: "https://images.example.com/mira.jpg",
    avatarPublicId: "marketplace/creators/cr_mira/avatar/secret",
    banner: "https://images.example.com/mira-banner.jpg",
    bannerPublicId: "marketplace/creators/cr_mira/banner/secret",
    website: "https://northline.studio",
    instagram: "https://instagram.com/northline",
    twitter: "https://x.com/northline",
    linkedin: null,
    youtube: null,
    github: null,
    category: "design",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    user: {
      id: "u_mira",
      name: "Mira Chen",
      avatarUrl: "https://images.example.com/mira.jpg",
      passwordHash: "should-never-leak",
    },
    _count: { products: 2 },
    ...overrides,
  };
}

function publishedProduct() {
  return {
    id: "p_northline",
    creatorId: "cr_mira",
    categoryId: "cat_design",
    title: "Northline UI System",
    slug: "northline-ui-system",
    shortDescription: "A complete Figma kit for modern SaaS products.",
    description: "Two hundred components.",
    price: 7900,
    currency: "USD",
    productType: "TEMPLATE",
    status: "PUBLISHED",
    coverImage: "https://images.example.com/cover.jpg",
    featured: true,
    trending: false,
    editorsPick: false,
    createdAt: new Date("2026-01-02"),
    updatedAt: new Date("2026-01-03"),
    category: {
      id: "cat_design",
      slug: "design",
      label: "Design",
      description: "UI kits",
      imageUrl: "https://images.example.com/design.jpg",
      icon: "design",
      sortOrder: 0,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    },
    creator: creatorProfile(),
    images: [{ url: "https://images.example.com/cover.jpg", sortOrder: 0 }],
    files: [
      {
        id: "file_1",
        fileName: "northline.zip",
        fileSize: 12_000_000,
        mimeType: "application/zip",
        format: "zip",
        publicId: "marketplace/products/northline/files/source",
      },
    ],
    reviews: [{ rating: 5 }],
    _count: { orderItems: 18, files: 1 },
  };
}

describe("creator storefront", () => {
  beforeEach(() => {
    creatorFindUnique.mockReset();
    creatorFindMany.mockReset();
    creatorUpdate.mockReset();
    productFindMany.mockReset();
    productCount.mockReset();
    userFindUnique.mockReset();
    transaction.mockReset();
    reviewAggregate.mockReset();
    reviewAggregate.mockResolvedValue({
      _avg: { rating: 5 },
      _count: { _all: 2 },
    });
    transaction.mockImplementation(async (ops: Promise<unknown>[]) => Promise.all(ops));
  });

  it("returns a public creator profile", async () => {
    creatorFindUnique.mockResolvedValue(creatorProfile());

    const response = await request(app).get("/api/v1/creators/mira");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.creator.storeName).toBe("Northline Studio");
    expect(response.body.data.creator.slug).toBe("mira");
    expect(response.body.data.stats.productCount).toBe(2);
    expect(response.body.data.creator.socialLinks.instagram).toBe(
      "https://instagram.com/northline",
    );
    expect(response.body.data.creator.passwordHash).toBeUndefined();
    expect(response.body.data.creator.avatarPublicId).toBeUndefined();
    expect(response.body.data.creator.bannerPublicId).toBeUndefined();
    expect(JSON.stringify(response.body)).not.toContain("should-never-leak");
    expect(JSON.stringify(response.body)).not.toContain("cloudinary_secret");
    expect(JSON.stringify(response.body)).not.toContain("avatar/secret");
  });

  it("returns 404 for an unknown creator", async () => {
    creatorFindUnique.mockResolvedValue(null);

    const response = await request(app).get("/api/v1/creators/missing-store");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it("lists only published products and omits private file metadata", async () => {
    creatorFindUnique.mockResolvedValue(creatorProfile());
    productCount.mockResolvedValue(1);
    productFindMany.mockResolvedValue([publishedProduct()]);

    const response = await request(app).get("/api/v1/creators/mira/products");

    expect(response.status).toBe(200);
    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.items[0].title).toBe("Northline UI System");
    expect(response.body.data.items[0].files).toBeUndefined();
    expect(JSON.stringify(response.body)).not.toContain("marketplace/products/northline/files/source");
    expect(productFindMany.mock.calls[0]?.[0].where.status).toBe("PUBLISHED");
    expect(productFindMany.mock.calls[0]?.[0].where.creator).toEqual({ slug: "mira" });
  });

  it("does not query products when the creator is missing", async () => {
    creatorFindUnique.mockResolvedValue(null);

    const response = await request(app).get("/api/v1/creators/ghost/products");

    expect(response.status).toBe(404);
    expect(productFindMany).not.toHaveBeenCalled();
  });

  it("lets the authenticated creator update their own profile", async () => {
    const updated = creatorProfile({
      storeName: "Northline",
      bio: "Systems, type, and kits for product teams who still print.",
    });
    creatorFindUnique
      .mockResolvedValueOnce(creatorProfile())
      .mockResolvedValueOnce({
        ...miraUser,
        name: "Mira Chen",
        avatarUrl: null,
        creatorProfile: updated,
      });
    creatorUpdate.mockResolvedValue(updated);

    const cookie = session(miraUser);
    const response = await request(app)
      .patch("/api/v1/creators/me")
      .set("Cookie", cookie)
      .send({
        storeName: "Northline",
        bio: "Systems, type, and kits for product teams who still print.",
      });

    expect(response.status).toBe(200);
    expect(creatorUpdate.mock.calls[0]?.[0].where).toEqual({ id: "cr_mira" });
    expect(creatorUpdate.mock.calls[0]?.[0].data.storeName).toBe("Northline");
    expect(response.body.data.creator.storeName).toBe("Northline");
  });

  it("cannot update another creator because identity comes from the session", async () => {
    creatorFindUnique.mockResolvedValue(
      creatorProfile({ id: "cr_kenji", userId: "u_kenji", slug: "kenji" }),
    );
    creatorUpdate.mockResolvedValue(
      creatorProfile({ id: "cr_kenji", userId: "u_kenji", slug: "kenji" }),
    );

    const cookie = session(kenjiUser);
    await request(app)
      .patch("/api/v1/creators/me")
      .set("Cookie", cookie)
      .send({
        storeName: "Hijacked",
        bio: "This should only apply to the signed-in creator profile.",
        creatorId: "cr_mira",
        userId: "u_mira",
      });

    expect(creatorFindUnique.mock.calls[0]?.[0].where).toEqual({ userId: "u_kenji" });
    expect(creatorUpdate.mock.calls[0]?.[0].where.id).toBe("cr_kenji");
  });

  it("rejects a customer updating creator settings", async () => {
    const cookie = session(leahUser);
    const response = await request(app)
      .patch("/api/v1/creators/me")
      .set("Cookie", cookie)
      .send({
        storeName: "Nope",
        bio: "Customers should not be able to edit a creator storefront.",
      });

    expect(response.status).toBe(403);
    expect(creatorUpdate).not.toHaveBeenCalled();
  });

  it("rejects an invalid slug", async () => {
    const cookie = session(miraUser);
    const response = await request(app)
      .patch("/api/v1/creators/me")
      .set("Cookie", cookie)
      .send({ slug: "Design Studio" });

    expect(response.status).toBe(400);
    expect(creatorUpdate).not.toHaveBeenCalled();
  });

  it("rejects a duplicate slug without changing it", async () => {
    creatorFindUnique
      .mockResolvedValueOnce(creatorProfile())
      .mockResolvedValueOnce(creatorProfile({ id: "cr_kenji", userId: "u_kenji", slug: "kenji" }));

    const cookie = session(miraUser);
    const response = await request(app)
      .patch("/api/v1/creators/me")
      .set("Cookie", cookie)
      .send({ slug: "kenji" });

    expect(response.status).toBe(409);
    expect(response.body.message).toMatch(/already taken/i);
    expect(creatorUpdate).not.toHaveBeenCalled();
  });

  it("rejects a malformed social URL", async () => {
    const cookie = session(miraUser);
    const response = await request(app)
      .patch("/api/v1/creators/me")
      .set("Cookie", cookie)
      .send({ instagram: "not-a-url" });

    expect(response.status).toBe(400);
    expect(creatorUpdate).not.toHaveBeenCalled();
  });

  it("checks slug availability", async () => {
    creatorFindUnique.mockResolvedValue(creatorProfile());
    const taken = await request(app).get("/api/v1/creators/slug/check?slug=mira");
    expect(taken.body.data.available).toBe(false);

    creatorFindUnique.mockResolvedValue(null);
    const free = await request(app).get("/api/v1/creators/store-slug?slug=new-studio");
    expect(free.body.data.available).toBe(true);
  });
});
