import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";

const {
  productFindMany,
  productFindUnique,
  productFindFirst,
  productCount,
  productCreate,
  productUpdate,
  productDelete,
  categoryFindUnique,
  categoryFindFirst,
  categoryFindMany,
  categoryCreate,
  categoryUpdate,
  categoryDelete,
  creatorFindUnique,
  userFindUnique,
  productImageDeleteMany,
  productFileCount,
  transaction,
} = vi.hoisted(() => ({
  productFindMany: vi.fn(),
  productFindUnique: vi.fn(),
  productFindFirst: vi.fn(),
  productCount: vi.fn(),
  productCreate: vi.fn(),
  productUpdate: vi.fn(),
  productDelete: vi.fn(),
  categoryFindUnique: vi.fn(),
  categoryFindFirst: vi.fn(),
  categoryFindMany: vi.fn(),
  categoryCreate: vi.fn(),
  categoryUpdate: vi.fn(),
  categoryDelete: vi.fn(),
  creatorFindUnique: vi.fn(),
  userFindUnique: vi.fn(),
  productImageDeleteMany: vi.fn(),
  productFileCount: vi.fn(),
  transaction: vi.fn(),
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
    product: {
      findMany: productFindMany,
      findUnique: productFindUnique,
      findFirst: productFindFirst,
      count: productCount,
      create: productCreate,
      update: productUpdate,
      delete: productDelete,
    },
    category: {
      findUnique: categoryFindUnique,
      findFirst: categoryFindFirst,
      findMany: categoryFindMany,
      create: categoryCreate,
      update: categoryUpdate,
      delete: categoryDelete,
    },
    creatorProfile: { findUnique: creatorFindUnique },
    user: { findUnique: userFindUnique },
    productImage: { deleteMany: productImageDeleteMany },
    productFile: { count: productFileCount },
    $transaction: transaction,
    $connect: vi.fn(),
  },
}));

import { createApp } from "../src/app";
import { cookieName } from "../src/config/cookies";

const app = createApp();

const designCategory = {
  id: "cat_design",
  slug: "design",
  label: "Design",
  description: "UI kits, Figma files, and brand systems.",
  imageUrl: "https://images.example.com/design.jpg",
  icon: "design",
  sortOrder: 0,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  _count: { products: 4 },
};

function creator(id = "cr_mira", userId = "u_mira") {
  return {
    id,
    userId,
    displayName: "Mira Chen",
    storeName: "Northline Studio",
    slug: "mira",
    bio: "Typography and interface systems.",
    avatar: "https://images.example.com/mira.jpg",
    category: "design",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    user: {
      id: userId,
      name: "Mira Chen",
      avatarUrl: "https://images.example.com/mira.jpg",
    },
  };
}

function productRecord(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: "p_northline",
    creatorId: "cr_mira",
    categoryId: "cat_design",
    title: "Northline UI System",
    slug: "northline-ui-system",
    shortDescription: "A complete Figma kit for modern SaaS products.",
    description:
      "Two hundred components and a ruthless type scale for product teams who still care.",
    price: 7900,
    currency: "USD",
    productType: "TEMPLATE",
    status: "PUBLISHED",
    coverImage: "https://images.example.com/cover.jpg",
    featured: true,
    trending: true,
    editorsPick: true,
    createdAt: new Date("2026-01-02"),
    updatedAt: new Date("2026-01-03"),
    category: designCategory,
    creator: creator(),
    images: [{ url: "https://images.example.com/cover.jpg", sortOrder: 0 }],
    files: [
      {
        id: "file_1",
        fileName: "northline.zip",
        fileSize: 12_000_000,
        mimeType: "application/zip",
        publicId: "marketplace/products/northline/files/source",
      },
    ],
    reviews: [{ rating: 5 }, { rating: 4 }],
    _count: { orderItems: 18, files: 1 },
    ...overrides,
  };
}

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
const adminUser = {
  id: "u_admin",
  email: "admin@example.com",
  role: "ADMIN" as const,
};

const createBody = {
  title: "Ultimate Figma UI Kit",
  slug: "ultimate-figma-ui-kit",
  shortDescription: "A complete interface kit for product teams.",
  description:
    "Screens, components, and a type scale designed for SaaS teams who still print.",
  categoryId: "cat_design",
  price: 2900,
  currency: "USD",
  productType: "TEMPLATE",
  coverImage: "https://images.example.com/kit.jpg",
};

describe("products and categories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transaction.mockImplementation(async (ops: Promise<unknown>[]) =>
      Promise.all(ops),
    );
    productImageDeleteMany.mockResolvedValue({ count: 0 });
  });

  it("lists published products with pagination", async () => {
    const published = productRecord();
    productCount.mockResolvedValue(1);
    productFindMany.mockResolvedValue([published]);

    const response = await request(app).get("/api/v1/products?page=1&limit=20");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.items[0].title).toBe("Northline UI System");
    expect(response.body.data.items[0].price).toBe(79);
    expect(response.body.data.items[0].files).toBeUndefined();
    expect(response.body.data.items[0].creator.storeName).toBe("Northline Studio");
    expect(JSON.stringify(response.body)).not.toContain("storageKey");
    expect(JSON.stringify(response.body)).not.toContain("publicId");
    expect(JSON.stringify(response.body)).not.toContain("passwordHash");
    expect(response.body.data.pagination).toMatchObject({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });
    expect(productFindMany.mock.calls[0]?.[0].where.status).toBe("PUBLISHED");
  });

  it("searches products", async () => {
    productCount.mockResolvedValue(1);
    productFindMany.mockResolvedValue([productRecord()]);

    const response = await request(app).get("/api/v1/products?search=figma");

    expect(response.status).toBe(200);
    const where = productFindMany.mock.calls[0]?.[0].where;
    expect(where.OR[0].title.contains).toBe("figma");
  });

  it("filters by category and product type", async () => {
    productCount.mockResolvedValue(1);
    productFindMany.mockResolvedValue([productRecord()]);

    const response = await request(app).get(
      "/api/v1/products?category=design&productType=TEMPLATE",
    );

    expect(response.status).toBe(200);
    const where = productFindMany.mock.calls[0]?.[0].where;
    expect(where.category).toEqual({ slug: "design" });
    expect(where.productType).toBe("TEMPLATE");
  });

  it("sorts by price ascending", async () => {
    productCount.mockResolvedValue(0);
    productFindMany.mockResolvedValue([]);

    const response = await request(app).get("/api/v1/products?sort=price_asc");

    expect(response.status).toBe(200);
    expect(productFindMany.mock.calls[0]?.[0].orderBy).toEqual([{ price: "asc" }]);
  });

  it("returns a published product by slug", async () => {
    productFindFirst.mockResolvedValue(productRecord());

    const response = await request(app).get(
      "/api/v1/products/slug/northline-ui-system",
    );

    expect(response.status).toBe(200);
    expect(response.body.data.product.slug).toBe("northline-ui-system");
    expect(response.body.data.product.rating).toBe(4.5);
    expect(productFindFirst.mock.calls[0]?.[0].where).toEqual({
      slug: "northline-ui-system",
      status: "PUBLISHED",
    });
  });

  it("hides unpublished products from public slug lookup", async () => {
    productFindFirst.mockResolvedValue(null);

    const response = await request(app).get(
      "/api/v1/products/slug/unreleased-type-experiments",
    );

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it("returns related products excluding the current one", async () => {
    productFindUnique.mockResolvedValue(productRecord());
    productFindMany.mockResolvedValue([
      productRecord({
        id: "p_brand",
        slug: "brand-archive",
        title: "Brand Archive",
      }),
    ]);

    const response = await request(app).get("/api/v1/products/p_northline/related");

    expect(response.status).toBe(200);
    expect(response.body.data.items[0].id).toBe("p_brand");
    expect(productFindMany.mock.calls[0]?.[0].where.id).toEqual({
      not: "p_northline",
    });
  });

  it("lists categories", async () => {
    categoryFindMany.mockResolvedValue([designCategory]);

    const response = await request(app).get("/api/v1/categories");

    expect(response.status).toBe(200);
    expect(response.body.data.categories[0].name).toBe("Design");
    expect(response.body.data.categories[0].slug).toBe("design");
  });

  it("returns a category by slug", async () => {
    categoryFindUnique.mockResolvedValue(designCategory);

    const response = await request(app).get("/api/v1/categories/design");

    expect(response.status).toBe(200);
    expect(response.body.data.category.slug).toBe("design");
  });

  it("lets a creator create a product", async () => {
    const cookies = session(miraUser);
    creatorFindUnique.mockResolvedValue(creator());
    categoryFindUnique.mockResolvedValue(designCategory);
    productFindUnique.mockResolvedValue(null);
    const created = productRecord({
      id: "p_new",
      slug: "ultimate-figma-ui-kit",
      title: createBody.title,
      status: "DRAFT",
    });
    productCreate.mockResolvedValue(created);

    const response = await request(app)
      .post("/api/v1/products")
      .set("Cookie", cookies)
      .send(createBody);

    expect(response.status).toBe(201);
    expect(response.body.data.product.slug).toBe("ultimate-figma-ui-kit");
    expect(response.body.data.product.status).toBe("DRAFT");
    expect(productCreate.mock.calls[0]?.[0].data.creatorId).toBe("cr_mira");
  });

  it("lets a creator update their own product", async () => {
    const cookies = session(miraUser);
    productFindUnique.mockResolvedValue(productRecord({ status: "DRAFT" }));
    creatorFindUnique.mockResolvedValue(creator());
    productUpdate.mockResolvedValue(
      productRecord({ title: "Northline UI System Revised", status: "DRAFT" }),
    );

    const response = await request(app)
      .patch("/api/v1/products/p_northline")
      .set("Cookie", cookies)
      .send({ title: "Northline UI System Revised" });

    expect(response.status).toBe(200);
    expect(response.body.data.product.title).toBe("Northline UI System Revised");
  });

  it("prevents a creator from updating another creator’s product", async () => {
    const cookies = session(kenjiUser);
    productFindUnique.mockResolvedValue(productRecord());
    creatorFindUnique.mockResolvedValue(creator("cr_kenji", "u_kenji"));

    const response = await request(app)
      .patch("/api/v1/products/p_northline")
      .set("Cookie", cookies)
      .send({ title: "Hijacked listing" });

    expect(response.status).toBe(403);
    expect(productUpdate).not.toHaveBeenCalled();
  });

  it("does not publish a product without a digital file", async () => {
    const cookies = session(miraUser);
    productFindUnique.mockResolvedValue(productRecord({ status: "DRAFT" }));
    creatorFindUnique.mockResolvedValue(creator());
    productFileCount.mockResolvedValue(0);

    const response = await request(app)
      .post("/api/v1/products/p_northline/publish")
      .set("Cookie", cookies);

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/downloadable file/i);
    expect(productUpdate).not.toHaveBeenCalled();
  });

  it("publishes a product", async () => {
    const cookies = session(miraUser);
    productFindUnique.mockResolvedValue(productRecord({ status: "DRAFT" }));
    creatorFindUnique.mockResolvedValue(creator());
    productFileCount.mockResolvedValue(1);
    productUpdate.mockResolvedValue(productRecord({ status: "PUBLISHED" }));

    const response = await request(app)
      .post("/api/v1/products/p_northline/publish")
      .set("Cookie", cookies);

    expect(response.status).toBe(200);
    expect(response.body.data.product.status).toBe("PUBLISHED");
  });

  it("archives a product", async () => {
    const cookies = session(miraUser);
    productFindUnique.mockResolvedValue(productRecord({ status: "PUBLISHED" }));
    creatorFindUnique.mockResolvedValue(creator());
    productUpdate.mockResolvedValue(productRecord({ status: "ARCHIVED" }));

    const response = await request(app)
      .post("/api/v1/products/p_northline/archive")
      .set("Cookie", cookies);

    expect(response.status).toBe(200);
    expect(response.body.data.product.status).toBe("ARCHIVED");
  });

  it("deletes a product", async () => {
    const cookies = session(miraUser);
    productFindUnique.mockResolvedValue(productRecord());
    creatorFindUnique.mockResolvedValue(creator());
    productDelete.mockResolvedValue(productRecord());

    const response = await request(app)
      .delete("/api/v1/products/p_northline")
      .set("Cookie", cookies);

    expect(response.status).toBe(200);
    expect(response.body.data.ok).toBe(true);
    expect(productDelete).toHaveBeenCalled();
  });

  it("rejects product creation from a customer", async () => {
    const cookies = session(leahUser);

    const response = await request(app)
      .post("/api/v1/products")
      .set("Cookie", cookies)
      .send(createBody);

    expect(response.status).toBe(403);
    expect(productCreate).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated creator management", async () => {
    const mine = await request(app).get("/api/v1/products/my");
    const create = await request(app).post("/api/v1/products").send(createBody);

    expect(mine.status).toBe(401);
    expect(create.status).toBe(401);
  });

  it("lets an admin manage any product", async () => {
    const cookies = session(adminUser);
    productFindUnique.mockResolvedValue(productRecord({ status: "DRAFT" }));
    productUpdate.mockResolvedValue(
      productRecord({ title: "Ops edit", status: "DRAFT" }),
    );

    const response = await request(app)
      .patch("/api/v1/products/p_northline")
      .set("Cookie", cookies)
      .send({ title: "Ops edit" });

    expect(response.status).toBe(200);
    expect(creatorFindUnique).not.toHaveBeenCalled();
    expect(response.body.data.product.title).toBe("Ops edit");
  });

  it("rejects an invalid price", async () => {
    const cookies = session(miraUser);

    const response = await request(app)
      .post("/api/v1/products")
      .set("Cookie", cookies)
      .send({ ...createBody, price: -12 });

    expect(response.status).toBe(400);
    expect(productCreate).not.toHaveBeenCalled();
  });

  it("rejects an invalid product type", async () => {
    const cookies = session(miraUser);

    const response = await request(app)
      .post("/api/v1/products")
      .set("Cookie", cookies)
      .send({ ...createBody, productType: "WIDGET" });

    expect(response.status).toBe(400);
  });

  it("assigns a unique slug when the requested slug is taken", async () => {
    const cookies = session(miraUser);
    creatorFindUnique.mockResolvedValue(creator());
    categoryFindUnique.mockResolvedValue(designCategory);
    productFindUnique
      .mockResolvedValueOnce({ id: "p_taken", slug: "ultimate-figma-ui-kit" })
      .mockResolvedValueOnce(null);
    productCreate.mockResolvedValue(
      productRecord({
        id: "p_new",
        slug: "ultimate-figma-ui-kit-2",
        title: createBody.title,
        status: "DRAFT",
      }),
    );

    const response = await request(app)
      .post("/api/v1/products")
      .set("Cookie", cookies)
      .send(createBody);

    expect(response.status).toBe(201);
    expect(productCreate.mock.calls[0]?.[0].data.slug).toBe(
      "ultimate-figma-ui-kit-2",
    );
    expect(response.body.data.product.slug).toBe("ultimate-figma-ui-kit-2");
  });

  it("rejects a missing category", async () => {
    const cookies = session(miraUser);
    creatorFindUnique.mockResolvedValue(creator());
    categoryFindUnique.mockResolvedValue(null);

    const response = await request(app)
      .post("/api/v1/products")
      .set("Cookie", cookies)
      .send(createBody);

    expect(response.status).toBe(404);
    expect(productCreate).not.toHaveBeenCalled();
  });

  it("rejects invalid pagination", async () => {
    const page = await request(app).get("/api/v1/products?page=0");
    const limit = await request(app).get("/api/v1/products?limit=200");

    expect(page.status).toBe(400);
    expect(limit.status).toBe(400);
  });

  it("lets an admin create a category and rejects a duplicate slug", async () => {
    const cookies = session(adminUser);
    categoryFindUnique.mockResolvedValue(null);
    categoryFindFirst.mockResolvedValue(null);
    categoryCreate.mockResolvedValue({
      ...designCategory,
      slug: "illustration",
      label: "Illustration",
    });

    const created = await request(app)
      .post("/api/v1/categories")
      .set("Cookie", cookies)
      .send({
        name: "Illustration",
        description: "Drawings, lettering, and print-ready plates.",
        image: "https://images.example.com/illustration.jpg",
      });

    expect(created.status).toBe(201);

    categoryFindUnique.mockResolvedValue(designCategory);
    const duplicate = await request(app)
      .post("/api/v1/categories")
      .set("Cookie", cookies)
      .send({
        name: "Design",
        description: "A second design aisle, which must not exist.",
        image: "https://images.example.com/design.jpg",
      });

    expect(duplicate.status).toBe(409);
  });
});
