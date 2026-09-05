import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";

const {
  productFindUnique,
  productUpdate,
  productFileCreate,
  productFileDelete,
  productFileFindFirst,
  productFileFindMany,
  productImageCreate,
  productImageFindMany,
  purchaseFindUnique,
  downloadCreate,
  purchaseCount,
  purchaseFindMany,
  creatorFindUnique,
  userFindUnique,
  transaction,
} = vi.hoisted(() => ({
  productFindUnique: vi.fn(),
  productUpdate: vi.fn(),
  productFileCreate: vi.fn(),
  productFileDelete: vi.fn(),
  productFileFindFirst: vi.fn(),
  productFileFindMany: vi.fn(),
  productImageCreate: vi.fn(),
  productImageFindMany: vi.fn(),
  purchaseFindUnique: vi.fn(),
  downloadCreate: vi.fn(),
  purchaseCount: vi.fn(),
  purchaseFindMany: vi.fn(),
  creatorFindUnique: vi.fn(),
  userFindUnique: vi.fn(),
  transaction: vi.fn(),
}));

const { uploadPrivateFile, uploadPublicImage, signedDeliveryUrl, destroyCloudinaryAsset } =
  vi.hoisted(() => ({
    uploadPrivateFile: vi.fn(),
    uploadPublicImage: vi.fn(),
    signedDeliveryUrl: vi.fn(),
    destroyCloudinaryAsset: vi.fn(),
  }));

vi.mock("../src/config/database", () => ({
  prisma: {
    product: { findUnique: productFindUnique, update: productUpdate },
    productFile: {
      create: productFileCreate,
      delete: productFileDelete,
      findFirst: productFileFindFirst,
      findMany: productFileFindMany,
    },
    productImage: { create: productImageCreate, findMany: productImageFindMany },
    purchase: {
      findUnique: purchaseFindUnique,
      count: purchaseCount,
      findMany: purchaseFindMany,
    },
    download: { create: downloadCreate },
    creatorProfile: { findUnique: creatorFindUnique },
    user: { findUnique: userFindUnique },
    $transaction: transaction,
    $connect: vi.fn(),
  },
}));

vi.mock("../src/config/cloudinary", () => ({
  uploadPrivateFile,
  uploadPublicImage,
  signedDeliveryUrl,
  destroyCloudinaryAsset,
  cloudinaryFolders: {
    productImages: (id: string) => `marketplace/products/${id}/images`,
    productFiles: (id: string) => `marketplace/products/${id}/files`,
    creatorAvatar: (id: string) => `marketplace/creators/${id}/avatar`,
    creatorBanner: (id: string) => `marketplace/creators/${id}/banner`,
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

const mira = { id: "u_mira", email: "mira@example.com", role: "CREATOR" as const };
const kenji = { id: "u_kenji", email: "kenji@example.com", role: "CREATOR" as const };
const leah = { id: "u_leah", email: "leah@example.com", role: "CUSTOMER" as const };
const owen = { id: "u_owen", email: "owen@example.com", role: "CUSTOMER" as const };

function ownedProduct() {
  return {
    id: "p_northline",
    creatorId: "cr_mira",
    coverImage: "https://images.example.com/cover.jpg",
    files: [],
    images: [],
  };
}

describe("product media uploads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    destroyCloudinaryAsset.mockResolvedValue({ result: "ok" });
    uploadPrivateFile.mockResolvedValue({
      publicId: "marketplace/products/p_northline/files/kit",
      resourceType: "raw",
      format: "zip",
      bytes: 1200,
      version: 1,
      secureUrl: "https://res.cloudinary.com/demo/authenticated/kit.zip",
      type: "authenticated",
    });
    uploadPublicImage.mockResolvedValue({
      publicId: "marketplace/products/p_northline/images/cover",
      resourceType: "image",
      format: "jpg",
      bytes: 800,
      width: 1600,
      height: 1000,
      version: 1,
      secureUrl: "https://res.cloudinary.com/demo/image/upload/cover.jpg",
      type: "upload",
    });
    productFileCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: "file_1",
      createdAt: new Date(),
      ...data,
    }));
  });

  it("lets a creator upload a file to their product", async () => {
    productFindUnique.mockResolvedValue(ownedProduct());
    creatorFindUnique.mockResolvedValue({ id: "cr_mira", userId: "u_mira" });

    const response = await request(app)
      .post("/api/v1/products/p_northline/files")
      .set("Cookie", session(mira))
      .attach("file", Buffer.from("PK"), "kit.zip");

    expect(response.status).toBe(201);
    expect(response.body.data.file.fileName).toBe("kit.zip");
    expect(JSON.stringify(response.body)).not.toContain("CLOUDINARY_API_SECRET");
    expect(JSON.stringify(response.body)).not.toContain("publicId");
    expect(uploadPrivateFile).toHaveBeenCalled();
  });

  it("blocks a creator from uploading to another store’s product", async () => {
    productFindUnique.mockResolvedValue(ownedProduct());
    creatorFindUnique.mockResolvedValue({ id: "cr_kenji", userId: "u_kenji" });

    const response = await request(app)
      .post("/api/v1/products/p_northline/files")
      .set("Cookie", session(kenji))
      .attach("file", Buffer.from("PK"), "kit.zip");

    expect(response.status).toBe(403);
    expect(uploadPrivateFile).not.toHaveBeenCalled();
  });

  it("rejects customer uploads", async () => {
    const response = await request(app)
      .post("/api/v1/products/p_northline/files")
      .set("Cookie", session(leah))
      .attach("file", Buffer.from("PK"), "kit.zip");
    expect(response.status).toBe(403);
  });

  it("rejects an unsupported file type", async () => {
    productFindUnique.mockResolvedValue(ownedProduct());
    creatorFindUnique.mockResolvedValue({ id: "cr_mira", userId: "u_mira" });
    const response = await request(app)
      .post("/api/v1/products/p_northline/files")
      .set("Cookie", session(mira))
      .attach("file", Buffer.from("MZ"), "payload.exe");
    expect(response.status).toBe(400);
    expect(uploadPrivateFile).not.toHaveBeenCalled();
  });
});

describe("library and downloads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signedDeliveryUrl.mockReturnValue({
      url: "https://res.cloudinary.com/demo/authenticated/s--tmp--/v1/file.zip",
      expiresAt: new Date(Date.now() + 120_000).toISOString(),
    });
  });

  it("lists only the authenticated customer’s purchases", async () => {
    purchaseCount.mockResolvedValue(1);
    purchaseFindMany.mockResolvedValue([
      {
        createdAt: new Date(),
        orderId: "ord_1",
        product: {
          id: "p_northline",
          title: "Northline",
          slug: "northline-ui-system",
          coverImage: "https://images.example.com/cover.jpg",
          productType: "TEMPLATE",
          updatedAt: new Date(),
          creator: { storeName: "Northline Studio", slug: "mira" },
          files: [{ id: "file_1", fileName: "kit.zip", fileSize: 12, format: "zip", mimeType: "application/zip" }],
        },
      },
    ]);

    const response = await request(app).get("/api/v1/library").set("Cookie", session(leah));
    expect(response.status).toBe(200);
    expect(response.body.data.items).toHaveLength(1);
    expect(purchaseFindMany.mock.calls[0][0].where.userId).toBe("u_leah");
    expect(JSON.stringify(response.body)).not.toContain("publicId");
    expect(JSON.stringify(response.body)).not.toContain("CLOUDINARY_API_SECRET");
  });

  it("does not let a customer read another library item", async () => {
    purchaseFindUnique.mockResolvedValue(null);
    const response = await request(app)
      .get("/api/v1/library/p_northline")
      .set("Cookie", session(owen));
    expect(response.status).toBe(404);
  });

  it("rejects unauthenticated downloads", async () => {
    const response = await request(app).get(
      "/api/v1/library/products/p_northline/download?fileId=file_1",
    );
    expect(response.status).toBe(401);
  });

  it("rejects a non-purchaser download", async () => {
    purchaseFindUnique.mockResolvedValue(null);
    const response = await request(app)
      .get("/api/v1/library/products/p_northline/download?fileId=file_1")
      .set("Cookie", session(owen));
    expect(response.status).toBe(403);
  });

  it("issues a temporary signed URL for a purchaser", async () => {
    purchaseFindUnique.mockResolvedValue({
      orderId: "ord_1",
      order: { id: "ord_1", status: "PAID" },
      product: { id: "p_northline", status: "PUBLISHED" },
    });
    productFileFindFirst.mockResolvedValue({
      id: "file_1",
      productId: "p_northline",
      publicId: "marketplace/products/p_northline/files/kit",
      resourceType: "raw",
      format: "zip",
      fileName: "kit.zip",
    });
    downloadCreate.mockResolvedValue({ id: "dl_1" });

    const response = await request(app)
      .get("/api/v1/library/products/p_northline/download?fileId=file_1")
      .set("Cookie", session(leah));

    expect(response.status).toBe(200);
    expect(response.body.data.url).toContain("authenticated");
    expect(response.body.data.expiresAt).toBeTruthy();
    expect(downloadCreate).toHaveBeenCalled();
  });

  it("handles a deleted file", async () => {
    purchaseFindUnique.mockResolvedValue({
      orderId: "ord_1",
      order: { id: "ord_1", status: "PAID" },
      product: { id: "p_northline", status: "PUBLISHED" },
    });
    productFileFindFirst.mockResolvedValue(null);
    const response = await request(app)
      .get("/api/v1/library/products/p_northline/download?fileId=missing")
      .set("Cookie", session(leah));
    expect(response.status).toBe(404);
  });
});
