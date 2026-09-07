import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

const {
  productFindMany,
  productCount,
  productGroupBy,
  categoryFindMany,
  creatorFindMany,
  transaction,
} = vi.hoisted(() => ({
  productFindMany: vi.fn(),
  productCount: vi.fn(),
  productGroupBy: vi.fn(),
  categoryFindMany: vi.fn(),
  creatorFindMany: vi.fn(),
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
    product: {
      findMany: productFindMany,
      count: productCount,
      groupBy: productGroupBy,
    },
    category: { findMany: categoryFindMany },
    creatorProfile: { findMany: creatorFindMany },
    $transaction: transaction,
    $connect: vi.fn(),
  },
}));

import { createApp } from "../src/app";
import { scoreProductRelevance } from "../src/modules/search/search.service";

const app = createApp();

function publishedProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: "p1",
    title: "Notion Creator Kit",
    slug: "notion-creator-kit",
    shortDescription: "Templates for makers",
    description: "A long description about workflows",
    price: 4900,
    currency: "USD",
    productType: "TEMPLATE",
    status: "PUBLISHED",
    coverImage: "https://example.com/cover.jpg",
    featured: false,
    trending: true,
    editorsPick: false,
    createdAt: new Date("2026-08-01"),
    updatedAt: new Date("2026-08-01"),
    category: {
      id: "c1",
      slug: "productivity",
      label: "Productivity",
      description: "",
      imageUrl: "",
      icon: "productivity",
      sortOrder: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    creator: {
      id: "cp1",
      storeName: "Notion Experts",
      displayName: "Mira",
      slug: "mira",
      bio: "",
      description: null,
      avatar: null,
      banner: null,
      website: null,
      category: "design",
      instagram: null,
      twitter: null,
      linkedin: null,
      youtube: null,
      github: null,
      userId: "u1",
      createdAt: new Date(),
      updatedAt: new Date(),
      user: { id: "u1", name: "Mira", avatarUrl: null },
    },
    images: [],
    files: [],
    reviews: [{ rating: 5 }],
    _count: { files: 1, orderItems: 12 },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  transaction.mockImplementation(async (arg: unknown) => {
    if (Array.isArray(arg)) return Promise.all(arg);
    if (typeof arg === "function") return arg({});
    return arg;
  });
});

describe("scoreProductRelevance", () => {
  const base = publishedProduct();

  it("ranks exact title highest", () => {
    const exact = scoreProductRelevance("notion creator kit", base);
    const partial = scoreProductRelevance("notion", base);
    expect(exact).toBeGreaterThan(partial);
  });

  it("scores creator matches above description-only", () => {
    const byCreator = scoreProductRelevance("notion experts", base);
    const byDesc = scoreProductRelevance("workflows", base);
    expect(byCreator).toBeGreaterThan(byDesc);
  });
});

describe("GET /api/v1/search", () => {
  it("rejects oversized limits", async () => {
    const res = await request(app).get("/api/v1/search?limit=9999");
    expect(res.status).toBe(400);
  });

  it("rejects minPrice greater than maxPrice", async () => {
    const res = await request(app).get(
      "/api/v1/search?minPrice=5000&maxPrice=1000",
    );
    expect(res.status).toBe(400);
  });

  it("returns empty structured payload for empty query", async () => {
    productCount.mockResolvedValue(0);
    productFindMany.mockResolvedValue([]);
    transaction.mockResolvedValue([0, []]);

    const res = await request(app).get("/api/v1/search");
    expect(res.status).toBe(200);
    expect(res.body.data.products).toEqual([]);
    expect(res.body.data.creators).toEqual([]);
    expect(res.body.data.categories).toEqual([]);
    expect(res.body.data.pagination.total).toBe(0);
  });

  it("searches products with relevance ordering", async () => {
    const exact = publishedProduct({
      id: "p_exact",
      title: "Notion",
      slug: "notion",
    });
    const partial = publishedProduct({
      id: "p_partial",
      title: "Advanced Notion Pack",
      slug: "advanced-notion-pack",
      _count: { files: 1, orderItems: 2 },
    });
    productFindMany.mockResolvedValue([partial, exact]);
    creatorFindMany.mockResolvedValue([]);
    categoryFindMany.mockResolvedValue([]);
    productGroupBy.mockResolvedValue([]);

    const res = await request(app).get("/api/v1/search?q=notion");
    expect(res.status).toBe(200);
    expect(res.body.data.products[0].title).toBe("Notion");
    expect(res.body.data.pagination.total).toBe(2);
  });

  it("never returns unpublished products from search where", async () => {
    productFindMany.mockResolvedValue([]);
    creatorFindMany.mockResolvedValue([]);
    categoryFindMany.mockResolvedValue([]);

    await request(app).get("/api/v1/search?q=secret");
    expect(productFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "PUBLISHED" }),
      }),
    );
  });
});

describe("GET /api/v1/search/suggest", () => {
  it("returns empty for short queries", async () => {
    const res = await request(app).get("/api/v1/search/suggest?q=n");
    expect(res.status).toBe(200);
    expect(res.body.data.products).toEqual([]);
  });

  it("returns grouped suggestions", async () => {
    productFindMany.mockResolvedValue([
      {
        id: "p1",
        title: "Notion Kit",
        slug: "notion-kit",
        coverImage: "https://example.com/a.jpg",
        price: 1000,
        currency: "USD",
        creator: { storeName: "Mira", slug: "mira" },
      },
    ]);
    creatorFindMany.mockResolvedValue([
      {
        id: "cp1",
        storeName: "Notion Experts",
        displayName: "Mira",
        slug: "mira",
        bio: "",
        description: null,
        avatar: null,
        banner: null,
        website: null,
        category: null,
        instagram: null,
        twitter: null,
        linkedin: null,
        youtube: null,
        github: null,
        userId: "u1",
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: "u1", name: "Mira", avatarUrl: null },
        _count: { products: 3 },
      },
    ]);
    categoryFindMany.mockResolvedValue([
      {
        id: "c1",
        slug: "productivity",
        label: "Productivity",
        description: "",
        icon: "productivity",
        sortOrder: 0,
      },
    ]);
    productGroupBy.mockResolvedValue([{ categoryId: "c1", _count: { _all: 4 } }]);

    const res = await request(app).get("/api/v1/search/suggest?q=not");
    expect(res.status).toBe(200);
    expect(res.body.data.products[0].title).toBe("Notion Kit");
    expect(res.body.data.creators[0].storeName).toBe("Notion Experts");
    expect(res.body.data.categories[0].label).toBe("Productivity");
    expect(res.body.data.creators[0]).not.toHaveProperty("email");
  });
});

describe("product list unpublished safety", () => {
  it("list endpoint where always forces PUBLISHED for public search", async () => {
    productCount.mockResolvedValue(0);
    productFindMany.mockResolvedValue([]);
    transaction.mockResolvedValue([0, []]);

    const res = await request(app).get("/api/v1/products?search=draft-only");
    expect(res.status).toBe(200);
    expect(productFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "PUBLISHED" }),
      }),
    );
  });
});
