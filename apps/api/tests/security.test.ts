import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { assertAllowedProductFile } from "../src/modules/media/file-types";
import { AppError } from "../src/utils/app-error";

const {
  userFindUnique,
  orderFindUnique,
  creatorEarningGroupBy,
  transaction,
} = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  orderFindUnique: vi.fn(),
  creatorEarningGroupBy: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("../src/config/database", () => ({
  prisma: {
    user: { findUnique: userFindUnique },
    order: { findUnique: orderFindUnique },
    creatorProfile: { findUnique: vi.fn() },
    creatorEarning: {
      groupBy: creatorEarningGroupBy,
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    $transaction: transaction,
    $connect: vi.fn(),
  },
}));

vi.mock("../src/modules/notifications/notification.events", () => ({
  notifyOrderPaid: vi.fn(),
  notifyPayoutRequested: vi.fn(),
  notifyPayoutPaid: vi.fn(),
  notifyPayoutFailed: vi.fn(),
  notifyPayoutAccountUpdated: vi.fn(),
}));

import { createApp } from "../src/app";
import { cookieName } from "../src/config/cookies";
import { CSRF_HEADER, CSRF_HEADER_VALUE } from "../src/middleware/csrf.middleware";

const app = createApp();

function session(user: {
  id: string;
  email: string;
  role: Role;
  status?: string;
  sessionVersion?: number;
}) {
  const token = jwt.sign(
    {
      sub: user.id,
      role: user.role,
      sv: user.sessionVersion ?? 0,
    },
    process.env.JWT_SECRET as string,
    { algorithm: "HS256", expiresIn: "1d" },
  );
  userFindUnique.mockResolvedValue({
    ...user,
    status: user.status ?? "ACTIVE",
    sessionVersion: user.sessionVersion ?? 0,
    name: "Test",
    avatarUrl: null,
    creatorProfile: null,
    passwordHash: "x",
  });
  return [`${cookieName()}=${token}`];
}

describe("security regression", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.ENFORCE_CSRF;
    transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn({
        creatorEarning: { updateMany: vi.fn() },
      }),
    );
    creatorEarningGroupBy.mockResolvedValue([]);
  });

  it("rejects malformed JWT", async () => {
    const response = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", [`${cookieName()}=not-a-jwt`]);
    expect(response.status).toBe(401);
  });

  it("rejects alg=none JWT", async () => {
    const unsigned = [
      Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url"),
      Buffer.from(
        JSON.stringify({ sub: "u_attacker", role: "ADMIN", sv: 0 }),
      ).toString("base64url"),
      "",
    ].join(".");
    const response = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", [`${cookieName()}=${unsigned}`]);
    expect(response.status).toBe(401);
  });

  it("rejects JWT when sessionVersion mismatches", async () => {
    const token = jwt.sign(
      { sub: "u_1", role: "CUSTOMER", sv: 0 },
      process.env.JWT_SECRET as string,
      { algorithm: "HS256", expiresIn: "1d" },
    );
    userFindUnique.mockResolvedValue({
      id: "u_1",
      email: "a@example.com",
      role: "CUSTOMER",
      status: "ACTIVE",
      sessionVersion: 2,
    });
    const response = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", [`${cookieName()}=${token}`]);
    expect(response.status).toBe(401);
  });

  it("blocks customer from admin APIs", async () => {
    const response = await request(app)
      .get("/api/v1/admin/users")
      .set("Cookie", session({ id: "u_c", email: "c@example.com", role: "CUSTOMER" }));
    expect(response.status).toBe(403);
  });

  it("blocks creator from admin APIs", async () => {
    const response = await request(app)
      .get("/api/v1/admin/payouts")
      .set("Cookie", session({ id: "u_cr", email: "cr@example.com", role: "CREATOR" }));
    expect(response.status).toBe(403);
  });

  it("hides another customer's order (404)", async () => {
    orderFindUnique.mockResolvedValue({
      id: "ord_x",
      customerId: "u_other",
      items: [],
      payment: null,
      status: "PAID",
      currency: "USD",
      totalAmount: 100,
      subtotal: 100,
      discount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const response = await request(app)
      .get("/api/v1/orders/ord_x")
      .set(
        "Cookie",
        session({ id: "u_me", email: "me@example.com", role: "CUSTOMER" }),
      );
    expect(response.status).toBe(404);
  });

  it("rejects creator earnings for customers", async () => {
    const response = await request(app)
      .get("/api/v1/creators/me/earnings/summary")
      .set(
        "Cookie",
        session({ id: "u_c", email: "c@example.com", role: "CUSTOMER" }),
      );
    expect(response.status).toBe(403);
  });

  it("rejects invalid webhook signature", async () => {
    const body = JSON.stringify({ event: "payment.captured", payload: {} });
    const response = await request(app)
      .post("/api/v1/payments/razorpay/webhook")
      .set("Content-Type", "application/json")
      .set("X-Razorpay-Signature", "deadbeef")
      .send(body);
    expect(response.status).toBe(401);
  });

  it("rejects dangerous product file types", () => {
    expect(() =>
      assertAllowedProductFile("malware.exe", "application/octet-stream"),
    ).toThrow(AppError);
    expect(() =>
      assertAllowedProductFile("notes.pdf", "application/octet-stream"),
    ).toThrow(AppError);
    expect(() =>
      assertAllowedProductFile("notes.pdf", "application/pdf"),
    ).not.toThrow();
  });

  it("requires CSRF header when ENFORCE_CSRF=true", async () => {
    process.env.ENFORCE_CSRF = "true";
    const denied = await request(app).post("/api/v1/auth/logout");
    expect(denied.status).toBe(403);

    const allowed = await request(app)
      .post("/api/v1/auth/logout")
      .set(CSRF_HEADER, CSRF_HEADER_VALUE);
    expect(allowed.status).toBe(200);
    delete process.env.ENFORCE_CSRF;
  });

  it("does not expose stack traces on 500", async () => {
    userFindUnique.mockImplementation(() => {
      throw new Error("secret db detail");
    });
    const response = await request(app).post("/api/v1/auth/login").send({
      email: "x@example.com",
      password: "password12",
    });
    expect(response.status).toBe(500);
    expect(JSON.stringify(response.body)).not.toContain("secret db detail");
    expect(response.body.message).toBe("Something went wrong");
  });
});
