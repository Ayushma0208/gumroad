import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";

const {
  cartUpsert,
  cartFindUnique,
  cartItemFindUnique,
  cartItemCreate,
  cartItemUpdate,
  cartItemDelete,
  cartItemDeleteMany,
  productFindUnique,
  orderItemFindFirst,
  userFindUnique,
  transaction,
} = vi.hoisted(() => ({
  cartUpsert: vi.fn(),
  cartFindUnique: vi.fn(),
  cartItemFindUnique: vi.fn(),
  cartItemCreate: vi.fn(),
  cartItemUpdate: vi.fn(),
  cartItemDelete: vi.fn(),
  cartItemDeleteMany: vi.fn(),
  productFindUnique: vi.fn(),
  orderItemFindFirst: vi.fn(),
  userFindUnique: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("../src/config/database", () => ({
  prisma: {
    cart: { upsert: cartUpsert, findUnique: cartFindUnique },
    cartItem: {
      findUnique: cartItemFindUnique,
      create: cartItemCreate,
      update: cartItemUpdate,
      delete: cartItemDelete,
      deleteMany: cartItemDeleteMany,
    },
    product: { findUnique: productFindUnique },
    orderItem: { findFirst: orderItemFindFirst },
    user: { findUnique: userFindUnique },
    $transaction: transaction,
    $connect: vi.fn(),
  },
}));

import { createApp } from "../src/app";
import { cookieName } from "../src/config/cookies";

const app = createApp();

const customer = {
  id: "u_leah",
  email: "leah@example.com",
  role: "CUSTOMER" as const,
};
const otherCustomer = {
  id: "u_owen",
  email: "owen@example.com",
  role: "CUSTOMER" as const,
};
const creator = {
  id: "u_mira",
  email: "mira@example.com",
  role: "CREATOR" as const,
};

function session(user: { id: string; email: string; role: Role }) {
  const token = jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "1d" },
  );
  userFindUnique.mockResolvedValue(user);
  return [`${cookieName()}=${token}`];
}

function product(overrides: Record<string, unknown> = {}) {
  return {
    id: "p_northline",
    title: "Northline UI System",
    slug: "northline-ui-system",
    coverImage: "https://images.example.com/cover.jpg",
    price: 7900,
    currency: "USD",
    productType: "TEMPLATE",
    status: "PUBLISHED",
    creator: { storeName: "Northline Studio", slug: "mira", userId: "u_mira" },
    ...overrides,
  };
}

function cartRecord(items: unknown[] = []) {
  return {
    id: "cart_leah",
    customerId: "u_leah",
    items,
  };
}

function cartItem(overrides: Record<string, unknown> = {}) {
  return {
    id: "item_1",
    cartId: "cart_leah",
    productId: "p_northline",
    quantity: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    product: product(),
    ...overrides,
  };
}

describe("cart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      const tx = {
        cart: { upsert: cartUpsert },
        cartItem: {
          findUnique: cartItemFindUnique,
          create: cartItemCreate,
          update: cartItemUpdate,
        },
      };
      return fn(tx);
    });
    cartUpsert.mockImplementation(async () => cartRecord([]));
    orderItemFindFirst.mockResolvedValue(null);
  });

  it("rejects unauthenticated access", async () => {
    const response = await request(app).get("/api/v1/cart");
    expect(response.status).toBe(401);
  });

  it("lets an authenticated customer read an empty cart", async () => {
    const cookies = session(customer);
    cartUpsert.mockResolvedValue(cartRecord([]));

    const response = await request(app).get("/api/v1/cart").set("Cookie", cookies);

    expect(response.status).toBe(200);
    expect(response.body.data.items).toEqual([]);
    expect(response.body.data.summary).toMatchObject({
      subtotal: 0,
      itemCount: 0,
      total: 0,
      currency: "USD",
    });
  });

  it("adds a published product", async () => {
    const cookies = session(customer);
    productFindUnique.mockResolvedValue(product());
    cartItemFindUnique.mockResolvedValue(null);
    cartItemCreate.mockResolvedValue(cartItem());
    cartUpsert
      .mockResolvedValueOnce({ id: "cart_leah", customerId: "u_leah" })
      .mockResolvedValueOnce(cartRecord([cartItem()]));

    const response = await request(app)
      .post("/api/v1/cart/items")
      .set("Cookie", cookies)
      .send({ productId: "p_northline", quantity: 1 });

    expect(response.status).toBe(201);
    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.items[0].product.title).toBe("Northline UI System");
    expect(response.body.data.items[0].product.price).toBe(79);
    expect(response.body.data.summary.total).toBe(79);
    expect(response.body.data.summary.itemCount).toBe(1);
    expect(cartItemCreate).toHaveBeenCalled();
  });

  it("does not create a duplicate cart line for the same product", async () => {
    const cookies = session(customer);
    productFindUnique.mockResolvedValue(product());
    cartItemFindUnique.mockResolvedValue(cartItem());
    cartUpsert
      .mockResolvedValueOnce({ id: "cart_leah", customerId: "u_leah" })
      .mockResolvedValueOnce(cartRecord([cartItem()]));

    const response = await request(app)
      .post("/api/v1/cart/items")
      .set("Cookie", cookies)
      .send({ productId: "p_northline", quantity: 1 });

    expect(response.status).toBe(201);
    expect(cartItemCreate).not.toHaveBeenCalled();
    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.items[0].quantity).toBe(1);
  });

  it("rejects unpublished products", async () => {
    const cookies = session(customer);
    productFindUnique.mockResolvedValue(product({ status: "DRAFT" }));

    const response = await request(app)
      .post("/api/v1/cart/items")
      .set("Cookie", cookies)
      .send({ productId: "p_northline", quantity: 1 });

    expect(response.status).toBe(400);
    expect(cartItemCreate).not.toHaveBeenCalled();
  });

  it("rejects a missing product", async () => {
    const cookies = session(customer);
    productFindUnique.mockResolvedValue(null);

    const response = await request(app)
      .post("/api/v1/cart/items")
      .set("Cookie", cookies)
      .send({ productId: "missing", quantity: 1 });

    expect(response.status).toBe(404);
  });

  it("rejects adding the creator’s own product", async () => {
    const cookies = session(customer);
    productFindUnique.mockResolvedValue(product({ creator: { userId: "u_leah" } }));

    const response = await request(app)
      .post("/api/v1/cart/items")
      .set("Cookie", cookies)
      .send({ productId: "p_northline", quantity: 1 });

    expect(response.status).toBe(403);
  });

  it("rejects a product the customer already purchased", async () => {
    const cookies = session(customer);
    productFindUnique.mockResolvedValue(product());
    orderItemFindFirst.mockResolvedValue({ id: "oi_1" });

    const response = await request(app)
      .post("/api/v1/cart/items")
      .set("Cookie", cookies)
      .send({ productId: "p_northline", quantity: 1 });

    expect(response.status).toBe(409);
  });

  it("rejects an invalid quantity", async () => {
    const cookies = session(customer);

    const zero = await request(app)
      .post("/api/v1/cart/items")
      .set("Cookie", cookies)
      .send({ productId: "p_northline", quantity: 0 });
    const bulk = await request(app)
      .post("/api/v1/cart/items")
      .set("Cookie", cookies)
      .send({ productId: "p_northline", quantity: 50 });

    expect(zero.status).toBe(400);
    expect(bulk.status).toBe(400);
  });

  it("updates an item in the customer’s own cart", async () => {
    const cookies = session(customer);
    cartItemFindUnique.mockResolvedValue({
      ...cartItem(),
      cart: { customerId: "u_leah" },
      product: { productType: "TEMPLATE" },
    });
    cartUpsert.mockResolvedValue(cartRecord([cartItem()]));

    const response = await request(app)
      .patch("/api/v1/cart/items/item_1")
      .set("Cookie", cookies)
      .send({ quantity: 1 });

    expect(response.status).toBe(200);
    expect(response.body.data.items[0].quantity).toBe(1);
  });

  it("cannot update another customer’s cart item", async () => {
    const cookies = session(otherCustomer);
    cartItemFindUnique.mockResolvedValue({
      ...cartItem(),
      cart: { customerId: "u_leah" },
      product: { productType: "TEMPLATE" },
    });

    const response = await request(app)
      .patch("/api/v1/cart/items/item_1")
      .set("Cookie", cookies)
      .send({ quantity: 1 });

    expect(response.status).toBe(404);
    expect(cartItemUpdate).not.toHaveBeenCalled();
  });

  it("rejects an invalid quantity on update", async () => {
    const cookies = session(customer);
    cartItemFindUnique.mockResolvedValue({
      ...cartItem(),
      cart: { customerId: "u_leah" },
      product: { productType: "TEMPLATE" },
    });

    const response = await request(app)
      .patch("/api/v1/cart/items/item_1")
      .set("Cookie", cookies)
      .send({ quantity: 8 });

    expect(response.status).toBe(400);
  });

  it("removes an item from the customer’s cart", async () => {
    const cookies = session(customer);
    cartItemFindUnique.mockResolvedValue({
      ...cartItem(),
      cart: { customerId: "u_leah" },
    });
    cartItemDelete.mockResolvedValue(cartItem());
    cartUpsert.mockResolvedValue(cartRecord([]));

    const response = await request(app)
      .delete("/api/v1/cart/items/item_1")
      .set("Cookie", cookies);

    expect(response.status).toBe(200);
    expect(cartItemDelete).toHaveBeenCalled();
    expect(response.body.data.items).toHaveLength(0);
  });

  it("cannot remove another customer’s cart item", async () => {
    const cookies = session(otherCustomer);
    cartItemFindUnique.mockResolvedValue({
      ...cartItem(),
      cart: { customerId: "u_leah" },
    });

    const response = await request(app)
      .delete("/api/v1/cart/items/item_1")
      .set("Cookie", cookies);

    expect(response.status).toBe(404);
    expect(cartItemDelete).not.toHaveBeenCalled();
  });

  it("clears the authenticated customer’s cart only", async () => {
    const cookies = session(customer);
    cartFindUnique.mockResolvedValue({ id: "cart_leah", customerId: "u_leah" });
    cartItemDeleteMany.mockResolvedValue({ count: 1 });
    cartUpsert.mockResolvedValue(cartRecord([]));

    const response = await request(app).delete("/api/v1/cart").set("Cookie", cookies);

    expect(response.status).toBe(200);
    expect(cartFindUnique).toHaveBeenCalledWith({ where: { customerId: "u_leah" } });
    expect(cartItemDeleteMany).toHaveBeenCalledWith({
      where: { cartId: "cart_leah" },
    });
    expect(response.body.data.summary.itemCount).toBe(0);
  });

  it("does not let a creator use the customer cart", async () => {
    const cookies = session(creator);
    const response = await request(app).get("/api/v1/cart").set("Cookie", cookies);
    expect(response.status).toBe(403);
  });

  it("calculates totals from catalog prices, not the client", async () => {
    const cookies = session(customer);
    const second = cartItem({
      id: "item_2",
      productId: "p_atlas",
      product: product({
        id: "p_atlas",
        title: "Atlas Next Starter",
        slug: "atlas-next-starter",
        price: 6900,
      }),
    });
    cartUpsert.mockResolvedValue(cartRecord([cartItem(), second]));

    const response = await request(app).get("/api/v1/cart").set("Cookie", cookies);

    expect(response.body.data.summary.subtotal).toBe(148);
    expect(response.body.data.summary.total).toBe(148);
    expect(response.body.data.summary.itemCount).toBe(2);
  });
});
