import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";

const {
  cartFindUnique,
  productFindUnique,
  purchaseFindUnique,
  purchaseCreateMany,
  orderFindFirst,
  orderFindUnique,
  orderFindUniqueOrThrow,
  orderFindMany,
  orderCreate,
  orderUpdate,
  orderUpdateMany,
  paymentFindUnique,
  paymentUpdate,
  cartItemDeleteMany,
  userFindUnique,
  transaction,
} = vi.hoisted(() => ({
  cartFindUnique: vi.fn(),
  productFindUnique: vi.fn(),
  purchaseFindUnique: vi.fn(),
  purchaseCreateMany: vi.fn(),
  orderFindFirst: vi.fn(),
  orderFindUnique: vi.fn(),
  orderFindUniqueOrThrow: vi.fn(),
  orderFindMany: vi.fn(),
  orderCreate: vi.fn(),
  orderUpdate: vi.fn(),
  orderUpdateMany: vi.fn(),
  paymentFindUnique: vi.fn(),
  paymentUpdate: vi.fn(),
  cartItemDeleteMany: vi.fn(),
  userFindUnique: vi.fn(),
  transaction: vi.fn(),
}));

const { createRazorpayOrder } = vi.hoisted(() => ({
  createRazorpayOrder: vi.fn(),
}));

vi.mock("../src/config/database", () => ({
  prisma: {
    cart: { findUnique: cartFindUnique },
    product: { findUnique: productFindUnique },
    purchase: { findUnique: purchaseFindUnique, createMany: purchaseCreateMany },
    order: {
      findFirst: orderFindFirst,
      findUnique: orderFindUnique,
      findUniqueOrThrow: orderFindUniqueOrThrow,
      findMany: orderFindMany,
      create: orderCreate,
      update: orderUpdate,
      updateMany: orderUpdateMany,
    },
    payment: { findUnique: paymentFindUnique, update: paymentUpdate },
    cartItem: { deleteMany: cartItemDeleteMany },
    user: { findUnique: userFindUnique },
    $transaction: transaction,
    $connect: vi.fn(),
  },
}));

vi.mock("../src/modules/payments/razorpay.service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/modules/payments/razorpay.service")>();
  return {
    ...actual,
    createRazorpayOrder,
    getRazorpayKeyId: () => "rzp_test_lumen",
  };
});

import { createApp } from "../src/app";
import { cookieName } from "../src/config/cookies";

const app = createApp();

const customer = { id: "u_leah", email: "leah@example.com", role: "CUSTOMER" as const };
const other = { id: "u_owen", email: "owen@example.com", role: "CUSTOMER" as const };

function session(user: { id: string; email: string; role: Role }) {
  const token = jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "1d" },
  );
  userFindUnique.mockResolvedValue(user);
  return [`${cookieName()}=${token}`];
}

function catalogProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: "p_northline",
    title: "Northline UI System",
    slug: "northline-ui-system",
    coverImage: "https://images.example.com/cover.jpg",
    price: 7900,
    currency: "USD",
    productType: "TEMPLATE",
    status: "PUBLISHED",
    creatorId: "cp_mira",
    creator: { userId: "u_mira", id: "cp_mira" },
    ...overrides,
  };
}

function orderRecord(overrides: Record<string, unknown> = {}) {
  const now = new Date("2026-09-05T12:00:00.000Z");
  return {
    id: "ord_1",
    customerId: "u_leah",
    subtotal: 7900,
    discount: 0,
    totalAmount: 7900,
    currency: "USD",
    status: "PENDING",
    checkoutKey: "key",
    createdAt: now,
    updatedAt: now,
    items: [
      {
        id: "oi_1",
        productId: "p_northline",
        creatorId: "cp_mira",
        productTitle: "Northline UI System",
        price: 7900,
        quantity: 1,
        product: {
          slug: "northline-ui-system",
          coverImage: "https://images.example.com/cover.jpg",
          productType: "TEMPLATE",
          creator: { storeName: "Northline Studio", slug: "mira" },
        },
      },
    ],
    payment: {
      id: "pay_1",
      status: "PENDING",
      provider: "RAZORPAY",
      amount: 7900,
      currency: "USD",
      providerOrderId: "order_rzp_1",
      providerPaymentId: null,
    },
    ...overrides,
  };
}

function signCheckout(orderId: string, paymentId: string) {
  return createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
}

function signWebhook(body: string) {
  return createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET as string)
    .update(body)
    .digest("hex");
}

describe("checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    purchaseFindUnique.mockResolvedValue(null);
    orderFindFirst.mockResolvedValue(null);
    orderUpdateMany.mockResolvedValue({ count: 0 });
    createRazorpayOrder.mockResolvedValue({
      id: "order_rzp_1",
      amount: 7900,
      currency: "USD",
    });
    paymentUpdate.mockResolvedValue({});
    transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn({
        order: { findUnique: orderFindUnique, update: orderUpdate },
        payment: { update: paymentUpdate },
        purchase: { createMany: purchaseCreateMany },
        cart: { findUnique: cartFindUnique },
        cartItem: { deleteMany: cartItemDeleteMany },
      }),
    );
  });

  it("rejects unauthenticated checkout", async () => {
    const response = await request(app).post("/api/v1/checkout/create-order");
    expect(response.status).toBe(401);
  });

  it("rejects an empty cart", async () => {
    cartFindUnique.mockResolvedValue({ id: "cart_1", customerId: "u_leah", items: [] });
    const response = await request(app)
      .post("/api/v1/checkout/create-order")
      .set("Cookie", session(customer));
    expect(response.status).toBe(400);
    expect(createRazorpayOrder).not.toHaveBeenCalled();
  });

  it("rejects unpublished products", async () => {
    cartFindUnique.mockResolvedValue({
      id: "cart_1",
      items: [{ productId: "p_northline", quantity: 1, product: catalogProduct() }],
    });
    productFindUnique.mockResolvedValue(catalogProduct({ status: "DRAFT" }));
    const response = await request(app)
      .post("/api/v1/checkout/create-order")
      .set("Cookie", session(customer));
    expect(response.status).toBe(400);
    expect(orderCreate).not.toHaveBeenCalled();
  });

  it("rejects a missing product", async () => {
    cartFindUnique.mockResolvedValue({
      id: "cart_1",
      items: [{ productId: "missing", quantity: 1, product: catalogProduct() }],
    });
    productFindUnique.mockResolvedValue(null);
    const response = await request(app)
      .post("/api/v1/checkout/create-order")
      .set("Cookie", session(customer));
    expect(response.status).toBe(400);
  });

  it("rejects an already purchased product", async () => {
    cartFindUnique.mockResolvedValue({
      id: "cart_1",
      items: [{ productId: "p_northline", quantity: 1, product: catalogProduct() }],
    });
    productFindUnique.mockResolvedValue(catalogProduct());
    purchaseFindUnique.mockResolvedValue({ id: "pur_1" });
    const response = await request(app)
      .post("/api/v1/checkout/create-order")
      .set("Cookie", session(customer));
    expect(response.status).toBe(409);
  });

  it("creates a Razorpay order using catalog prices, not the request body", async () => {
    cartFindUnique.mockResolvedValue({
      id: "cart_1",
      items: [{ productId: "p_northline", quantity: 1, product: catalogProduct() }],
    });
    productFindUnique.mockResolvedValue(catalogProduct({ price: 2900 }));
    orderCreate.mockResolvedValue({ id: "ord_1" });
    createRazorpayOrder.mockResolvedValue({
      id: "order_rzp_1",
      amount: 2900,
      currency: "USD",
    });

    const response = await request(app)
      .post("/api/v1/checkout/create-order")
      .set("Cookie", session(customer))
      .send({ total: 1, price: 1, currency: "INR", creatorId: "hack" });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      orderId: "ord_1",
      razorpayOrderId: "order_rzp_1",
      amount: 2900,
      currency: "USD",
      keyId: "rzp_test_lumen",
    });
    expect(JSON.stringify(response.body)).not.toContain("RAZORPAY_KEY_SECRET");
    expect(JSON.stringify(response.body)).not.toContain("test_razorpay_key_secret_value");
    expect(createRazorpayOrder).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 2900, currency: "USD", receipt: "ord_1" }),
    );
    expect(orderCreate.mock.calls[0][0].data.totalAmount).toBe(2900);
  });

  it("reuses a pending Razorpay order instead of creating duplicates", async () => {
    cartFindUnique.mockResolvedValue({
      id: "cart_1",
      items: [{ productId: "p_northline", quantity: 1, product: catalogProduct() }],
    });
    productFindUnique.mockResolvedValue(catalogProduct());
    orderFindFirst.mockResolvedValueOnce(
      orderRecord({ payment: { ...orderRecord().payment, amount: 7900 } }),
    );

    const first = await request(app)
      .post("/api/v1/checkout/create-order")
      .set("Cookie", session(customer));
    expect(first.status).toBe(201);
    expect(orderCreate).not.toHaveBeenCalled();
    expect(createRazorpayOrder).not.toHaveBeenCalled();
  });
});

describe("payment verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn({
        order: { findUnique: orderFindUnique, update: orderUpdate },
        payment: { update: paymentUpdate },
        purchase: { createMany: purchaseCreateMany },
        cart: { findUnique: cartFindUnique },
        cartItem: { deleteMany: cartItemDeleteMany },
      }),
    );
    cartFindUnique.mockResolvedValue({ id: "cart_1" });
    cartItemDeleteMany.mockResolvedValue({ count: 1 });
    purchaseCreateMany.mockResolvedValue({ count: 1 });
    paymentUpdate.mockResolvedValue({});
    orderUpdate.mockResolvedValue({});
  });

  it("rejects an invalid signature", async () => {
    const response = await request(app)
      .post("/api/v1/payments/razorpay/verify")
      .set("Cookie", session(customer))
      .send({
        razorpay_order_id: "order_rzp_1",
        razorpay_payment_id: "pay_1",
        razorpay_signature: "deadbeef",
      });
    expect(response.status).toBe(400);
    expect(orderUpdate).not.toHaveBeenCalled();
  });

  it("rejects verification for another customer’s order", async () => {
    const signature = signCheckout("order_rzp_1", "pay_rzp_1");
    paymentFindUnique.mockResolvedValue({
      orderId: "ord_1",
      amount: 7900,
      order: orderRecord({ customerId: "u_leah" }),
    });
    const response = await request(app)
      .post("/api/v1/payments/razorpay/verify")
      .set("Cookie", session(other))
      .send({
        razorpay_order_id: "order_rzp_1",
        razorpay_payment_id: "pay_rzp_1",
        razorpay_signature: signature,
      });
    expect(response.status).toBe(403);
  });

  it("marks the order paid after a valid signature and is idempotent", async () => {
    const signature = signCheckout("order_rzp_1", "pay_rzp_1");
    const pending = orderRecord();
    const paid = orderRecord({
      status: "PAID",
      payment: { ...orderRecord().payment, status: "PAID", providerPaymentId: "pay_rzp_1" },
    });
    paymentFindUnique.mockResolvedValue({
      orderId: "ord_1",
      amount: 7900,
      order: pending,
    });
    orderFindUnique
      .mockResolvedValueOnce(pending)
      .mockResolvedValueOnce({ ...paid, payment: paid.payment, items: paid.items });
    orderFindUniqueOrThrow.mockResolvedValue(paid);

    const first = await request(app)
      .post("/api/v1/payments/razorpay/verify")
      .set("Cookie", session(customer))
      .send({
        razorpay_order_id: "order_rzp_1",
        razorpay_payment_id: "pay_rzp_1",
        razorpay_signature: signature,
      });
    expect(first.status).toBe(200);
    expect(first.body.data.order.status).toBe("PAID");
    expect(first.body.data.order.payment.status).toBe("PAID");
    expect(purchaseCreateMany).toHaveBeenCalled();
    expect(cartItemDeleteMany).toHaveBeenCalled();

    orderFindUnique.mockResolvedValue({ ...paid, payment: paid.payment, items: paid.items });
    orderFindUniqueOrThrow.mockResolvedValue(paid);
    const second = await request(app)
      .post("/api/v1/payments/razorpay/verify")
      .set("Cookie", session(customer))
      .send({
        razorpay_order_id: "order_rzp_1",
        razorpay_payment_id: "pay_rzp_1",
        razorpay_signature: signature,
      });
    expect(second.status).toBe(200);
    expect(second.body.data.order.status).toBe("PAID");
    expect(purchaseCreateMany).toHaveBeenCalledTimes(1);
  });
});

describe("razorpay webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn({
        order: { findUnique: orderFindUnique, update: orderUpdate },
        payment: { update: paymentUpdate },
        purchase: { createMany: purchaseCreateMany },
        cart: { findUnique: cartFindUnique },
        cartItem: { deleteMany: cartItemDeleteMany },
      }),
    );
    cartFindUnique.mockResolvedValue({ id: "cart_1" });
    purchaseCreateMany.mockResolvedValue({ count: 1 });
  });

  it("rejects an invalid signature", async () => {
    const body = JSON.stringify({ event: "payment.captured" });
    const response = await request(app)
      .post("/api/v1/payments/razorpay/webhook")
      .set("Content-Type", "application/json")
      .set("x-razorpay-signature", "nope")
      .send(body);
    expect(response.status).toBe(401);
  });

  it("fulfills a captured payment and stays idempotent", async () => {
    const pending = orderRecord();
    const paid = orderRecord({ status: "PAID", payment: { ...orderRecord().payment, status: "PAID" } });
    const body = JSON.stringify({
      event: "payment.captured",
      payload: {
        payment: {
          entity: { id: "pay_rzp_1", order_id: "order_rzp_1", amount: 7900, status: "captured" },
        },
      },
    });
    paymentFindUnique.mockResolvedValue({
      id: "pay_1",
      orderId: "ord_1",
      status: "PENDING",
      providerPaymentId: null,
      order: pending,
    });
    orderFindUnique.mockResolvedValueOnce(pending).mockResolvedValueOnce({ ...paid, items: paid.items, payment: paid.payment });

    const first = await request(app)
      .post("/api/v1/payments/razorpay/webhook")
      .set("Content-Type", "application/json")
      .set("x-razorpay-signature", signWebhook(body))
      .send(body);
    expect(first.status).toBe(200);

    orderFindUnique.mockResolvedValue({ ...paid, items: paid.items, payment: paid.payment });
    const second = await request(app)
      .post("/api/v1/payments/razorpay/webhook")
      .set("Content-Type", "application/json")
      .set("x-razorpay-signature", signWebhook(body))
      .send(body);
    expect(second.status).toBe(200);
    expect(purchaseCreateMany).toHaveBeenCalledTimes(1);
  });

  it("marks payment failed without clearing the cart", async () => {
    const body = JSON.stringify({
      event: "payment.failed",
      payload: {
        payment: {
          entity: { id: "pay_rzp_fail", order_id: "order_rzp_1", status: "failed" },
        },
      },
    });
    paymentFindUnique.mockResolvedValue({
      id: "pay_1",
      orderId: "ord_1",
      status: "PENDING",
      order: orderRecord(),
    });
    const response = await request(app)
      .post("/api/v1/payments/razorpay/webhook")
      .set("Content-Type", "application/json")
      .set("x-razorpay-signature", signWebhook(body))
      .send(body);
    expect(response.status).toBe(200);
    expect(paymentUpdate).toHaveBeenCalledWith({
      where: { id: "pay_1" },
      data: { status: "FAILED" },
    });
    expect(orderUpdate).not.toHaveBeenCalled();
    expect(cartItemDeleteMany).not.toHaveBeenCalled();
  });
});

describe("order security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not let a customer read another customer’s order", async () => {
    orderFindUnique.mockResolvedValue(orderRecord({ customerId: "u_leah" }));
    const response = await request(app)
      .get("/api/v1/orders/ord_1")
      .set("Cookie", session(other));
    expect(response.status).toBe(403);
  });

  it("returns the owner’s order without payment secrets", async () => {
    orderFindUnique.mockResolvedValue(orderRecord({ status: "PAID" }));
    const response = await request(app)
      .get("/api/v1/orders/ord_1")
      .set("Cookie", session(customer));
    expect(response.status).toBe(200);
    expect(response.body.data.order.id).toBe("ord_1");
    expect(JSON.stringify(response.body)).not.toContain("providerOrderId");
    expect(JSON.stringify(response.body)).not.toContain("test_razorpay_key_secret");
    expect(JSON.stringify(response.body)).not.toContain("RAZORPAY_KEY_SECRET");
  });

  it("has no client route to mark an order paid", async () => {
    const response = await request(app)
      .patch("/api/v1/orders/ord_1")
      .set("Cookie", session(customer))
      .send({ status: "PAID", total: 1 });
    expect(response.status).toBe(404);
  });
});
