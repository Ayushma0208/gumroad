import type { Coupon, CouponProduct, Currency, Prisma } from "@prisma/client";
import { env } from "../../config/env";
import { allocateDiscountCents, Money } from "../../utils/money";
import { eligibleLinesForCoupon } from "../coupons/coupon.service";

export type Tx = Prisma.TransactionClient;

type OrderItemRow = {
  id: string;
  productId: string;
  creatorId: string;
  price: number;
  quantity: number;
};

type CouponForEarnings = Coupon & { products: CouponProduct[] };

export function earningLedgerKey(orderItemId: string) {
  return `earning:orderItem:${orderItemId}`;
}

/**
 * Allocate order.discount across OrderItems using the same eligibility rules
 * as checkout coupons, then proportional split by eligible line gross.
 */
export function discountByOrderItem(input: {
  items: OrderItemRow[];
  orderDiscountCents: number;
  coupon: CouponForEarnings | null;
}): Map<string, number> {
  const result = new Map(input.items.map((item) => [item.id, 0]));
  if (!input.coupon || input.orderDiscountCents <= 0) return result;

  const lines = input.items.map((item) => ({
    productId: item.productId,
    creatorId: item.creatorId,
    productTitle: "",
    price: item.price,
    quantity: item.quantity,
    currency: "USD" as const,
  }));
  const eligibleLines = eligibleLinesForCoupon(input.coupon, lines);
  if (eligibleLines.length === 0) return result;

  // Map eligible product/creator pairs back to order items (digital carts: one row per product).
  const eligibleKey = new Set(
    eligibleLines.map((line) => `${line.productId}:${line.creatorId}`),
  );
  const eligibleItems = input.items.filter((item) =>
    eligibleKey.has(`${item.productId}:${item.creatorId}`),
  );

  const allocation = allocateDiscountCents({
    lines: eligibleItems.map((item) => ({
      id: item.id,
      grossCents: item.price * item.quantity,
    })),
    discountCents: input.orderDiscountCents,
  });

  for (const [id, amount] of allocation) {
    result.set(id, amount);
  }
  return result;
}

export type PostedEarning = {
  id: string;
  creatorId: string;
  orderItemId: string;
  creatorAmountCents: number;
  currency: Currency;
};

/**
 * Create CreatorEarning rows for a newly PAID order.
 * Idempotent via unique orderItemId / ledgerKey.
 * Must run inside the same fulfillment transaction when possible.
 */
export async function postEarningsForPaidOrder(
  tx: Tx,
  orderId: string,
): Promise<PostedEarning[]> {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      coupon: { include: { products: true } },
    },
  });
  if (!order || order.status !== "PAID") return [];
  if (order.items.length === 0) return [];

  const feeBps = env.PLATFORM_FEE_BPS;
  const holdingHours = env.PAYOUT_HOLDING_PERIOD_HOURS;
  const now = new Date();
  const availableAt = new Date(now.getTime() + holdingHours * 60 * 60 * 1000);
  const initialStatus = holdingHours === 0 ? "AVAILABLE" : "PENDING";

  const discounts = discountByOrderItem({
    items: order.items,
    orderDiscountCents: order.discount,
    coupon: order.coupon,
  });

  const posted: PostedEarning[] = [];

  for (const item of order.items) {
    const gross = item.price * item.quantity;
    Money.assertNonNegative(gross, "gross");
    const discountAmount = discounts.get(item.id) ?? 0;
    Money.assertNonNegative(discountAmount, "discount");
    if (discountAmount > gross) {
      throw new Error(`Discount exceeds gross for order item ${item.id}`);
    }
    const netSales = Money.subtract(gross, discountAmount);
    const platformFee = Money.feeFromBps(netSales, feeBps);
    const processingFee = 0;
    const creatorAmount = Money.subtract(
      Money.subtract(netSales, platformFee),
      processingFee,
    );
    Money.assertNonNegative(creatorAmount, "creatorAmount");

    try {
      const row = await tx.creatorEarning.create({
        data: {
          creatorId: item.creatorId,
          orderId: order.id,
          orderItemId: item.id,
          productId: item.productId,
          currency: order.currency,
          grossAmountCents: gross,
          discountAmountCents: discountAmount,
          netSalesCents: netSales,
          platformFeeCents: platformFee,
          platformFeeBps: feeBps,
          processingFeeCents: processingFee,
          creatorAmountCents: creatorAmount,
          status: initialStatus,
          availableAt,
          ledgerKey: earningLedgerKey(item.id),
        },
      });
      posted.push({
        id: row.id,
        creatorId: row.creatorId,
        orderItemId: row.orderItemId,
        creatorAmountCents: row.creatorAmountCents,
        currency: row.currency,
      });
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "P2002"
      ) {
        // Duplicate webhook / verify — earning already exists.
        continue;
      }
      throw error;
    }
  }

  return posted;
}

/** Promote PENDING → AVAILABLE when holding period elapsed. */
export async function promoteAvailableEarnings(
  tx: Tx,
  creatorId: string,
  now = new Date(),
) {
  await tx.creatorEarning.updateMany({
    where: {
      creatorId,
      status: "PENDING",
      availableAt: { lte: now },
    },
    data: { status: "AVAILABLE" },
  });
}
