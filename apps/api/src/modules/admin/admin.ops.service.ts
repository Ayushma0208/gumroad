import { Prisma, type ProductStatus, type UserStatus } from "@prisma/client";
import { prisma } from "../../config/database";
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
} from "../../utils/app-error";
import {
  paginationMeta,
  parsePagination,
  skipTake,
} from "../../utils/pagination";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "../categories/category.service";
import {
  deleteReview,
  listAdminReviews,
  moderateReview,
} from "../reviews/review.service";
import type {
  AdminAuditQuery,
  AdminCouponsQuery,
  AdminCreatorsQuery,
  AdminOrdersQuery,
  AdminProductsQuery,
  AdminUsersQuery,
} from "./admin.schema";
import { writeAuditLog } from "./admin.audit";
import { notifyProductStatusChange } from "../notifications/notification.events";

function safeUserSelect() {
  return {
    id: true,
    name: true,
    email: true,
    role: true,
    status: true,
    avatarUrl: true,
    createdAt: true,
    updatedAt: true,
  } as const;
}

export async function listAdminUsers(query: AdminUsersQuery) {
  const pagination = parsePagination(query.page, query.limit);
  const q = query.q?.trim();
  const where: Prisma.UserWhereInput = {
    ...(query.role && query.role !== "all" ? { role: query.role } : {}),
    ...(query.status && query.status !== "all" ? { status: query.status } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const orderBy: Prisma.UserOrderByWithRelationInput =
    query.sort === "oldest"
      ? { createdAt: "asc" }
      : query.sort === "name"
        ? { name: "asc" }
        : { createdAt: "desc" };

  const [total, users] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        ...safeUserSelect(),
        creatorProfile: { select: { id: true, storeName: true, slug: true } },
        _count: { select: { orders: true, purchases: true } },
      },
      orderBy,
      ...skipTake(pagination),
    }),
  ]);

  return {
    items: users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
      orderCount: user._count.orders,
      purchaseCount: user._count.purchases,
      creatorProfile: user.creatorProfile,
    })),
    meta: paginationMeta(pagination.page, pagination.limit, total),
  };
}

export async function getAdminUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...safeUserSelect(),
      creatorProfile: {
        select: {
          id: true,
          displayName: true,
          storeName: true,
          slug: true,
          bio: true,
          avatar: true,
          createdAt: true,
        },
      },
      _count: {
        select: { orders: true, purchases: true, reviews: true },
      },
    },
  });
  if (!user) throw notFound("User not found.");
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    orderCount: user._count.orders,
    purchaseCount: user._count.purchases,
    reviewCount: user._count.reviews,
    creatorProfile: user.creatorProfile
      ? {
          ...user.creatorProfile,
          createdAt: user.creatorProfile.createdAt.toISOString(),
        }
      : null,
  };
}

export async function setAdminUserStatus(
  adminId: string,
  userId: string,
  status: UserStatus,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { creatorProfile: { select: { id: true } } },
  });
  if (!user) throw notFound("User not found.");
  if (user.id === adminId) {
    throw badRequest("You cannot change your own account status.");
  }
  if (user.role === "ADMIN" && status === "SUSPENDED") {
    throw forbidden("Admin accounts cannot be suspended from this panel.");
  }
  if (user.status === status) {
    return getAdminUser(userId);
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        status,
        ...(status === "SUSPENDED"
          ? { sessionVersion: { increment: 1 } }
          : {}),
      },
    });
    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: status === "SUSPENDED" ? "USER_SUSPENDED" : "USER_RESTORED",
        targetType: "USER",
        targetId: userId,
        metadata: { email: user.email, previousStatus: user.status },
      },
    });
    if (user.role === "CREATOR" || user.creatorProfile) {
      await tx.adminAuditLog.create({
        data: {
          adminId,
          action:
            status === "SUSPENDED" ? "CREATOR_SUSPENDED" : "CREATOR_RESTORED",
          targetType: "USER",
          targetId: userId,
          metadata: { email: user.email },
        },
      });
    }
  });

  return getAdminUser(userId);
}

export async function listAdminCreators(query: AdminCreatorsQuery) {
  const pagination = parsePagination(query.page, query.limit);
  const q = query.q?.trim();
  const where: Prisma.CreatorProfileWhereInput = {
    ...(query.status && query.status !== "all"
      ? { user: { status: query.status } }
      : {}),
    ...(q
      ? {
          OR: [
            { storeName: { contains: q, mode: "insensitive" } },
            { displayName: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
            { user: { email: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [total, creators] = await prisma.$transaction([
    prisma.creatorProfile.count({ where }),
    prisma.creatorProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            products: true,
            coupons: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      ...skipTake(pagination),
    }),
  ]);

  const creatorIds = creators.map((c) => c.id);
  const sales = creatorIds.length
    ? await prisma.$queryRaw<
        Array<{
          creator_id: string;
          revenue: bigint | number;
          orders: bigint | number;
          units: bigint | number;
        }>
      >`
        SELECT
          oi."creatorId" AS creator_id,
          COALESCE(SUM(oi.price * oi.quantity), 0)::bigint AS revenue,
          COUNT(DISTINCT oi."orderId")::bigint AS orders,
          COALESCE(SUM(oi.quantity), 0)::bigint AS units
        FROM "OrderItem" oi
        INNER JOIN "Order" o ON o.id = oi."orderId"
        WHERE oi."creatorId" IN (${Prisma.join(creatorIds)})
          AND o.status = 'PAID'::"OrderStatus"
        GROUP BY oi."creatorId"
      `
    : [];
  const salesMap = new Map(
    sales.map((row) => [
      row.creator_id,
      {
        revenueCents: Number(row.revenue),
        orders: Number(row.orders),
        units: Number(row.units),
      },
    ]),
  );

  const publishedCounts = creatorIds.length
    ? await prisma.product.groupBy({
        by: ["creatorId"],
        where: { creatorId: { in: creatorIds }, status: "PUBLISHED" },
        _count: { _all: true },
      })
    : [];
  const publishedMap = new Map(
    publishedCounts.map((row) => [row.creatorId, row._count._all]),
  );

  let items = creators.map((creator) => {
    const stats = salesMap.get(creator.id) ?? {
      revenueCents: 0,
      orders: 0,
      units: 0,
    };
    return {
      id: creator.id,
      displayName: creator.displayName,
      storeName: creator.storeName,
      slug: creator.slug,
      avatar: creator.avatar,
      email: creator.user.email,
      userId: creator.user.id,
      status: creator.user.status,
      productCount: creator._count.products,
      publishedProductCount: publishedMap.get(creator.id) ?? 0,
      couponCount: creator._count.coupons,
      revenueCents: stats.revenueCents,
      salesCount: stats.units,
      orderCount: stats.orders,
      joinedAt: creator.createdAt.toISOString(),
    };
  });

  if (query.sort === "revenue") {
    items = items.sort((a, b) => b.revenueCents - a.revenueCents);
  } else if (query.sort === "products") {
    items = items.sort((a, b) => b.productCount - a.productCount);
  } else if (query.sort === "name") {
    items = items.sort((a, b) => a.storeName.localeCompare(b.storeName));
  }

  return {
    items,
    meta: paginationMeta(pagination.page, pagination.limit, total),
  };
}

export async function getAdminCreator(creatorId: string) {
  const creator = await prisma.creatorProfile.findUnique({
    where: { id: creatorId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          createdAt: true,
        },
      },
      _count: {
        select: { products: true, coupons: true, reviewReplies: true },
      },
    },
  });
  if (!creator) throw notFound("Creator not found.");

  const [sales, published, customers, reviews] = await Promise.all([
    prisma.$queryRaw<
      Array<{ revenue: bigint | number; orders: bigint | number; units: bigint | number }>
    >`
      SELECT
        COALESCE(SUM(oi.price * oi.quantity), 0)::bigint AS revenue,
        COUNT(DISTINCT oi."orderId")::bigint AS orders,
        COALESCE(SUM(oi.quantity), 0)::bigint AS units
      FROM "OrderItem" oi
      INNER JOIN "Order" o ON o.id = oi."orderId"
      WHERE oi."creatorId" = ${creatorId}
        AND o.status = 'PAID'::"OrderStatus"
    `,
    prisma.product.count({
      where: { creatorId, status: "PUBLISHED" },
    }),
    prisma.$queryRaw<Array<{ count: bigint | number }>>`
      SELECT COUNT(DISTINCT o."customerId")::bigint AS count
      FROM "OrderItem" oi
      INNER JOIN "Order" o ON o.id = oi."orderId"
      WHERE oi."creatorId" = ${creatorId}
        AND o.status = 'PAID'::"OrderStatus"
    `,
    prisma.review.count({
      where: { product: { creatorId }, status: "PUBLISHED" },
    }),
  ]);

  const sale = sales[0];
  return {
    id: creator.id,
    displayName: creator.displayName,
    storeName: creator.storeName,
    slug: creator.slug,
    bio: creator.bio,
    description: creator.description,
    avatar: creator.avatar,
    banner: creator.banner,
    website: creator.website,
    instagram: creator.instagram,
    twitter: creator.twitter,
    linkedin: creator.linkedin,
    youtube: creator.youtube,
    github: creator.github,
    status: creator.user.status,
    user: creator.user,
    productCount: creator._count.products,
    publishedProductCount: published,
    couponCount: creator._count.coupons,
    reviewCount: reviews,
    revenueCents: Number(sale?.revenue ?? 0),
    orderCount: Number(sale?.orders ?? 0),
    unitsSold: Number(sale?.units ?? 0),
    customerCount: Number(customers[0]?.count ?? 0),
    joinedAt: creator.createdAt.toISOString(),
  };
}

export async function listAdminProducts(query: AdminProductsQuery) {
  const pagination = parsePagination(query.page, query.limit);
  const q = query.q?.trim();
  const where: Prisma.ProductWhereInput = {
    ...(query.status && query.status !== "all" ? { status: query.status } : {}),
    ...(query.productType && query.productType !== "all"
      ? { productType: query.productType }
      : {}),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.creatorId ? { creatorId: query.creatorId } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
            {
              creator: {
                storeName: { contains: q, mode: "insensitive" },
              },
            },
          ],
        }
      : {}),
  };
  const orderBy: Prisma.ProductOrderByWithRelationInput =
    query.sort === "oldest"
      ? { createdAt: "asc" }
      : query.sort === "price"
        ? { price: "desc" }
        : query.sort === "title"
          ? { title: "asc" }
          : { createdAt: "desc" };

  const [total, products] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: {
        creator: { select: { id: true, storeName: true, slug: true } },
        category: { select: { id: true, label: true, slug: true } },
        _count: { select: { orderItems: true, reviews: true } },
      },
      orderBy,
      ...skipTake(pagination),
    }),
  ]);

  return {
    items: products.map((product) => ({
      id: product.id,
      title: product.title,
      slug: product.slug,
      priceCents: product.price,
      currency: product.currency,
      productType: product.productType,
      status: product.status,
      coverImage: product.coverImage,
      featured: product.featured,
      creator: product.creator,
      category: product.category,
      salesCount: product._count.orderItems,
      reviewCount: product._count.reviews,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    })),
    meta: paginationMeta(pagination.page, pagination.limit, total),
  };
}

export async function getAdminProduct(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      creator: {
        select: {
          id: true,
          storeName: true,
          slug: true,
          user: { select: { id: true, email: true, status: true } },
        },
      },
      category: { select: { id: true, label: true, slug: true } },
      images: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, url: true, sortOrder: true },
      },
      files: {
        select: {
          id: true,
          fileName: true,
          mimeType: true,
          fileSize: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          reviews: true,
          wishlistItems: true,
          orderItems: true,
        },
      },
    },
  });
  if (!product) throw notFound("Product not found.");

  const revenue = await prisma.$queryRaw<
    Array<{ revenue: bigint | number; units: bigint | number; orders: bigint | number }>
  >`
    SELECT
      COALESCE(SUM(oi.price * oi.quantity), 0)::bigint AS revenue,
      COALESCE(SUM(oi.quantity), 0)::bigint AS units,
      COUNT(DISTINCT oi."orderId")::bigint AS orders
    FROM "OrderItem" oi
    INNER JOIN "Order" o ON o.id = oi."orderId"
    WHERE oi."productId" = ${productId}
      AND o.status = 'PAID'::"OrderStatus"
  `;

  const reviewAgg = await prisma.review.aggregate({
    where: { productId, status: "PUBLISHED" },
    _avg: { rating: true },
    _count: { _all: true },
  });

  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    shortDescription: product.shortDescription,
    description: product.description,
    priceCents: product.price,
    currency: product.currency,
    productType: product.productType,
    status: product.status,
    coverImage: product.coverImage,
    featured: product.featured,
    trending: product.trending,
    editorsPick: product.editorsPick,
    creator: product.creator,
    category: product.category,
    images: product.images,
    files: product.files.map((file) => ({
      id: file.id,
      fileName: file.fileName,
      mimeType: file.mimeType,
      fileSize: file.fileSize,
      createdAt: file.createdAt.toISOString(),
    })),
    wishlistCount: product._count.wishlistItems,
    reviewCount: reviewAgg._count._all,
    averageRating: reviewAgg._avg.rating
      ? Math.round(reviewAgg._avg.rating * 10) / 10
      : null,
    revenueCents: Number(revenue[0]?.revenue ?? 0),
    unitsSold: Number(revenue[0]?.units ?? 0),
    orderCount: Number(revenue[0]?.orders ?? 0),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export async function setAdminProductStatus(
  adminId: string,
  productId: string,
  status: ProductStatus,
) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, title: true, status: true, slug: true },
  });
  if (!product) throw notFound("Product not found.");
  if (product.status === status) {
    return getAdminProduct(productId);
  }

  const action =
    status === "PUBLISHED"
      ? ("PRODUCT_PUBLISHED" as const)
      : status === "ARCHIVED"
        ? ("PRODUCT_ARCHIVED" as const)
        : product.status === "ARCHIVED"
          ? ("PRODUCT_RESTORED" as const)
          : ("PRODUCT_UNPUBLISHED" as const);

  await prisma.$transaction(async (tx) => {
    await tx.product.update({ where: { id: productId }, data: { status } });
    await tx.adminAuditLog.create({
      data: {
        adminId,
        action,
        targetType: "PRODUCT",
        targetId: productId,
        metadata: {
          title: product.title,
          slug: product.slug,
          from: product.status,
          to: status,
        },
      },
    });
  });

  void notifyProductStatusChange({
    productId,
    fromStatus: product.status,
    toStatus: status,
  });

  return getAdminProduct(productId);
}

export async function listAdminOrders(query: AdminOrdersQuery) {
  const pagination = parsePagination(query.page, query.limit);
  const q = query.q?.trim();
  const where: Prisma.OrderWhereInput = {
    ...(query.status && query.status !== "all" ? { status: query.status } : {}),
    ...(q
      ? {
          OR: [
            { id: { contains: q, mode: "insensitive" } },
            { couponCode: { contains: q, mode: "insensitive" } },
            { customer: { email: { contains: q, mode: "insensitive" } } },
            { customer: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
  const orderBy: Prisma.OrderOrderByWithRelationInput =
    query.sort === "oldest"
      ? { createdAt: "asc" }
      : query.sort === "amount"
        ? { totalAmount: "desc" }
        : { createdAt: "desc" };

  const [total, orders] = await prisma.$transaction([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        payment: {
          select: {
            id: true,
            provider: true,
            status: true,
            amount: true,
            currency: true,
            providerPaymentId: true,
            createdAt: true,
          },
        },
        _count: { select: { items: true } },
      },
      orderBy,
      ...skipTake(pagination),
    }),
  ]);

  return {
    items: orders.map((order) => ({
      id: order.id,
      customer: order.customer,
      itemCount: order._count.items,
      subtotal: order.subtotal,
      discount: order.discount,
      totalAmount: order.totalAmount,
      currency: order.currency,
      status: order.status,
      couponCode: order.couponCode,
      paymentStatus: order.payment?.status ?? null,
      createdAt: order.createdAt.toISOString(),
    })),
    meta: paginationMeta(pagination.page, pagination.limit, total),
  };
}

export async function getAdminOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: {
        select: { id: true, name: true, email: true, status: true },
      },
      payment: {
        select: {
          id: true,
          provider: true,
          status: true,
          amount: true,
          currency: true,
          providerPaymentId: true,
          providerOrderId: true,
          createdAt: true,
        },
      },
      items: {
        select: {
          id: true,
          productId: true,
          creatorId: true,
          productTitle: true,
          price: true,
          quantity: true,
          product: {
            select: {
              slug: true,
              coverImage: true,
              creator: { select: { id: true, storeName: true, slug: true } },
            },
          },
        },
      },
    },
  });
  if (!order) throw notFound("Order not found.");

  return {
    id: order.id,
    customer: order.customer,
    subtotal: order.subtotal,
    discount: order.discount,
    totalAmount: order.totalAmount,
    currency: order.currency,
    status: order.status,
    couponCode: order.couponCode,
    couponId: order.couponId,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    payment: order.payment
      ? {
          id: order.payment.id,
          provider: order.payment.provider,
          status: order.payment.status,
          amount: order.payment.amount,
          currency: order.payment.currency,
          providerPaymentId: order.payment.providerPaymentId,
          providerOrderId: order.payment.providerOrderId,
          createdAt: order.payment.createdAt.toISOString(),
        }
      : null,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productTitle: item.productTitle,
      productSlug: item.product.slug,
      coverImage: item.product.coverImage,
      creator: item.product.creator,
      priceCents: item.price,
      quantity: item.quantity,
    })),
    refundsAvailable: false,
  };
}

export async function listAdminCoupons(query: AdminCouponsQuery) {
  const pagination = parsePagination(query.page, query.limit);
  const q = query.q?.trim();
  const now = new Date();
  const where: Prisma.CouponWhereInput = {
    ...(q
      ? {
          OR: [
            { code: { contains: q, mode: "insensitive" } },
            {
              creator: {
                storeName: { contains: q, mode: "insensitive" },
              },
            },
          ],
        }
      : {}),
    ...(query.status === "active"
      ? {
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        }
      : query.status === "inactive"
        ? { isActive: false }
        : query.status === "expired"
          ? { expiresAt: { lte: now } }
          : {}),
  };

  const [total, coupons] = await prisma.$transaction([
    prisma.coupon.count({ where }),
    prisma.coupon.findMany({
      where,
      include: {
        creator: { select: { id: true, storeName: true, slug: true } },
        _count: { select: { redemptions: true } },
      },
      orderBy: { createdAt: "desc" },
      ...skipTake(pagination),
    }),
  ]);

  return {
    items: coupons.map((coupon) => ({
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      isActive: coupon.isActive,
      usedCount: coupon.usedCount,
      maxUses: coupon.maxUses,
      expiresAt: coupon.expiresAt?.toISOString() ?? null,
      redemptionCount: coupon._count.redemptions,
      creator: coupon.creator,
      createdAt: coupon.createdAt.toISOString(),
    })),
    meta: paginationMeta(pagination.page, pagination.limit, total),
  };
}

export async function listAdminAuditLogs(query: AdminAuditQuery) {
  const pagination = parsePagination(query.page, query.limit);
  const q = query.q?.trim();
  const where: Prisma.AdminAuditLogWhereInput = {
    ...(query.action && query.action !== "all" ? { action: query.action } : {}),
    ...(query.targetType ? { targetType: query.targetType } : {}),
    ...(query.adminId ? { adminId: query.adminId } : {}),
    ...(q
      ? {
          OR: [
            { targetId: { contains: q, mode: "insensitive" } },
            { admin: { email: { contains: q, mode: "insensitive" } } },
            { admin: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [total, items] = await prisma.$transaction([
    prisma.adminAuditLog.count({ where }),
    prisma.adminAuditLog.findMany({
      where,
      include: {
        admin: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      ...skipTake(pagination),
    }),
  ]);

  return {
    items: items.map((item) => ({
      id: item.id,
      action: item.action,
      targetType: item.targetType,
      targetId: item.targetId,
      metadata: item.metadata,
      createdAt: item.createdAt.toISOString(),
      admin: item.admin,
    })),
    meta: paginationMeta(pagination.page, pagination.limit, total),
  };
}

export async function adminModerateReview(
  adminId: string,
  reviewId: string,
  status: "PUBLISHED" | "HIDDEN",
) {
  const review = await moderateReview(reviewId, status);
  await writeAuditLog({
    adminId,
    action: status === "HIDDEN" ? "REVIEW_HIDDEN" : "REVIEW_RESTORED",
    targetType: "REVIEW",
    targetId: reviewId,
    metadata: { status },
  });
  return review;
}

export async function adminDeleteReview(adminId: string, reviewId: string) {
  await deleteReview(adminId, "ADMIN", reviewId);
  await writeAuditLog({
    adminId,
    action: "REVIEW_DELETED",
    targetType: "REVIEW",
    targetId: reviewId,
  });
  return { ok: true };
}

export { listAdminReviews };

export async function listAdminCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return categories.map((category) => ({
    id: category.id,
    name: category.label,
    label: category.label,
    slug: category.slug,
    description: category.description,
    imageUrl: category.imageUrl,
    icon: category.icon,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    productCount: category._count.products,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  }));
}

export async function adminCreateCategory(
  adminId: string,
  input: Parameters<typeof createCategory>[0] & { isActive?: boolean },
) {
  const category = await createCategory(input);
  if (input.isActive === false) {
    await prisma.category.update({
      where: { id: category.id },
      data: { isActive: false },
    });
  }
  await writeAuditLog({
    adminId,
    action: "CATEGORY_CREATED",
    targetType: "CATEGORY",
    targetId: category.id,
    metadata: { slug: category.slug, label: category.label },
  });
  return { ...category, isActive: input.isActive !== false };
}

export async function adminUpdateCategory(
  adminId: string,
  id: string,
  input: Parameters<typeof updateCategory>[1] & { isActive?: boolean },
) {
  const category = await updateCategory(id, input);
  if (input.isActive !== undefined) {
    await prisma.category.update({
      where: { id },
      data: { isActive: input.isActive },
    });
  }
  await writeAuditLog({
    adminId,
    action: "CATEGORY_UPDATED",
    targetType: "CATEGORY",
    targetId: id,
    metadata: { slug: category.slug },
  });
  const updated = await prisma.category.findUniqueOrThrow({ where: { id } });
  return { ...category, isActive: updated.isActive };
}

export async function adminDeleteCategory(adminId: string, id: string) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw notFound("Category not found");
  await deleteCategory(id);
  await writeAuditLog({
    adminId,
    action: "CATEGORY_DELETED",
    targetType: "CATEGORY",
    targetId: id,
    metadata: { slug: existing.slug, label: existing.label },
  });
  return { ok: true };
}

export { listCategories };
