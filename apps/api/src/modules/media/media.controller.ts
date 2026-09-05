import type { Request, Response } from "express";
import { unauthorized } from "../../utils/app-error";
import { success } from "../../utils/response";
import {
  deleteProductFile,
  deleteProductImage,
  listProductFiles,
  listProductImages,
  reorderProductImages,
  uploadCreatorAvatar,
  uploadProductFile,
  uploadProductImage,
} from "./media.service";

function actor(req: Request) {
  if (!req.user) throw unauthorized();
  return req.user;
}

export async function listFiles(req: Request, res: Response) {
  const user = actor(req);
  const files = await listProductFiles(user.id, user.role, String(req.params.productId));
  res.json(success({ files }));
}

export async function createFile(req: Request, res: Response) {
  const user = actor(req);
  const file = await uploadProductFile(
    user.id,
    user.role,
    String(req.params.productId),
    req.file,
  );
  res.status(201).json(success({ file }));
}

export async function removeFile(req: Request, res: Response) {
  const user = actor(req);
  const result = await deleteProductFile(
    user.id,
    user.role,
    String(req.params.productId),
    String(req.params.fileId),
  );
  res.json(success(result));
}

export async function listImages(req: Request, res: Response) {
  const user = actor(req);
  const images = await listProductImages(user.id, user.role, String(req.params.productId));
  res.json(success({ images }));
}

export async function createImage(req: Request, res: Response) {
  const user = actor(req);
  const image = await uploadProductImage(
    user.id,
    user.role,
    String(req.params.productId),
    req.file,
  );
  res.status(201).json(success({ image }));
}

export async function removeImage(req: Request, res: Response) {
  const user = actor(req);
  const result = await deleteProductImage(
    user.id,
    user.role,
    String(req.params.productId),
    String(req.params.imageId),
  );
  res.json(success(result));
}

export async function reorderImages(req: Request, res: Response) {
  const user = actor(req);
  const imageIds = Array.isArray(req.body?.imageIds)
    ? (req.body.imageIds as string[])
    : [];
  const images = await reorderProductImages(
    user.id,
    user.role,
    String(req.params.productId),
    imageIds,
  );
  res.json(success({ images }));
}

export async function createAvatar(req: Request, res: Response) {
  const user = actor(req);
  const result = await uploadCreatorAvatar(user.id, req.file);
  res.status(201).json(success(result));
}
