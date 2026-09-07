import type { Coupon, CouponType, Currency } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database";
import { AppError, badRequest, conflict, forbidden, notFound } from "../../utils/app-error";
import { majorFromMinor } from "../../utils/money";
import {
  paginationMeta,
  parsePagination,
  skipTake,
} from "../../utils/pagination";
import type {
  CreateCouponInput,
  ListCreatorCouponsQuery,
  UpdateCouponInput,
} from "./coupon.schema";

export type CouponErrorCode =
  | "COUPON_NOT_FOUND"
  | "COUPON_INACTIVE"
  | "COUPON_NOT_STARTED"
  | "COUPON_EXPIRED"
  | "COUPON_USAGE_LIMIT_REACHED"
  | "USER_COUPON_LIMIT_REACHED"
  | "MINIMUM_ORDER_NOT_MET"
  | "COUPON_NOT_APPLICABLE"
  | "COUPON_INVALID";

export type CartLineForPricing = {
  productId: string;
  creatorId: string;
  productTitle: string;
  price: number;
  quantity: number;
  currency: Currency;
};

export type CouponDiscountResult = {
  valid: true;
  couponId: string;
  code: string;
  type: CouponType;
  value: number;
  discountAmount: number;
  eligibleSubtotal: number;
  cartSubtotal: number;
  finalTotal: number;
  affectedProductIds: string[];
};

type CouponWithProducts = Coupon & {
  products: { productId: string }[];
};

export function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase();
}

export function couponError(code: CouponErrorCode, message: string) {
  return badRequest(message, { code });
}

function isCouponError(error: unknown): error is AppError {
  return error instanceof AppError && error.statusCode === 400;
}

export function calculateDiscountAmount(input: {
  type: CouponType;
  value: number;
  eligibleSubtotal: number;
  maxDiscount: number | null;
}) {
  if (input.eligibleSubtotal <= 0) return 0;
  let discount = 0;
  if (input.type === "PERCENTAGE") {
    discount = Math.floor((input.eligibleSubtotal * input.value) / 100);
    if (input.maxDiscount != null) {
      discount = Math.min(discount, input.maxDiscount);
    }
  } else {
    discount = input.value;
  }
  return Math.max(0, Math.min(discount, input.eligibleSubtotal));
}

export function eligibleLinesForCoupon(
  coupon: CouponWithProducts,
  lines: CartLineForPricing[],
) {
  const productIds = coupon.products.map((row) => row.productId);
  if (productIds.length > 0) {
    const allowed = new Set(productIds);
    return lines.filter((line) => allowed.has(line.productId));
  }
  if (!coupon.creatorId) {
    return lines;
  }
  return lines.filter((line) => line.creatorId === coupon.creatorId);
}

export async function assertCouponUsable(
  coupon: CouponWithProducts,
  userId: string,
  eligibleSubtotal: number,
  now = new Date(),
  tx: Prisma.TransactionClient | typeof prisma = prisma,
) {
  if (!coupon.isActive) {
    throw couponError("COUPON_INACTIVE", "This coupon is no longer active.");
  }
  if (coupon.startsAt && coupon.startsAt.getTime() > now.getTime()) {
    throw couponError("COUPON_NOT_STARTED", "This coupon isn't active yet.");
  }
  if (coupon.expiresAt && coupon.expiresAt.getTime() < now.getTime()) {
    throw couponError("COUPON_EXPIRED", "This coupon has expired.");
  }
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    throw couponError(
      "COUPON_USAGE_LIMIT_REACHED",
      "This coupon has reached its usage limit.",
    );
  }
  if (coupon.perUserLimit != null) {
    const usedByCustomer = await tx.couponRedemption.count({
      where: { couponId: coupon.id, userId },
    });
    if (usedByCustomer >= coupon.perUserLimit) {
      throw couponError(
        "USER_COUPON_LIMIT_REACHED",
        "You've already used this coupon.",
      );
    }
  }
  if (
    coupon.minOrderAmount != null &&
    eligibleSubtotal < coupon.minOrderAmount
  ) {
    throw couponError(
      "MINIMUM_ORDER_NOT_MET",
      "Add more eligible items to use this coupon.",
    );
  }
}

export async function loadCouponByCode(code: string) {
  const normalized = normalizeCouponCode(code);
  return prisma.coupon.findUnique({
    where: { code: normalized },
    include: { products: { select: { productId: true } } },
  });
}

export async function applyCouponToCartLines(input: {
  userId: string;
  code: string | undefined | null;
  lines: CartLineForPricing[];
  now?: Date;
}): Promise<CouponDiscountResult | null> {
  if (!input.code) return null;
  const coupon = await loadCouponByCode(input.code);
  if (!coupon) {
    throw couponError("COUPON_NOT_FOUND", "That coupon code isn't valid.");
  }

  const eligible = eligibleLinesForCoupon(coupon, input.lines);
  if (eligible.length === 0) {
    throw couponError(
      "COUPON_NOT_APPLICABLE",
      "This coupon doesn’t apply to the products in your bag.",
    );
  }

  const eligibleSubtotal = eligible.reduce(
    (sum, line) => sum + line.price * line.quantity,
    0,
  );
  const cartSubtotal = input.lines.reduce(
    (sum, line) => sum + line.price * line.quantity,
    0,
  );

  await assertCouponUsable(
    coupon,
    input.userId,
    eligibleSubtotal,
    input.now ?? new Date(),
  );

  const discountAmount = calculateDiscountAmount({
    type: coupon.type,
    value: coupon.value,
    eligibleSubtotal,
    maxDiscount: coupon.maxDiscount,
  });

  if (discountAmount <= 0) {
    throw couponError(
      "COUPON_NOT_APPLICABLE",
      "This coupon doesn’t reduce this order.",
    );
  }

  const finalTotal = cartSubtotal - discountAmount;
  if (finalTotal < 0) {
    throw couponError("COUPON_INVALID", "Discount cannot exceed the order total.");
  }

  return {
    valid: true,
    couponId: coupon.id,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    discountAmount,
    eligibleSubtotal,
    cartSubtotal,
    finalTotal,
    affectedProductIds: eligible.map((line) => line.productId),
  };
}

export function serializeCoupon(
  coupon: Coupon & {
    products?: Array<{
      productId: string;
      product?: { id: string; title: string; slug: string };
    }>;
    _count?: { redemptions?: number };
  },
  now = new Date(),
) {
  const productIds = (coupon.products ?? []).map((row) => row.productId);
  let status: "active" | "scheduled" | "expired" | "inactive" | "limit_reached" =
    "active";
  if (!coupon.isActive) status = "inactive";
  else if (coupon.expiresAt && coupon.expiresAt.getTime() < now.getTime()) {
    status = "expired";
  } else if (coupon.startsAt && coupon.startsAt.getTime() > now.getTime()) {
    status = "scheduled";
  } else if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    status = "limit_reached";
  }

  return {
    id: coupon.id,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    maxDiscount: coupon.maxDiscount,
    maxDiscountMajor:
      coupon.maxDiscount == null ? null : majorFromMinor(coupon.maxDiscount),
    minOrderAmount: coupon.minOrderAmount,
    minOrderAmountMajor:
      coupon.minOrderAmount == null
        ? null
        : majorFromMinor(coupon.minOrderAmount),
    maxUses: coupon.maxUses,
    usedCount: coupon.usedCount,
    perUserLimit: coupon.perUserLimit,
    startsAt: coupon.startsAt?.toISOString() ?? null,
    expiresAt: coupon.expiresAt?.toISOString() ?? null,
    isActive: coupon.isActive,
    status,
    scope: productIds.length > 0 ? "products" : "creator",
    productIds,
    products: (coupon.products ?? [])
      .map((row) => row.product)
      .filter(Boolean)
      .map((product) => ({
        id: product!.id,
        title: product!.title,
        slug: product!.slug,
      })),
    createdAt: coupon.createdAt.toISOString(),
    updatedAt: coupon.updatedAt.toISOString(),
  };
}

async function requireCreatorProfile(userId: string) {
  const profile = await prisma.creatorProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw forbidden("Create a creator profile first.");
  return profile;
}

async function assertOwnedProducts(creatorId: string, productIds: string[]) {
  if (productIds.length === 0) return;
  const owned = await prisma.product.findMany({
    where: { creatorId, id: { in: productIds } },
    select: { id: true },
  });
  if (owned.length !== productIds.length) {
    throw forbidden("You can only attach your own products to a coupon.");
  }
}

export async function createCreatorCoupon(
  userId: string,
  input: CreateCouponInput,
) {
  const profile = await requireCreatorProfile(userId);
  const productIds = Array.from(new Set(input.productIds ?? []));
  await assertOwnedProducts(profile.id, productIds);

  try {
    const coupon = await prisma.coupon.create({
      data: {
        creatorId: profile.id,
        code: input.code,
        type: input.type,
        value: input.value,
        maxDiscount: input.type === "PERCENTAGE" ? input.maxDiscount ?? null : null,
        minOrderAmount: input.minOrderAmount ?? null,
        maxUses: input.maxUses ?? null,
        perUserLimit: input.perUserLimit ?? null,
        startsAt: input.startsAt ?? null,
        expiresAt: input.expiresAt ?? null,
        isActive: input.isActive ?? true,
        products: productIds.length
          ? {
              create: productIds.map((productId) => ({ productId })),
            }
          : undefined,
      },
      include: {
        products: {
          include: {
            product: { select: { id: true, title: true, slug: true } },
          },
        },
      },
    });
    return serializeCoupon(coupon);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw conflict("That coupon code is already in use.");
    }
    throw error;
  }
}

export async function listCreatorCoupons(
  userId: string,
  query: ListCreatorCouponsQuery,
) {
  const profile = await requireCreatorProfile(userId);
  const pagination = parsePagination(query.page, query.limit);
  const now = new Date();
  const where: Prisma.CouponWhereInput = { creatorId: profile.id };
  if (query.status === "inactive") where.isActive = false;
  if (query.status === "scheduled") {
    where.isActive = true;
    where.startsAt = { gt: now };
  }
  if (query.status === "expired") {
    where.expiresAt = { lt: now };
  }

  const [total, rows] = await Promise.all([
    prisma.coupon.count({ where }),
    prisma.coupon.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...skipTake(pagination),
      include: {
        products: {
          include: {
            product: { select: { id: true, title: true, slug: true } },
          },
        },
      },
    }),
  ]);

  let items = rows.map((row) => serializeCoupon(row, now));
  if (query.status === "active") {
    items = items.filter((item) => item.status === "active");
  }

  return {
    items,
    pagination: paginationMeta(pagination.page, pagination.limit, total),
  };
}

export async function getCreatorCoupon(userId: string, couponId: string) {
  const profile = await requireCreatorProfile(userId);
  const coupon = await prisma.coupon.findFirst({
    where: { id: couponId, creatorId: profile.id },
    include: {
      products: {
        include: {
          product: { select: { id: true, title: true, slug: true } },
        },
      },
    },
  });
  if (!coupon) throw notFound("Coupon not found");
  return serializeCoupon(coupon);
}

export async function updateCreatorCoupon(
  userId: string,
  couponId: string,
  input: UpdateCouponInput,
) {
  const profile = await requireCreatorProfile(userId);
  const existing = await prisma.coupon.findFirst({
    where: { id: couponId, creatorId: profile.id },
  });
  if (!existing) throw notFound("Coupon not found");

  if (input.productIds) {
    await assertOwnedProducts(profile.id, Array.from(new Set(input.productIds)));
  }

  try {
    const coupon = await prisma.$transaction(async (tx) => {
      if (input.productIds) {
        const productIds = Array.from(new Set(input.productIds));
        await tx.couponProduct.deleteMany({ where: { couponId } });
        if (productIds.length > 0) {
          await tx.couponProduct.createMany({
            data: productIds.map((productId) => ({ couponId, productId })),
          });
        }
      }

      const type = input.type ?? existing.type;
      return tx.coupon.update({
        where: { id: couponId },
        data: {
          ...(input.code ? { code: input.code } : {}),
          ...(input.type ? { type: input.type } : {}),
          ...(input.value !== undefined ? { value: input.value } : {}),
          ...(input.maxDiscount !== undefined
            ? {
                maxDiscount:
                  type === "PERCENTAGE" ? input.maxDiscount : null,
              }
            : {}),
          ...(input.minOrderAmount !== undefined
            ? { minOrderAmount: input.minOrderAmount }
            : {}),
          ...(input.maxUses !== undefined ? { maxUses: input.maxUses } : {}),
          ...(input.perUserLimit !== undefined
            ? { perUserLimit: input.perUserLimit }
            : {}),
          ...(input.startsAt !== undefined ? { startsAt: input.startsAt } : {}),
          ...(input.expiresAt !== undefined
            ? { expiresAt: input.expiresAt }
            : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        },
        include: {
          products: {
            include: {
              product: { select: { id: true, title: true, slug: true } },
            },
          },
        },
      });
    });
    return serializeCoupon(coupon);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw conflict("That coupon code is already in use.");
    }
    throw error;
  }
}

export async function deactivateCreatorCoupon(userId: string, couponId: string) {
  return updateCreatorCoupon(userId, couponId, { isActive: false });
}

export async function deleteCreatorCoupon(userId: string, couponId: string) {
  const profile = await requireCreatorProfile(userId);
  const existing = await prisma.coupon.findFirst({
    where: { id: couponId, creatorId: profile.id },
    include: { _count: { select: { redemptions: true } } },
  });
  if (!existing) throw notFound("Coupon not found");
  if (existing._count.redemptions > 0) {
    await prisma.coupon.update({
      where: { id: couponId },
      data: { isActive: false },
    });
    return { ok: true, deactivated: true };
  }
  await prisma.coupon.delete({ where: { id: couponId } });
  return { ok: true, deleted: true };
}

export async function getCreatorCouponUsage(userId: string, couponId: string) {
  const profile = await requireCreatorProfile(userId);
  const coupon = await prisma.coupon.findFirst({
    where: { id: couponId, creatorId: profile.id },
  });
  if (!coupon) throw notFound("Coupon not found");

  const [redemptions, aggregates, first, latest] = await Promise.all([
    prisma.couponRedemption.count({ where: { couponId } }),
    prisma.order.aggregate({
      where: { couponId, status: "PAID" },
      _sum: { discount: true, totalAmount: true, subtotal: true },
      _avg: { totalAmount: true },
      _count: { _all: true },
    }),
    prisma.couponRedemption.findFirst({
      where: { couponId },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
    prisma.couponRedemption.findFirst({
      where: { couponId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  const remaining =
    coupon.maxUses == null ? null : Math.max(0, coupon.maxUses - coupon.usedCount);

  return {
    coupon: serializeCoupon(coupon),
    redemptions,
    remaining,
    discountGivenCents: aggregates._sum.discount ?? 0,
    discountGiven: majorFromMinor(aggregates._sum.discount ?? 0),
    revenueCents: aggregates._sum.totalAmount ?? 0,
    revenue: majorFromMinor(aggregates._sum.totalAmount ?? 0),
    averageOrderValueCents: Math.round(aggregates._avg.totalAmount ?? 0),
    averageOrderValue: majorFromMinor(Math.round(aggregates._avg.totalAmount ?? 0)),
    paidOrders: aggregates._count._all,
    firstRedemptionAt: first?.createdAt.toISOString() ?? null,
    latestRedemptionAt: latest?.createdAt.toISOString() ?? null,
  };
}

/**
 * Atomically record a successful coupon redemption after payment.
 * Safe under webhook replay and concurrent maxUses races.
 */
export async function redeemCouponForPaidOrder(
  tx: Prisma.TransactionClient,
  input: {
    orderId: string;
    userId: string;
    couponId: string | null;
    discountAmount: number;
  },
) {
  if (!input.couponId || input.discountAmount <= 0) return { redeemed: false };

  const existing = await tx.couponRedemption.findUnique({
    where: { orderId: input.orderId },
    select: { id: true },
  });
  if (existing) return { redeemed: false, alreadyRedeemed: true };

  const coupon = await tx.coupon.findUnique({
    where: { id: input.couponId },
  });
  if (!coupon) return { redeemed: false };

  if (coupon.perUserLimit != null) {
    const usedByCustomer = await tx.couponRedemption.count({
      where: { couponId: coupon.id, userId: input.userId },
    });
    if (usedByCustomer >= coupon.perUserLimit) {
      // Order already charged — do not fail fulfillment; skip increment if somehow over.
      return { redeemed: false, skipped: "user_limit" };
    }
  }

  const bumped = await tx.$executeRaw`
    UPDATE "Coupon"
    SET "usedCount" = "usedCount" + 1, "updatedAt" = NOW()
    WHERE "id" = ${coupon.id}
      AND ("maxUses" IS NULL OR "usedCount" < "maxUses")
  `;
  if (Number(bumped) !== 1) {
    return { redeemed: false, skipped: "usage_limit" };
  }

  try {
    await tx.couponRedemption.create({
      data: {
        couponId: coupon.id,
        userId: input.userId,
        orderId: input.orderId,
        discountAmount: input.discountAmount,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { redeemed: false, alreadyRedeemed: true };
    }
    throw error;
  }

  return { redeemed: true };
}

export { isCouponError };
