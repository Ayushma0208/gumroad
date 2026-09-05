import type { Request, Response } from "express";
import { unauthorized } from "../../utils/app-error";
import { success } from "../../utils/response";
import {
  getLibraryFiles,
  getLibraryProduct,
  listLibrary,
  requestLibraryDownload,
} from "./library.service";

function actor(req: Request) {
  if (!req.user) throw unauthorized();
  return req.user;
}

export async function list(req: Request, res: Response) {
  const user = actor(req);
  const result = await listLibrary(
    user.id,
    req.query.page ? Number(req.query.page) : undefined,
    req.query.limit ? Number(req.query.limit) : undefined,
  );
  res.json(success(result));
}

export async function getProduct(req: Request, res: Response) {
  const user = actor(req);
  const item = await getLibraryProduct(user.id, String(req.params.productId));
  res.json(success(item));
}

export async function listFiles(req: Request, res: Response) {
  const user = actor(req);
  const result = await getLibraryFiles(user.id, String(req.params.productId));
  res.json(success(result));
}

export async function download(req: Request, res: Response) {
  const user = actor(req);
  const result = await requestLibraryDownload(
    user.id,
    String(req.params.productId),
    typeof req.query.fileId === "string" ? req.query.fileId : undefined,
  );
  res.json(success(result));
}
