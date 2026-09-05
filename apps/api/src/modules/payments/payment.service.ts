import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database";
import { badRequest, forbidden, notFound, unauthorized } from "../../utils/app-error";
import { logEvent } from "../../utils/logger";
import { razorpayAmountFromCatalog } from "../../utils/money";
import { serializeOrder, isPaidStatus } from "./payment.types";
import {
  verifyCheckoutSignature,
  verifyWebhookSignature,
} from "./razorpay.service";
import type { VerifyRazorpayInput } from "./payment.validation";

const PENDING_WINDOW_MS = 20 * 60 * 1000;

export const orderDetailInclude = {
  items: {
    include: {
      product: {
        select: {
          slug: true,
          coverImage: true,
          productType: true,
          creator: { select: { storeName: true, slug: true } },
        },
      },
    },
  },
  payment: {
    select: {
      id: true,
      status: true,
      provider: true,
      amount: true,
      currency: true,
      providerOrderId: true,
    },
  },
} satisfies Prisma.OrderInclude;

export async function fulfillPaidOrder(input: {
  orderId: string;
  providerPaymentId: string;
  source: "verify" | "webhook";
}) {
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: input.orderId },
      include: { payment: true, items: true },
    });
    if (!order?.payment) throw notFound("Order not found");

    if (order.status === "PAID" || isPaidStatus(order.payment.status)) {
      return { alreadyPaid: true, customerId: order.customerId };
    }

    try {
      await tx.payment.update({
        where: { id: order.payment.id },
        data: {
          status: "PAID",
          providerPaymentId: input.providerPaymentId,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const paid = await tx.order.findUnique({
          where: { id: input.orderId },
          include: { payment: true },
        });
        if (paid?.status === "PAID" || (paid?.payment && isPaidStatus(paid.payment.status))) {
          return { alreadyPaid: true, customerId: order.customerId };
        }
      }
      throw error;
    }
    await tx.order.update({
      where: { id: order.id },
      data: { status: "PAID" },
    });
    await tx.purchase.createMany({
      data: order.items.map((item) => ({
        userId: order.customerId,
        productId: item.productId,
        orderId: order.id,
      })),
      skipDuplicates: true,
    });
    const cart = await tx.cart.findUnique({
      where: { customerId: order.customerId },
      select: { id: true },
    });
    if (cart) {
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    return { alreadyPaid: false, customerId: order.customerId };
  });

  logEvent("order_marked_paid", {
    orderId: input.orderId,
    source: input.source,
    alreadyPaid: result.alreadyPaid,
  });
  return result;
}

export async function verifyRazorpayCheckout(
  customerId: string,
  input: VerifyRazorpayInput,
) {
  logEvent("payment_verification_started", {
    razorpayOrderId: input.razorpay_order_id,
  });

  const valid = verifyCheckoutSignature({
    orderId: input.razorpay_order_id,
    paymentId: input.razorpay_payment_id,
    signature: input.razorpay_signature,
  });
  if (!valid) {
    logEvent("payment_verification_rejected", { reason: "signature" });
    throw badRequest("Payment signature is invalid.");
  }

  const payment = await prisma.payment.findUnique({
    where: { providerOrderId: input.razorpay_order_id },
    include: { order: { include: orderDetailInclude } },
  });
  if (!payment?.order) throw notFound("Payment not found");
  if (payment.order.customerId !== customerId) {
    throw forbidden("You cannot verify this payment.");
  }
  if (payment.amount !== razorpayAmountFromCatalog(payment.order.totalAmount)) {
    throw badRequest("Payment amount does not match this order.");
  }

  await fulfillPaidOrder({
    orderId: payment.orderId,
    providerPaymentId: input.razorpay_payment_id,
    source: "verify",
  });

  const order = await prisma.order.findUniqueOrThrow({
    where: { id: payment.orderId },
    include: orderDetailInclude,
  });
  logEvent("payment_verified", { orderId: order.id });
  return serializeOrder(order);
}

type RazorpayWebhookEvent = {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        amount?: number;
        status?: string;
      };
    };
    order?: {
      entity?: {
        id?: string;
        amount?: number;
        status?: string;
      };
    };
  };
};

export async function handleRazorpayWebhook(rawBody: string, signature: string | undefined) {
  if (!signature) throw unauthorized("Missing webhook signature.");
  if (!verifyWebhookSignature(rawBody, signature)) {
    logEvent("webhook_rejected", { reason: "signature" });
    throw unauthorized("Invalid webhook signature.");
  }

  const event = JSON.parse(rawBody) as RazorpayWebhookEvent;
  logEvent("webhook_received", { type: event.event ?? "unknown" });

  const paymentEntity = event.payload?.payment?.entity;
  const orderEntity = event.payload?.order?.entity;
  const razorpayOrderId = paymentEntity?.order_id ?? orderEntity?.id;
  if (!razorpayOrderId) {
    return { ok: true, ignored: true };
  }

  const payment = await prisma.payment.findUnique({
    where: { providerOrderId: razorpayOrderId },
    include: { order: true },
  });
  if (!payment) {
    logEvent("webhook_ignored", { reason: "unknown_order" });
    return { ok: true, ignored: true };
  }

  if (event.event === "payment.failed") {
    if (payment.order.status !== "PAID" && !isPaidStatus(payment.status)) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      });
      logEvent("payment_failed", { orderId: payment.orderId });
    }
    return { ok: true };
  }

  if (event.event === "payment.captured" || event.event === "order.paid") {
    const providerPaymentId = paymentEntity?.id ?? payment.providerPaymentId;
    if (!providerPaymentId) {
      return { ok: true, ignored: true };
    }
    await fulfillPaidOrder({
      orderId: payment.orderId,
      providerPaymentId,
      source: "webhook",
    });
  }

  return { ok: true };
}

export { PENDING_WINDOW_MS };
