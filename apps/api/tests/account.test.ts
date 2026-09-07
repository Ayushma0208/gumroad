import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import bcrypt from "bcrypt";

const {
  userFindUnique,
  userUpdate,
  reviewCount,
  reviewFindMany,
  purchaseFindMany,
  transaction,
} = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  userUpdate: vi.fn(),
  reviewCount: vi.fn(),
  reviewFindMany: vi.fn(),
  purchaseFindMany: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("../src/config/cloudinary", () => ({
  destroyCloudinaryAsset: vi.fn().mockResolvedValue({ result: "ok" }),
  uploadPublicImage: vi.fn().mockResolvedValue({
    publicId: "marketplace/users/u1/avatar/x",
    secureUrl: "https://res.cloudinary.com/demo/image/upload/avatar.jpg",
    resourceType: "image",
    format: "jpg",
    bytes: 1000,
    type: "upload",
  }),
  uploadPrivateFile: vi.fn(),
  signedDeliveryUrl: vi.fn(),
  cloudinaryFolders: {
    productImages: () => "img",
    productFiles: () => "files",
    creatorAvatar: () => "avatar",
    creatorBanner: () => "banner",
    userAvatar: (id: string) => `marketplace/users/${id}/avatar`,
  },
}));

vi.mock("../src/config/database", () => ({
  prisma: {
    user: { findUnique: userFindUnique, update: userUpdate },
    review: { count: reviewCount, findMany: reviewFindMany },
    purchase: { findMany: purchaseFindMany },
    $transaction: transaction,
    $connect: vi.fn(),
  },
}));

import { createApp } from "../src/app";
import { cookieName } from "../src/config/cookies";

const app = createApp();

const passwordHashPromise = bcrypt.hash("password12", 4);
let passwordHash = "";

beforeAll(async () => {
  passwordHash = await passwordHashPromise;
});

function userRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "u_leah",
    name: "Leah",
    email: "leah@example.com",
    passwordHash,
    role: "CUSTOMER" as Role,
    status: "ACTIVE",
    avatarUrl: null,
    avatarPublicId: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    creatorProfile: null,
    ...overrides,
  };
}

function session(user: { id: string; email: string; role: Role }) {
  const token = jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "1d" },
  );
  userFindUnique.mockResolvedValue(userRecord(user));
  return [`${cookieName()}=${token}`];
}

beforeEach(() => {
  vi.clearAllMocks();
  transaction.mockImplementation(async (arg: unknown) => {
    if (Array.isArray(arg)) return Promise.all(arg);
    if (typeof arg === "function") return arg({});
    return arg;
  });
});

describe("account profile", () => {
  it("rejects unauthenticated profile update", async () => {
    const res = await request(app)
      .patch("/api/v1/users/me")
      .send({ name: "Hack" });
    expect(res.status).toBe(401);
  });

  it("updates own name and strips protected fields", async () => {
    const leah = { id: "u_leah", email: "leah@example.com", role: "CUSTOMER" as const };
    userUpdate.mockResolvedValue(
      userRecord({ name: "Leah Chen" }),
    );

    const res = await request(app)
      .patch("/api/v1/users/me")
      .set("Cookie", session(leah))
      .send({ name: "Leah Chen", role: "ADMIN", email: "x@y.com" });

    expect(res.status).toBe(200);
    expect(res.body.data.user.name).toBe("Leah Chen");
    expect(userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { name: "Leah Chen" },
      }),
    );
  });

  it("rejects short names", async () => {
    const leah = { id: "u_leah", email: "leah@example.com", role: "CUSTOMER" as const };
    const res = await request(app)
      .patch("/api/v1/users/me")
      .set("Cookie", session(leah))
      .send({ name: "A" });
    expect(res.status).toBe(400);
  });
});

describe("change password", () => {
  it("rejects wrong current password", async () => {
    const leah = { id: "u_leah", email: "leah@example.com", role: "CUSTOMER" as const };
    const res = await request(app)
      .post("/api/v1/auth/change-password")
      .set("Cookie", session(leah))
      .send({
        currentPassword: "wrong-pass",
        newPassword: "password99",
        confirmPassword: "password99",
      });
    expect(res.status).toBe(401);
  });

  it("changes password with correct current password", async () => {
    const leah = { id: "u_leah", email: "leah@example.com", role: "CUSTOMER" as const };
    userUpdate.mockResolvedValue(userRecord());
    const res = await request(app)
      .post("/api/v1/auth/change-password")
      .set("Cookie", session(leah))
      .send({
        currentPassword: "password12",
        newPassword: "password99",
        confirmPassword: "password99",
      });
    expect(res.status).toBe(200);
    expect(userUpdate).toHaveBeenCalled();
  });
});

describe("my reviews", () => {
  it("lists only the authenticated user’s reviews", async () => {
    const leah = { id: "u_leah", email: "leah@example.com", role: "CUSTOMER" as const };
    const reviews = [
      {
        id: "r1",
        rating: 5,
        title: "Great",
        comment: "Loved it",
        productId: "p1",
        userId: "u_leah",
        status: "PUBLISHED",
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: "u_leah", name: "Leah", avatarUrl: null },
        reply: null,
        product: { id: "p1", title: "Kit", slug: "kit" },
      },
    ];
    reviewCount.mockResolvedValue(1);
    reviewFindMany.mockResolvedValue(reviews);
    purchaseFindMany.mockResolvedValue([{ productId: "p1" }]);
    transaction.mockResolvedValue([1, reviews]);

    const res = await request(app)
      .get("/api/v1/users/me/reviews")
      .set("Cookie", session(leah));

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(reviewFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "u_leah" },
      }),
    );
  });
});

describe("close account", () => {
  it("soft-closes a customer account", async () => {
    const leah = { id: "u_leah", email: "leah@example.com", role: "CUSTOMER" as const };
    userUpdate.mockResolvedValue(userRecord({ status: "SUSPENDED" }));
    const res = await request(app)
      .delete("/api/v1/users/me")
      .set("Cookie", session(leah))
      .send({ password: "password12", confirm: true });
    expect(res.status).toBe(200);
    expect(userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "SUSPENDED",
          name: "Closed account",
        }),
      }),
    );
  });

  it("blocks creator self-close", async () => {
    const mira = { id: "u_mira", email: "mira@example.com", role: "CREATOR" as const };
    userFindUnique.mockResolvedValue(
      userRecord({
        id: "u_mira",
        email: "mira@example.com",
        role: "CREATOR",
        creatorProfile: { id: "cp1" },
      }),
    );
    const token = jwt.sign(
      { sub: mira.id, role: mira.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" },
    );
    const res = await request(app)
      .delete("/api/v1/users/me")
      .set("Cookie", `${cookieName()}=${token}`)
      .send({ password: "password12", confirm: true });
    expect(res.status).toBe(403);
  });
});
