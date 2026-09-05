import { prisma } from "../../config/database";
import { env } from "../../config/env";
import { signedDeliveryUrl } from "../../config/cloudinary";
import { badRequest, notFound } from "../../utils/app-error";
import { logEvent } from "../../utils/logger";
import {
  paginationMeta,
  parsePagination,
  skipTake,
} from "../../utils/pagination";
import { assertPurchasedProduct, getCustomerProductAccess } from "../access/access.service";

function publicFile(file: {
  id: string;
  fileName: string;
  fileSize: number;
  format: string;
  mimeType: string;
}) {
  return {
    id: file.id,
    fileName: file.fileName,
    fileSize: file.fileSize,
    format: file.format,
    mimeType: file.mimeType,
  };
}

export async function listLibrary(userId: string, page?: number, limit?: number) {
  const pagination = parsePagination(page, limit);
  const where = { userId, order: { status: "PAID" as const } };
  const [total, purchases] = await Promise.all([
    prisma.purchase.count({ where }),
    prisma.purchase.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...skipTake(pagination),
      include: {
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverImage: true,
            productType: true,
            updatedAt: true,
            creator: { select: { storeName: true, slug: true } },
            files: {
              select: {
                id: true,
                fileName: true,
                fileSize: true,
                format: true,
                mimeType: true,
              },
            },
          },
        },
        order: { select: { id: true } },
      },
    }),
  ]);

  return {
    items: purchases.map((purchase) => ({
      product: {
        id: purchase.product.id,
        title: purchase.product.title,
        slug: purchase.product.slug,
        coverImage: purchase.product.coverImage,
        productType: purchase.product.productType,
        creator: purchase.product.creator,
      },
      purchasedAt: purchase.createdAt.toISOString(),
      updatedAt: purchase.product.updatedAt.toISOString(),
      orderId: purchase.orderId,
      files: purchase.product.files.map(publicFile),
    })),
    pagination: paginationMeta(pagination.page, pagination.limit, total),
  };
}

export async function getLibraryProduct(userId: string, productId: string) {
  const access = await getCustomerProductAccess(userId, productId);
  if (!access) throw notFound("This product is not in your library.");
  const files = await prisma.productFile.findMany({
    where: { productId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      fileName: true,
      fileSize: true,
      format: true,
      mimeType: true,
    },
  });
  return {
    product: access.product,
    purchasedAt: access.createdAt.toISOString(),
    orderId: access.orderId,
    files: files.map(publicFile),
  };
}

export async function getLibraryFiles(userId: string, productId: string) {
  const item = await getLibraryProduct(userId, productId);
  return { files: item.files };
}

export async function requestLibraryDownload(
  userId: string,
  productId: string,
  fileId: string | undefined,
) {
  if (!fileId) throw badRequest("Choose a file to download.");
  const access = await assertPurchasedProduct(userId, productId);
  if (access.product.status === "ARCHIVED") {
    // Buyers keep access after archive.
  }
  const file = await prisma.productFile.findFirst({
    where: { id: fileId, productId },
  });
  if (!file) throw notFound("That file is no longer available.");

  const delivery = signedDeliveryUrl({
    publicId: file.publicId,
    resourceType: file.resourceType,
    format: file.format,
    fileName: file.fileName,
    expiresInSeconds: env.CLOUDINARY_DOWNLOAD_TTL_SECONDS,
  });

  await prisma.download.create({
    data: {
      userId,
      productId,
      productFileId: file.id,
      orderId: access.orderId,
    },
  });
  logEvent("library_download_issued", {
    productId,
    fileId: file.id,
    expiresAt: delivery.expiresAt,
  });

  return {
    url: delivery.url,
    expiresAt: delivery.expiresAt,
    fileName: file.fileName,
  };
}
