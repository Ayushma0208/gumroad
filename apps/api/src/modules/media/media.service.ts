import type { Role } from "@prisma/client";
import { prisma } from "../../config/database";
import {
  cloudinaryFolders,
  destroyCloudinaryAsset,
  uploadPrivateFile,
  uploadPublicImage,
} from "../../config/cloudinary";
import { env } from "../../config/env";
import { badRequest, notFound } from "../../utils/app-error";
import { logEvent } from "../../utils/logger";
import { assertProductOwnership } from "../access/access.service";
import {
  assertAllowedImage,
  assertAllowedProductFile,
  MAX_PRODUCT_IMAGES,
} from "./file-types";

async function loadManagedProduct(userId: string, role: Role, productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { files: true, images: { orderBy: { sortOrder: "asc" } } },
  });
  if (!product) throw notFound("Product not found");
  await assertProductOwnership(userId, role, product);
  return product;
}

export function serializeManagedFile(file: {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  format: string;
  createdAt: Date;
}) {
  return {
    id: file.id,
    fileName: file.fileName,
    fileSize: file.fileSize,
    mimeType: file.mimeType,
    format: file.format,
    createdAt: file.createdAt.toISOString(),
  };
}

export function serializeManagedImage(image: {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
  format: string | null;
  sortOrder: number;
}) {
  return {
    id: image.id,
    url: image.url,
    width: image.width,
    height: image.height,
    format: image.format,
    sortOrder: image.sortOrder,
  };
}

export async function listProductFiles(userId: string, role: Role, productId: string) {
  const product = await loadManagedProduct(userId, role, productId);
  return product.files.map(serializeManagedFile);
}

export async function uploadProductFile(
  userId: string,
  role: Role,
  productId: string,
  file: Express.Multer.File | undefined,
) {
  if (!file) throw badRequest("Choose a file to upload.");
  assertAllowedProductFile(file.originalname, file.mimetype);
  const product = await loadManagedProduct(userId, role, productId);

  const uploaded = await uploadPrivateFile({
    buffer: file.buffer,
    folder: cloudinaryFolders.productFiles(product.id),
    fileName: file.originalname,
    mimeType: file.mimetype,
  });

  try {
    const record = await prisma.productFile.create({
      data: {
        productId: product.id,
        fileName: file.originalname,
        publicId: uploaded.publicId,
        resourceType: uploaded.resourceType,
        format: uploaded.format,
        fileSize: uploaded.bytes || file.size,
        mimeType: file.mimetype,
        version: uploaded.version,
        isPrivate: true,
      },
    });
    logEvent("product_file_uploaded", { productId: product.id, fileId: record.id });
    return serializeManagedFile(record);
  } catch (error) {
    await destroyCloudinaryAsset({
      publicId: uploaded.publicId,
      resourceType: uploaded.resourceType,
      type: "authenticated",
    }).catch((destroyError) => {
      logEvent("cloudinary_cleanup_failed", {
        publicId: uploaded.publicId,
        reason: destroyError instanceof Error ? destroyError.message : "unknown",
      });
    });
    throw error;
  }
}

export async function deleteProductFile(
  userId: string,
  role: Role,
  productId: string,
  fileId: string,
) {
  const product = await loadManagedProduct(userId, role, productId);
  const file = product.files.find((item) => item.id === fileId);
  if (!file) throw notFound("File not found");

  await destroyCloudinaryAsset({
    publicId: file.publicId,
    resourceType: file.resourceType,
    type: file.isPrivate ? "authenticated" : "upload",
  });
  await prisma.productFile.delete({ where: { id: file.id } });
  logEvent("product_file_deleted", { productId, fileId });
  return { ok: true };
}

export async function listProductImages(userId: string, role: Role, productId: string) {
  const product = await loadManagedProduct(userId, role, productId);
  return product.images.map(serializeManagedImage);
}

export async function uploadProductImage(
  userId: string,
  role: Role,
  productId: string,
  file: Express.Multer.File | undefined,
) {
  if (!file) throw badRequest("Choose an image to upload.");
  assertAllowedImage(file.originalname, file.mimetype);
  const product = await loadManagedProduct(userId, role, productId);
  if (product.images.length >= MAX_PRODUCT_IMAGES) {
    throw badRequest(`You can add up to ${MAX_PRODUCT_IMAGES} images.`);
  }
  if (file.size > env.MAX_PRODUCT_IMAGE_SIZE_MB * 1024 * 1024) {
    throw badRequest("That image is larger than the allowed size.");
  }

  const uploaded = await uploadPublicImage({
    buffer: file.buffer,
    folder: cloudinaryFolders.productImages(product.id),
    fileName: file.originalname,
  });

  try {
    const nextOrder = product.images.reduce((max, image) => Math.max(max, image.sortOrder), -1) + 1;
    const record = await prisma.productImage.create({
      data: {
        productId: product.id,
        publicId: uploaded.publicId,
        url: uploaded.secureUrl,
        width: uploaded.width,
        height: uploaded.height,
        format: uploaded.format,
        sortOrder: nextOrder,
      },
    });
    if (!product.coverImage || nextOrder === 0) {
      await prisma.product.update({
        where: { id: product.id },
        data: { coverImage: uploaded.secureUrl },
      });
    }
    logEvent("product_image_uploaded", { productId: product.id, imageId: record.id });
    return serializeManagedImage(record);
  } catch (error) {
    await destroyCloudinaryAsset({
      publicId: uploaded.publicId,
      resourceType: "image",
      type: "upload",
    }).catch((destroyError) => {
      logEvent("cloudinary_cleanup_failed", {
        publicId: uploaded.publicId,
        reason: destroyError instanceof Error ? destroyError.message : "unknown",
      });
    });
    throw error;
  }
}

export async function deleteProductImage(
  userId: string,
  role: Role,
  productId: string,
  imageId: string,
) {
  const product = await loadManagedProduct(userId, role, productId);
  const image = product.images.find((item) => item.id === imageId);
  if (!image) throw notFound("Image not found");

  await destroyCloudinaryAsset({
    publicId: image.publicId,
    resourceType: "image",
    type: "upload",
  });
  await prisma.productImage.delete({ where: { id: image.id } });
  if (product.coverImage === image.url) {
    const next = product.images.find((item) => item.id !== image.id);
    await prisma.product.update({
      where: { id: product.id },
      data: { coverImage: next?.url ?? "" },
    });
  }
  logEvent("product_image_deleted", { productId, imageId });
  return { ok: true };
}

export async function reorderProductImages(
  userId: string,
  role: Role,
  productId: string,
  imageIds: string[],
) {
  const product = await loadManagedProduct(userId, role, productId);
  const currentIds = new Set(product.images.map((image) => image.id));
  if (imageIds.length !== currentIds.size || imageIds.some((id) => !currentIds.has(id))) {
    throw badRequest("Image order must include every gallery image once.");
  }
  await prisma.$transaction(
    imageIds.map((id, sortOrder) =>
      prisma.productImage.update({ where: { id }, data: { sortOrder } }),
    ),
  );
  const primary = product.images.find((image) => image.id === imageIds[0]);
  if (primary) {
    await prisma.product.update({
      where: { id: product.id },
      data: { coverImage: primary.url },
    });
  }
  const images = await prisma.productImage.findMany({
    where: { productId },
    orderBy: { sortOrder: "asc" },
  });
  return images.map(serializeManagedImage);
}

export async function uploadCreatorAvatar(userId: string, file: Express.Multer.File | undefined) {
  if (!file) throw badRequest("Choose an image to upload.");
  assertAllowedImage(file.originalname, file.mimetype);
  const profile = await prisma.creatorProfile.findUnique({ where: { userId } });
  if (!profile) throw notFound("Create a store first.");

  const uploaded = await uploadPublicImage({
    buffer: file.buffer,
    folder: cloudinaryFolders.creatorAvatar(profile.id),
    fileName: file.originalname,
  });
  const previous = profile.avatarPublicId;
  const updated = await prisma.creatorProfile.update({
    where: { id: profile.id },
    data: { avatar: uploaded.secureUrl, avatarPublicId: uploaded.publicId },
  });
  if (previous && previous !== uploaded.publicId) {
    await destroyCloudinaryAsset({
      publicId: previous,
      resourceType: "image",
      type: "upload",
    }).catch((error) => {
      logEvent("cloudinary_cleanup_failed", {
        publicId: previous,
        reason: error instanceof Error ? error.message : "unknown",
      });
    });
  }
  return { avatarUrl: updated.avatar };
}
