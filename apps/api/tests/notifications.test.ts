import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";

const {
  userFindUnique,
  notificationFindMany,
  notificationFindFirst,
  notificationCount,
  notificationCreate,
  notificationUpdate,
  notificationUpdateMany,
  notificationDelete,
  notificationDeleteMany,
  preferenceFindUnique,
  preferenceCreate,
  preferenceUpdate,
  emailJobCreate,
  emailJobUpdateMany,
  emailJobFindUnique,
  emailJobFindMany,
  emailJobCount,
  emailJobUpdate,
  orderFindUnique,
  reviewFindUnique,
  productFindUnique,
  transaction,
} = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  notificationFindMany: vi.fn(),
  notificationFindFirst: vi.fn(),
  notificationCount: vi.fn(),
  notificationCreate: vi.fn(),
  notificationUpdate: vi.fn(),
  notificationUpdateMany: vi.fn(),
  notificationDelete: vi.fn(),
  notificationDeleteMany: vi.fn(),
  preferenceFindUnique: vi.fn(),
  preferenceCreate: vi.fn(),
  preferenceUpdate: vi.fn(),
  emailJobCreate: vi.fn(),
  emailJobUpdateMany: vi.fn(),
  emailJobFindUnique: vi.fn(),
  emailJobFindMany: vi.fn(),
  emailJobCount: vi.fn(),
  emailJobUpdate: vi.fn(),
  orderFindUnique: vi.fn(),
  reviewFindUnique: vi.fn(),
  productFindUnique: vi.fn(),
  transaction: vi.fn(),
}));

const deliverEmail = vi.hoisted(() => vi.fn().mockResolvedValue({ id: "console_1" }));

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

vi.mock("../src/modules/email/email.transport", () => ({
  deliverEmail,
  getEmailProvider: () => ({ name: "console", send: deliverEmail }),
}));

vi.mock("../src/config/database", () => ({
  prisma: {
    user: { findUnique: userFindUnique },
    notification: {
      findMany: notificationFindMany,
      findFirst: notificationFindFirst,
      count: notificationCount,
      create: notificationCreate,
      update: notificationUpdate,
      updateMany: notificationUpdateMany,
      delete: notificationDelete,
      deleteMany: notificationDeleteMany,
    },
    notificationPreference: {
      findUnique: preferenceFindUnique,
      create: preferenceCreate,
      update: preferenceUpdate,
    },
    emailJob: {
      create: emailJobCreate,
      updateMany: emailJobUpdateMany,
      findUnique: emailJobFindUnique,
      findMany: emailJobFindMany,
      count: emailJobCount,
      update: emailJobUpdate,
    },
    order: { findUnique: orderFindUnique },
    review: { findUnique: reviewFindUnique },
    product: { findUnique: productFindUnique },
    $transaction: transaction,
    $connect: vi.fn(),
  },
}));

import { createApp } from "../src/app";
import { cookieName } from "../src/config/cookies";
import { notifyOrderPaid } from "../src/modules/notifications/notification.events";
import {
  processEmailJob,
  queueEmail,
} from "../src/modules/email/email.service";
import { shouldSendEmail } from "../src/modules/notifications/preference.service";

const app = createApp();

const leah = { id: "u_leah", email: "leah@example.com", role: "CUSTOMER" as const };
const owen = { id: "u_owen", email: "owen@example.com", role: "CUSTOMER" as const };
const admin = { id: "u_admin", email: "admin@example.com", role: "ADMIN" as const };

function session(user: { id: string; email: string; role: Role }) {
  const token = jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "1d" },
  );
  userFindUnique.mockResolvedValue({ ...user, status: "ACTIVE" });
  return [`${cookieName()}=${token}`];
}

function notificationRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "n_1",
    userId: "u_leah",
    type: "PURCHASE_SUCCESS",
    title: "Purchase completed",
    message: "Your purchase is ready.",
    data: { orderId: "ord_1" },
    href: "/library",
    eventKey: "purchase:ord_1",
    readAt: null,
    createdAt: new Date("2026-09-07T10:00:00.000Z"),
    ...overrides,
  };
}

function prefs(overrides: Record<string, unknown> = {}) {
  return {
    id: "pref_1",
    userId: "u_leah",
    marketingEmailEnabled: false,
    purchaseEmails: true,
    creatorSaleEmails: true,
    reviewEmails: true,
    productModerationEmails: true,
    securityEmails: true,
    createdAt: new Date(),
    updatedAt: new Date("2026-09-07T10:00:00.000Z"),
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

describe("notifications API", () => {
  it("rejects unauthenticated list", async () => {
    const res = await request(app).get("/api/v1/notifications");
    expect(res.status).toBe(401);
  });

  it("lists notifications for the authenticated user only", async () => {
    notificationCount.mockResolvedValue(1);
    notificationFindMany.mockResolvedValue([notificationRow()]);

    const res = await request(app)
      .get("/api/v1/notifications")
      .set("Cookie", session(leah));

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].unread).toBe(true);
    expect(notificationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "u_leah" }),
        orderBy: { createdAt: "desc" },
      }),
    );
  });

  it("returns unread count", async () => {
    notificationCount.mockResolvedValue(3);
    const res = await request(app)
      .get("/api/v1/notifications/unread-count")
      .set("Cookie", session(leah));
    expect(res.status).toBe(200);
    expect(res.body.data.count).toBe(3);
    expect(notificationCount).toHaveBeenCalledWith({
      where: { userId: "u_leah", readAt: null },
    });
  });

  it("marks own notification read and blocks IDOR", async () => {
    notificationFindFirst.mockResolvedValueOnce(notificationRow());
    notificationUpdate.mockResolvedValue(
      notificationRow({ readAt: new Date("2026-09-07T11:00:00.000Z") }),
    );

    const ok = await request(app)
      .patch("/api/v1/notifications/n_1/read")
      .set("Cookie", session(leah));
    expect(ok.status).toBe(200);
    expect(ok.body.data.notification.unread).toBe(false);

    notificationFindFirst.mockResolvedValueOnce(null);
    const denied = await request(app)
      .patch("/api/v1/notifications/n_1/read")
      .set("Cookie", session(owen));
    expect(denied.status).toBe(404);
  });

  it("marks all read", async () => {
    notificationUpdateMany.mockResolvedValue({ count: 2 });
    const res = await request(app)
      .post("/api/v1/notifications/read-all")
      .set("Cookie", session(leah));
    expect(res.status).toBe(200);
    expect(res.body.data.updated).toBe(2);
  });

  it("deletes own notification only", async () => {
    notificationFindFirst.mockResolvedValueOnce({ id: "n_1" });
    notificationDelete.mockResolvedValue({});
    const ok = await request(app)
      .delete("/api/v1/notifications/n_1")
      .set("Cookie", session(leah));
    expect(ok.status).toBe(200);

    notificationFindFirst.mockResolvedValueOnce(null);
    const denied = await request(app)
      .delete("/api/v1/notifications/n_other")
      .set("Cookie", session(leah));
    expect(denied.status).toBe(404);
  });

  it("supports unread filter and pagination meta", async () => {
    notificationCount.mockResolvedValue(25);
    notificationFindMany.mockResolvedValue(
      Array.from({ length: 20 }, (_, i) =>
        notificationRow({ id: `n_${i}`, title: `N${i}` }),
      ),
    );
    const res = await request(app)
      .get("/api/v1/notifications?unread=true&page=1&limit=20")
      .set("Cookie", session(leah));
    expect(res.status).toBe(200);
    expect(res.body.data.meta.total).toBe(25);
    expect(res.body.data.meta.hasNextPage).toBe(true);
    expect(notificationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "u_leah", readAt: null },
      }),
    );
  });
});

describe("notification preferences", () => {
  it("gets or creates preferences", async () => {
    preferenceFindUnique.mockResolvedValue(null);
    preferenceCreate.mockResolvedValue(prefs());
    const res = await request(app)
      .get("/api/v1/notification-preferences")
      .set("Cookie", session(leah));
    expect(res.status).toBe(200);
    expect(res.body.data.preferences.purchaseEmails).toBe(true);
    expect(res.body.data.preferences.securityEmails).toBe(true);
  });

  it("updates preferences without allowing security disable", async () => {
    preferenceFindUnique.mockResolvedValue(prefs());
    preferenceUpdate.mockResolvedValue(prefs({ purchaseEmails: false }));
    const res = await request(app)
      .patch("/api/v1/notification-preferences")
      .set("Cookie", session(leah))
      .send({ purchaseEmails: false, securityEmails: false });
    expect(res.status).toBe(200);
    expect(preferenceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          purchaseEmails: false,
          securityEmails: true,
        }),
      }),
    );
  });

  it("respects purchase preference when deciding to send", async () => {
    preferenceFindUnique.mockResolvedValue(prefs({ purchaseEmails: false }));
    expect(await shouldSendEmail("u_leah", "purchase")).toBe(false);
    expect(await shouldSendEmail("u_leah", "security")).toBe(true);
  });
});

describe("email queue + retries", () => {
  it("queues email and ignores duplicate eventKey", async () => {
    emailJobCreate
      .mockResolvedValueOnce({ id: "ej_1", eventKey: "purchase:ord_1" })
      .mockRejectedValueOnce({ code: "P2002" });

    const first = await queueEmail({
      userId: "u_leah",
      toEmail: "leah@example.com",
      type: "PURCHASE_SUCCESS",
      template: "PURCHASE_CONFIRMATION",
      subject: "Ready",
      eventKey: "purchase:ord_1",
      payload: {
        customerName: "Leah",
        orderId: "ord_1",
        totalLabel: "$79.00",
        purchasedAt: "2026-09-07",
        products: [{ title: "Kit", creatorName: "Mira" }],
        libraryUrl: "http://localhost:3000/library",
        orderUrl: "http://localhost:3000/orders/ord_1",
      },
    });
    const second = await queueEmail({
      userId: "u_leah",
      toEmail: "leah@example.com",
      type: "PURCHASE_SUCCESS",
      template: "PURCHASE_CONFIRMATION",
      subject: "Ready",
      eventKey: "purchase:ord_1",
      payload: {
        customerName: "Leah",
        orderId: "ord_1",
        totalLabel: "$79.00",
        purchasedAt: "2026-09-07",
        products: [{ title: "Kit", creatorName: "Mira" }],
        libraryUrl: "http://localhost:3000/library",
        orderUrl: "http://localhost:3000/orders/ord_1",
      },
    });
    expect(first?.id).toBe("ej_1");
    expect(second).toBeNull();
  });

  it("retries failed sends then marks FAILED", async () => {
    emailJobUpdateMany.mockResolvedValue({ count: 1 });
    emailJobFindUnique.mockResolvedValue({
      id: "ej_1",
      template: "CREATOR_SALE",
      subject: "Sale",
      toEmail: "mira@example.com",
      type: "CREATOR_SALE",
      attempts: 2,
      maxAttempts: 3,
      payload: {
        creatorName: "Mira",
        productTitle: "Kit",
        amountLabel: "$10.00",
        orderId: "ord_1",
        soldAt: "2026-09-07",
        dashboardUrl: "http://localhost:3000/dashboard/sales",
      },
    });
    deliverEmail.mockRejectedValueOnce(new Error("provider down"));
    emailJobUpdate.mockResolvedValue({ id: "ej_1", status: "FAILED" });

    const result = await processEmailJob("ej_1");
    expect(result?.status).toBe("FAILED");
    expect(emailJobUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "FAILED",
          attempts: 3,
        }),
      }),
    );
  });

  it("sends email successfully", async () => {
    emailJobUpdateMany.mockResolvedValue({ count: 1 });
    emailJobFindUnique.mockResolvedValue({
      id: "ej_2",
      template: "PURCHASE_CONFIRMATION",
      subject: "Ready",
      toEmail: "leah@example.com",
      type: "PURCHASE_SUCCESS",
      attempts: 0,
      maxAttempts: 3,
      payload: {
        customerName: "Leah",
        orderId: "ord_1",
        totalLabel: "$79.00",
        purchasedAt: "2026-09-07",
        products: [{ title: "Kit", creatorName: "Mira" }],
        libraryUrl: "http://localhost:3000/library",
        orderUrl: "http://localhost:3000/orders/ord_1",
      },
    });
    deliverEmail.mockResolvedValueOnce({ id: "ok" });
    emailJobUpdate.mockResolvedValue({ id: "ej_2", status: "SENT" });

    const result = await processEmailJob("ej_2");
    expect(result?.status).toBe("SENT");
    expect(deliverEmail).toHaveBeenCalled();
  });
});

describe("notifyOrderPaid events", () => {
  it("creates purchase + creator sale notifications and emails", async () => {
    orderFindUnique.mockResolvedValue({
      id: "ord_1",
      status: "PAID",
      customerId: "u_leah",
      totalAmount: 15000,
      currency: "USD",
      createdAt: new Date("2026-09-07T12:00:00.000Z"),
      customer: { id: "u_leah", name: "Leah", email: "leah@example.com" },
      items: [
        {
          productId: "p1",
          creatorId: "cp_mira",
          productTitle: "Kit A",
          price: 10000,
          quantity: 1,
          product: {
            title: "Kit A",
            slug: "kit-a",
            creator: {
              id: "cp_mira",
              storeName: "Mira Studio",
              userId: "u_mira",
              user: { email: "mira@example.com", name: "Mira" },
            },
          },
        },
        {
          productId: "p2",
          creatorId: "cp_kenji",
          productTitle: "Kit B",
          price: 5000,
          quantity: 1,
          product: {
            title: "Kit B",
            slug: "kit-b",
            creator: {
              id: "cp_kenji",
              storeName: "Kenji Lab",
              userId: "u_kenji",
              user: { email: "kenji@example.com", name: "Kenji" },
            },
          },
        },
      ],
    });
    preferenceFindUnique.mockResolvedValue(prefs());
    notificationCreate.mockResolvedValue(notificationRow());
    emailJobCreate.mockResolvedValue({ id: "ej_x" });

    await notifyOrderPaid("ord_1");

    expect(notificationCreate).toHaveBeenCalledTimes(3);
    const keys = notificationCreate.mock.calls.map(
      (call) => (call[0] as { data: { eventKey: string } }).data.eventKey,
    );
    expect(keys).toEqual(
      expect.arrayContaining([
        "purchase:ord_1",
        "creator-sale:ord_1:cp_mira",
        "creator-sale:ord_1:cp_kenji",
      ]),
    );
    expect(emailJobCreate).toHaveBeenCalledTimes(3);
  });

  it("is idempotent on duplicate event keys", async () => {
    orderFindUnique.mockResolvedValue({
      id: "ord_1",
      status: "PAID",
      customerId: "u_leah",
      totalAmount: 1000,
      currency: "USD",
      createdAt: new Date(),
      customer: { id: "u_leah", name: "Leah", email: "leah@example.com" },
      items: [
        {
          productId: "p1",
          creatorId: "cp_mira",
          productTitle: "Kit",
          price: 1000,
          quantity: 1,
          product: {
            title: "Kit",
            slug: "kit",
            creator: {
              id: "cp_mira",
              storeName: "Mira",
              userId: "u_mira",
              user: { email: "mira@example.com", name: "Mira" },
            },
          },
        },
      ],
    });
    preferenceFindUnique.mockResolvedValue(prefs());
    notificationCreate.mockRejectedValue({ code: "P2002" });
    emailJobCreate.mockRejectedValue({ code: "P2002" });

    await expect(notifyOrderPaid("ord_1")).resolves.toBeUndefined();
  });
});

describe("admin email health", () => {
  it("requires admin", async () => {
    const denied = await request(app)
      .get("/api/v1/admin/email-jobs")
      .set("Cookie", session(leah));
    expect(denied.status).toBe(403);
  });

  it("returns counts for admin", async () => {
    emailJobCount
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(2);
    emailJobFindMany.mockResolvedValue([
      {
        id: "ej_fail",
        type: "PURCHASE_SUCCESS",
        toEmail: "leah@example.com",
        attempts: 3,
        lastError: "provider down",
        updatedAt: new Date(),
        createdAt: new Date(),
      },
    ]);
    const res = await request(app)
      .get("/api/v1/admin/email-jobs")
      .set("Cookie", session(admin));
    expect(res.status).toBe(200);
    expect(res.body.data.counts.failed).toBe(2);
    expect(res.body.data.recentFailures[0].toEmail).toContain("***");
  });
});
