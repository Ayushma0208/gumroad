import { createHash } from "node:crypto";
import type { Currency } from "@prisma/client";
import { prisma } from "../../config/database";
import { badRequest, conflict, forbidden } from "../../utils/app-error";
import { logEvent } from "../../utils/logger";
import { razorpayAmountFromCatalog } from "../../utils/money";
import {
  PENDING_WINDOW_MS,
} from "../payments/payment.service";
import {
  createRazorpayOrder,
  getRazorpayKeyId,
} from "../payments/razorpay.service";

const RAZORPAY_CURRENCIES = new Set<Currency>(["INR", "USD"]);

function checkoutKeyFor(
  items: Array<{ productId: string; quantity: number; price: number }>,
) {
  const fingerprint = items
    .map((item) => `${item.productId}:${item.price}:${item.quantity}`)
    .sort()
    .join("|");
  return createHash("sha256").update(fingerprint).digest("hex");
}

export async function createCheckoutOrder(customerId: string) {
  const cart = await prisma.cart.findUnique({
    where: { customerId },
    include: {
      items: {
        include: {
          product: {
            include: { creator: { select: { userId: true, id: true } } },
          },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    throw badRequest("Your bag is empty.");
  }

  const lines = [];
  for (const item of cart.items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      include: { creator: { select: { userId: true, id: true } } },
    });
    if (!product) {
      throw badRequest("A product in your bag is no longer available.");
    }
    if (product.status !== "PUBLISHED") {
      throw badRequest(`${product.title} is no longer published.`);
    }
    if (product.creator.userId === customerId) {
      throw forbidden("You cannot purchase your own product.");
    }
    const owned = await prisma.purchase.findUnique({
      where: {
        userId_productId: { userId: customerId, productId: product.id },
      },
    });
    if (owned) {
      throw conflict(`You already own ${product.title}.`);
    }
    lines.push({
      productId: product.id,
      creatorId: product.creatorId,
      productTitle: product.title,
      price: product.price,
      quantity: item.quantity,
      currency: product.currency,
    });
  }

  const currencies = new Set(lines.map((line) => line.currency));
  if (currencies.size !== 1) {
    throw badRequest("Checkout requires every item to use the same currency.");
  }
  const currency = lines[0]!.currency;
  if (!RAZORPAY_CURRENCIES.has(currency)) {
    throw badRequest("Razorpay checkout currently supports INR and USD only.");
  }

  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const discount = 0;
  const totalAmount = subtotal - discount;
  if (totalAmount <= 0) {
    throw badRequest("Order total is too small to charge.");
  }

  const checkoutKey = checkoutKeyFor(lines);
  const reusable = await prisma.order.findFirst({
    where: {
      customerId,
      status: "PENDING",
      checkoutKey,
      createdAt: { gte: new Date(Date.now() - PENDING_WINDOW_MS) },
      payment: {
        status: "PENDING",
        providerOrderId: { not: null },
        amount: totalAmount,
        currency,
      },
    },
    include: { payment: true },
  });

  if (reusable?.payment?.providerOrderId) {
    logEvent("checkout_order_reused", { orderId: reusable.id });
    return checkoutPayload(reusable.id, reusable.payment.providerOrderId, reusable.payment.amount, reusable.currency);
  }

  const failedPending = await prisma.order.findFirst({
    where: {
      customerId,
      status: "PENDING",
      checkoutKey,
      payment: { status: "FAILED", amount: totalAmount, currency },
    },
    include: { payment: true },
  });
  if (failedPending) {
    return attachRazorpayOrder(failedPending.id, totalAmount, currency, "checkout_order_retried", false);
  }

  await prisma.order.updateMany({
    where: {
      customerId,
      status: "PENDING",
      OR: [
        { checkoutKey: { not: checkoutKey } },
        { createdAt: { lt: new Date(Date.now() - PENDING_WINDOW_MS) } },
      ],
    },
    data: { status: "CANCELLED" },
  });

  try {
    const order = await prisma.order.create({
      data: {
        customerId,
        subtotal,
        discount,
        totalAmount,
        currency,
        status: "PENDING",
        checkoutKey,
        items: {
          create: lines.map((line) => ({
            productId: line.productId,
            creatorId: line.creatorId,
            productTitle: line.productTitle,
            price: line.price,
            quantity: line.quantity,
          })),
        },
        payment: {
          create: {
            provider: "RAZORPAY",
            amount: totalAmount,
            currency,
            status: "PENDING",
          },
        },
      },
    });
    return attachRazorpayOrder(order.id, totalAmount, currency, "checkout_order_created", true);
  } catch (error) {
    if (isUniqueViolation(error)) {
      const existing = await prisma.order.findFirst({
        where: { customerId, status: "PENDING" },
        include: { payment: true },
      });
      if (existing?.payment?.providerOrderId && existing.checkoutKey === checkoutKey) {
        logEvent("checkout_order_reused", { orderId: existing.id, reason: "race" });
        return checkoutPayload(
          existing.id,
          existing.payment.providerOrderId,
          existing.payment.amount,
          existing.currency,
        );
      }
    }
    throw error;
  }
}

function checkoutPayload(
  orderId: string,
  razorpayOrderId: string,
  amount: number,
  currency: Currency,
) {
  return {
    orderId,
    razorpayOrderId,
    amount: razorpayAmountFromCatalog(amount),
    currency,
    keyId: getRazorpayKeyId(),
  };
}

async function attachRazorpayOrder(
  orderId: string,
  totalAmount: number,
  currency: Currency,
  event: string,
  cancelOnFailure: boolean,
) {
  try {
    const razorpayOrder = await createRazorpayOrder({
      amount: razorpayAmountFromCatalog(totalAmount),
      currency,
      receipt: orderId,
      notes: { orderId },
    });
    await prisma.payment.update({
      where: { orderId },
      data: {
        status: "PENDING",
        providerOrderId: razorpayOrder.id,
        providerPaymentId: null,
      },
    });
    logEvent(event, {
      orderId,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency,
    });
    return checkoutPayload(orderId, razorpayOrder.id, razorpayOrder.amount, currency);
  } catch (error) {
    if (cancelOnFailure) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });
    }
    throw error;
  }
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  );
}
