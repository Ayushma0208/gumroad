import { prisma } from "../../config/database";
import { logEvent } from "../../utils/logger";
import { majorFromMinor } from "../../utils/money";
import { appUrl } from "../email/email.config";
import { queueEmail } from "../email/email.service";
import { createNotification } from "./notification.service";
import { shouldSendEmail } from "./preference.service";

function moneyLabel(amountCents: number, currency: string) {
  try {
    return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency,
    }).format(majorFromMinor(amountCents));
  } catch {
    return `${(amountCents / 100).toFixed(2)} ${currency}`;
  }
}

/**
 * Fire-and-forget side effects after a verified paid order.
 * Never throws into the payment path.
 */
export async function notifyOrderPaid(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: {
              select: {
                title: true,
                slug: true,
                creator: {
                  select: {
                    id: true,
                    storeName: true,
                    userId: true,
                    user: { select: { email: true, name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!order || order.status !== "PAID") return;

    const productTitles = order.items.map((item) => item.productTitle || item.product.title);
    const titleSummary =
      productTitles.length === 1
        ? productTitles[0]
        : `${productTitles[0]} +${productTitles.length - 1} more`;

    await createNotification({
      userId: order.customerId,
      type: "PURCHASE_SUCCESS",
      title: "Purchase completed",
      message: `Your purchase of “${titleSummary}” is ready in your Library.`,
      href: "/library",
      eventKey: `purchase:${order.id}`,
      data: {
        orderId: order.id,
        productIds: order.items.map((item) => item.productId),
      },
    });

    if (await shouldSendEmail(order.customerId, "purchase")) {
      const renderedSubject = "Your Lumen purchase is ready";
      await queueEmail({
        userId: order.customerId,
        toEmail: order.customer.email,
        type: "PURCHASE_SUCCESS",
        template: "PURCHASE_CONFIRMATION",
        subject: renderedSubject,
        eventKey: `purchase:${order.id}`,
        payload: {
          customerName: order.customer.name,
          orderId: order.id,
          totalLabel: moneyLabel(order.totalAmount, order.currency),
          purchasedAt: order.createdAt.toISOString().slice(0, 10),
          products: order.items.map((item) => ({
            title: item.productTitle || item.product.title,
            creatorName: item.product.creator.storeName,
          })),
          libraryUrl: appUrl("/library"),
          orderUrl: appUrl(`/orders/${order.id}`),
        },
      });
    }

    // Creator attribution by OrderItem.creatorId (line-level).
    const byCreator = new Map<
      string,
      {
        userId: string;
        email: string;
        name: string;
        storeName: string;
        amount: number;
        products: string[];
      }
    >();
    for (const item of order.items) {
      const creator = item.product.creator;
      const creatorKey = item.creatorId || creator.id;
      const current = byCreator.get(creatorKey) ?? {
        userId: creator.userId,
        email: creator.user.email,
        name: creator.user.name,
        storeName: creator.storeName,
        amount: 0,
        products: [],
      };
      current.amount += item.price * item.quantity;
      current.products.push(item.productTitle || item.product.title);
      byCreator.set(creatorKey, current);
    }

    for (const [creatorId, sale] of byCreator) {
      const productLabel =
        sale.products.length === 1
          ? sale.products[0]
          : `${sale.products[0]} +${sale.products.length - 1} more`;
      await createNotification({
        userId: sale.userId,
        type: "CREATOR_SALE",
        title: "New sale",
        message: `You sold “${productLabel}” for ${moneyLabel(sale.amount, order.currency)}.`,
        href: "/dashboard/sales",
        eventKey: `creator-sale:${order.id}:${creatorId}`,
        data: {
          orderId: order.id,
          creatorId,
          amountCents: sale.amount,
        },
      });

      if (await shouldSendEmail(sale.userId, "creatorSale")) {
        await queueEmail({
          userId: sale.userId,
          toEmail: sale.email,
          type: "CREATOR_SALE",
          template: "CREATOR_SALE",
          subject: `Sale: ${productLabel}`,
          eventKey: `creator-sale:${order.id}:${creatorId}`,
          payload: {
            creatorName: sale.name,
            productTitle: productLabel,
            amountLabel: moneyLabel(sale.amount, order.currency),
            orderId: order.id,
            soldAt: order.createdAt.toISOString().slice(0, 10),
            dashboardUrl: appUrl("/dashboard/sales"),
          },
        });
      }
    }
  } catch (error) {
    logEvent("notify_order_paid_failed", {
      orderId,
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}

export async function notifyReviewCreated(reviewId: string) {
  try {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            creator: {
              select: {
                userId: true,
                storeName: true,
                user: { select: { email: true, name: true } },
              },
            },
          },
        },
      },
    });
    if (!review) return;
    const creator = review.product.creator;
    const preview =
      review.comment.length > 140
        ? `${review.comment.slice(0, 137)}...`
        : review.comment;

    await createNotification({
      userId: creator.userId,
      type: "REVIEW_RECEIVED",
      title: "New review",
      message: `Someone left a ${review.rating}-star review on “${review.product.title}”.`,
      href: "/dashboard/reviews",
      eventKey: `review:${review.id}`,
      data: {
        reviewId: review.id,
        productId: review.productId,
        rating: review.rating,
      },
    });

    if (await shouldSendEmail(creator.userId, "review")) {
      await queueEmail({
        userId: creator.userId,
        toEmail: creator.user.email,
        type: "REVIEW_RECEIVED",
        template: "REVIEW_RECEIVED",
        subject: `New review on ${review.product.title}`,
        eventKey: `review:${review.id}`,
        payload: {
          creatorName: creator.user.name,
          productTitle: review.product.title,
          rating: review.rating,
          reviewTitle: review.title,
          preview,
          reviewsUrl: appUrl("/dashboard/reviews"),
        },
      });
    }
  } catch (error) {
    logEvent("notify_review_failed", {
      reviewId,
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}

export async function notifyProductStatusChange(input: {
  productId: string;
  fromStatus: string;
  toStatus: string;
}) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: input.productId },
      include: {
        creator: {
          select: {
            userId: true,
            user: { select: { email: true, name: true } },
          },
        },
      },
    });
    if (!product) return;

    let type: "PRODUCT_APPROVED" | "PRODUCT_UNPUBLISHED" | "PRODUCT_ARCHIVED" | null =
      null;
    let title = "";
    let message = "";
    let statusLabel = "";

    if (input.toStatus === "PUBLISHED") {
      type = "PRODUCT_APPROVED";
      title = "Product approved";
      message = `“${product.title}” is now live on Discover.`;
      statusLabel = "Product approved";
    } else if (input.toStatus === "ARCHIVED") {
      type = "PRODUCT_ARCHIVED";
      title = "Product archived";
      message = `“${product.title}” was archived by an operator.`;
      statusLabel = "Product archived";
    } else if (input.toStatus === "DRAFT" && input.fromStatus === "PUBLISHED") {
      type = "PRODUCT_UNPUBLISHED";
      title = "Product unpublished";
      message = `“${product.title}” was unpublished and is no longer publicly listed.`;
      statusLabel = "Product unpublished";
    } else {
      return;
    }

    await createNotification({
      userId: product.creator.userId,
      type,
      title,
      message,
      href: `/dashboard/products/${product.id}/edit`,
      eventKey: `product-status:${product.id}:${input.toStatus}`,
      data: {
        productId: product.id,
        status: input.toStatus,
      },
    });

    if (await shouldSendEmail(product.creator.userId, "productModeration")) {
      await queueEmail({
        userId: product.creator.userId,
        toEmail: product.creator.user.email,
        type,
        template: "PRODUCT_STATUS",
        subject: `${statusLabel}: ${product.title}`,
        eventKey: `product-status:${product.id}:${input.toStatus}`,
        payload: {
          creatorName: product.creator.user.name,
          productTitle: product.title,
          statusLabel,
          message,
          productUrl: appUrl(`/dashboard/products/${product.id}/edit`),
        },
      });
    }
  } catch (error) {
    logEvent("notify_product_status_failed", {
      productId: input.productId,
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}
