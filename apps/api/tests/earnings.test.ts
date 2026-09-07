import { beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import request from "supertest";
import type { Role } from "@prisma/client";
import { allocateDiscountCents, Money } from "../src/utils/money";
import { discountByOrderItem } from "../src/modules/earnings/earnings.ledger";

const {
  creatorProfileFindUnique,
  creatorEarningGroupBy,
  creatorEarningCount,
  creatorEarningFindMany,
  creatorEarningUpdateMany,
  creatorEarningCreate,
  orderFindUnique,
  payoutFindUnique,
  payoutFindFirst,
  payoutFindMany,
  payoutCount,
  payoutCreate,
  payoutUpdate,
  payoutAccountFindUnique,
  payoutAccountUpsert,
  payoutAccountUpdate,
  transaction,
  userFindUnique,
  adminAuditCreate,
  queryRaw,
} = vi.hoisted(() => ({
  creatorProfileFindUnique: vi.fn(),
  creatorEarningGroupBy: vi.fn(),
  creatorEarningCount: vi.fn(),
  creatorEarningFindMany: vi.fn(),
  creatorEarningUpdateMany: vi.fn(),
  creatorEarningCreate: vi.fn(),
  orderFindUnique: vi.fn(),
  payoutFindUnique: vi.fn(),
  payoutFindFirst: vi.fn(),
  payoutFindMany: vi.fn(),
  payoutCount: vi.fn(),
  payoutCreate: vi.fn(),
  payoutUpdate: vi.fn(),
  payoutAccountFindUnique: vi.fn(),
  payoutAccountUpsert: vi.fn(),
  payoutAccountUpdate: vi.fn(),
  transaction: vi.fn(),
  userFindUnique: vi.fn(),
  adminAuditCreate: vi.fn(),
  queryRaw: vi.fn(),
}));

vi.mock("../src/config/database", () => ({
  prisma: {
    creatorProfile: { findUnique: creatorProfileFindUnique },
    creatorEarning: {
      groupBy: creatorEarningGroupBy,
      count: creatorEarningCount,
      findMany: creatorEarningFindMany,
      updateMany: creatorEarningUpdateMany,
      create: creatorEarningCreate,
    },
    order: { findUnique: orderFindUnique },
    payout: {
      findUnique: payoutFindUnique,
      findFirst: payoutFindFirst,
      findMany: payoutFindMany,
      count: payoutCount,
      create: payoutCreate,
      update: payoutUpdate,
    },
    creatorPayoutAccount: {
      findUnique: payoutAccountFindUnique,
      upsert: payoutAccountUpsert,
      update: payoutAccountUpdate,
    },
    adminAuditLog: { create: adminAuditCreate },
    user: { findUnique: userFindUnique },
    $transaction: transaction,
    $queryRaw: queryRaw,
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
import { postEarningsForPaidOrder } from "../src/modules/earnings/earnings.ledger";

const app = createApp();

const creatorUser = {
  id: "u_mira",
  email: "mira@example.com",
  role: "CREATOR" as const,
  status: "ACTIVE",
};
const customerUser = {
  id: "u_leah",
  email: "leah@example.com",
  role: "CUSTOMER" as const,
  status: "ACTIVE",
};
const adminUser = {
  id: "u_admin",
  email: "admin@example.com",
  role: "ADMIN" as const,
  status: "ACTIVE",
};

function session(user: { id: string; email: string; role: Role; status?: string }) {
  const token = jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "1d" },
  );
  userFindUnique.mockResolvedValue(user);
  return [`${cookieName()}=${token}`];
}

describe("Money helpers", () => {
  it("adds and subtracts integers only", () => {
    expect(Money.add(100, 250, 3)).toBe(353);
    expect(Money.subtract(1000, 250)).toBe(750);
    expect(() => Money.add(0.1, 0.2)).toThrow();
  });

  it("computes fee from BPS with floor rounding", () => {
    expect(Money.feeFromBps(999, 1000)).toBe(99); // 10% of 999
    expect(Money.feeFromBps(1000, 0)).toBe(0);
  });

  it("allocates discounts proportionally with remainder on last id", () => {
    const map = allocateDiscountCents({
      lines: [
        { id: "b", grossCents: 500 },
        { id: "a", grossCents: 500 },
      ],
      discountCents: 101,
    });
    // sorted a then b — a gets floor share, b gets remainder
    expect(map.get("a")).toBe(50);
    expect(map.get("b")).toBe(51);
    expect(Money.add(map.get("a")!, map.get("b")!)).toBe(101);
  });
});

describe("discount attribution", () => {
  it("attributes creator coupon discount only to that creator's lines", () => {
    const map = discountByOrderItem({
      items: [
        {
          id: "oi_a1",
          productId: "p1",
          creatorId: "cp_a",
          price: 500,
          quantity: 1,
        },
        {
          id: "oi_b1",
          productId: "p2",
          creatorId: "cp_b",
          price: 800,
          quantity: 1,
        },
        {
          id: "oi_a2",
          productId: "p3",
          creatorId: "cp_a",
          price: 300,
          quantity: 1,
        },
      ],
      orderDiscountCents: 80,
      coupon: {
        id: "c1",
        creatorId: "cp_a",
        code: "SAVE",
        type: "FIXED",
        value: 80,
        maxDiscount: null,
        minOrderAmount: null,
        maxUses: null,
        usedCount: 0,
        perUserLimit: null,
        startsAt: null,
        expiresAt: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        products: [],
      },
    });
    expect(map.get("oi_b1")).toBe(0);
    expect(Money.add(map.get("oi_a1")!, map.get("oi_a2")!)).toBe(80);
  });
});

describe("postEarningsForPaidOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates one earning per order item with fee snapshot", async () => {
    const tx = {
      order: {
        findUnique: vi.fn().mockResolvedValue({
          id: "ord_1",
          status: "PAID",
          discount: 0,
          currency: "USD",
          coupon: null,
          items: [
            {
              id: "oi_1",
              productId: "p1",
              creatorId: "cp_a",
              price: 1000,
              quantity: 1,
            },
            {
              id: "oi_2",
              productId: "p2",
              creatorId: "cp_b",
              price: 2000,
              quantity: 1,
            },
          ],
        }),
      },
      creatorEarning: {
        create: creatorEarningCreate.mockImplementation(async ({ data }) => ({
          id: `earn_${data.orderItemId}`,
          ...data,
        })),
      },
    };

    process.env.PLATFORM_FEE_BPS = "1000"; // 10%
    process.env.PAYOUT_HOLDING_PERIOD_HOURS = "0";
    const { resetEnvCache } = await import("../src/config/env");
    resetEnvCache();

    const posted = await postEarningsForPaidOrder(tx as never, "ord_1");
    expect(posted).toHaveLength(2);
    expect(posted[0]!.creatorAmountCents).toBe(900);
    expect(posted[1]!.creatorAmountCents).toBe(1800);
    expect(creatorEarningCreate).toHaveBeenCalledTimes(2);

    process.env.PLATFORM_FEE_BPS = "0";
    process.env.PAYOUT_HOLDING_PERIOD_HOURS = "168";
    resetEnvCache();
  });

  it("is idempotent on duplicate order item", async () => {
    const tx = {
      order: {
        findUnique: vi.fn().mockResolvedValue({
          id: "ord_1",
          status: "PAID",
          discount: 0,
          currency: "USD",
          coupon: null,
          items: [
            {
              id: "oi_1",
              productId: "p1",
              creatorId: "cp_a",
              price: 1000,
              quantity: 1,
            },
          ],
        }),
      },
      creatorEarning: {
        create: vi.fn().mockRejectedValue({ code: "P2002" }),
      },
    };
    const posted = await postEarningsForPaidOrder(tx as never, "ord_1");
    expect(posted).toEqual([]);
  });

  it("skips unpaid orders", async () => {
    const tx = {
      order: {
        findUnique: vi.fn().mockResolvedValue({
          id: "ord_1",
          status: "PENDING",
          items: [],
        }),
      },
      creatorEarning: { create: vi.fn() },
    };
    const posted = await postEarningsForPaidOrder(tx as never, "ord_1");
    expect(posted).toEqual([]);
    expect(tx.creatorEarning.create).not.toHaveBeenCalled();
  });
});

describe("earnings + payouts API security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn({
        creatorEarning: { updateMany: creatorEarningUpdateMany },
        creatorPayoutAccount: { findUnique: payoutAccountFindUnique },
        payout: {
          findFirst: payoutFindFirst,
          create: payoutCreate,
          findUnique: payoutFindUnique,
          update: payoutUpdate,
        },
        $queryRaw: queryRaw,
      }),
    );
    creatorEarningUpdateMany.mockResolvedValue({ count: 0 });
    creatorEarningGroupBy.mockResolvedValue([]);
    adminAuditCreate.mockResolvedValue({});
  });

  it("blocks customers from earnings summary", async () => {
    const response = await request(app)
      .get("/api/v1/creators/me/earnings/summary")
      .set("Cookie", session(customerUser));
    expect(response.status).toBe(403);
  });

  it("returns summary for creator", async () => {
    creatorProfileFindUnique.mockResolvedValue({ id: "cp_mira" });
    creatorEarningGroupBy.mockResolvedValue([
      {
        status: "AVAILABLE",
        currency: "USD",
        _sum: {
          grossAmountCents: 1000,
          discountAmountCents: 0,
          netSalesCents: 1000,
          platformFeeCents: 0,
          processingFeeCents: 0,
          creatorAmountCents: 1000,
        },
      },
    ]);
    const response = await request(app)
      .get("/api/v1/creators/me/earnings/summary")
      .set("Cookie", session(creatorUser));
    expect(response.status).toBe(200);
    expect(response.body.data.availableBalance.cents).toBe(1000);
    expect(response.body.data.pendingBalance.cents).toBe(0);
  });

  it("rejects payout when account is not verified", async () => {
    creatorProfileFindUnique.mockResolvedValue({ id: "cp_mira", userId: "u_mira" });
    payoutFindUnique.mockResolvedValue(null);
    payoutAccountFindUnique.mockResolvedValue({
      status: "PENDING_REVIEW",
    });
    const response = await request(app)
      .post("/api/v1/creators/me/payouts")
      .set("Cookie", session(creatorUser))
      .send({ amountCents: 1000, idempotencyKey: "idem-test-key-01" });
    expect(response.status).toBe(400);
  });

  it("creates payout and reserves earnings", async () => {
    creatorProfileFindUnique.mockResolvedValue({ id: "cp_mira", userId: "u_mira" });
    payoutFindUnique.mockResolvedValue(null);
    payoutFindFirst.mockResolvedValue(null);
    payoutAccountFindUnique.mockResolvedValue({ status: "VERIFIED" });
    queryRaw.mockResolvedValue([
      { id: "earn_1", creatorAmountCents: 1000, currency: "USD" },
    ]);
    payoutCreate.mockResolvedValue({
      id: "po_1",
      creatorId: "cp_mira",
      amountCents: 1000,
      currency: "USD",
      status: "REQUESTED",
      provider: "MANUAL_REVIEW",
      providerPayoutId: null,
      failureCode: null,
      failureMessage: null,
      requestedAt: new Date(),
      processedAt: null,
      createdAt: new Date(),
      items: [],
    });
    creatorEarningUpdateMany.mockResolvedValue({ count: 1 });

    const response = await request(app)
      .post("/api/v1/creators/me/payouts")
      .set("Cookie", session(creatorUser))
      .send({ amountCents: 1000, idempotencyKey: "idem-test-key-02" });
    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe("REQUESTED");
    expect(creatorEarningUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: "RESERVED" },
      }),
    );
  });

  it("admin can mark payout failed and restore availability", async () => {
    payoutFindUnique.mockResolvedValue({
      id: "po_1",
      status: "REQUESTED",
      providerPayoutId: null,
      items: [{ earningId: "earn_1" }],
    });
    payoutUpdate.mockResolvedValue({
      id: "po_1",
      amountCents: 1000,
      currency: "USD",
      status: "FAILED",
      provider: "MANUAL_REVIEW",
      providerPayoutId: null,
      failureCode: "MANUAL_FAIL",
      failureMessage: "Bank rejected",
      requestedAt: new Date(),
      processedAt: new Date(),
      createdAt: new Date(),
    });

    const response = await request(app)
      .patch("/api/v1/admin/payouts/po_1/status")
      .set("Cookie", session(adminUser))
      .send({ status: "FAILED", failureMessage: "Bank rejected" });
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("FAILED");
    expect(creatorEarningUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: "AVAILABLE" },
      }),
    );
  });

  it("blocks creator from admin payout status", async () => {
    const response = await request(app)
      .patch("/api/v1/admin/payouts/po_1/status")
      .set("Cookie", session(creatorUser))
      .send({ status: "PAID" });
    expect(response.status).toBe(403);
  });
});
