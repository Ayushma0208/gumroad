import type { Request, Response } from "express";
import { unauthorized } from "../../utils/app-error";
import { success } from "../../utils/response";
import type {
  AddWishlistItemInput,
  ListWishlistQuery,
  WishlistStatusQuery,
} from "./wishlist.schema";
import {
  addWishlistItem,
  checkWishlistItem,
  clearWishlist,
  listWishlist,
  listWishlistProductIds,
  removeWishlistItem,
  wishlistStatus,
} from "./wishlist.service";

function actorId(req: Request) {
  if (!req.user) throw unauthorized();
  return req.user.id;
}

export async function list(req: Request, res: Response) {
  const data = await listWishlist(
    actorId(req),
    req.query as unknown as ListWishlistQuery,
  );
  res.json(success(data));
}

export async function ids(req: Request, res: Response) {
  const data = await listWishlistProductIds(actorId(req));
  res.json(success(data));
}

export async function status(req: Request, res: Response) {
  const query = req.query as unknown as WishlistStatusQuery;
  const data = await wishlistStatus(actorId(req), query.productIds);
  res.json(success(data));
}

export async function check(req: Request, res: Response) {
  const data = await checkWishlistItem(
    actorId(req),
    String(req.params.productId),
  );
  res.json(success(data));
}

export async function add(req: Request, res: Response) {
  const result = await addWishlistItem(
    actorId(req),
    req.body as AddWishlistItemInput,
  );
  res.status(result.created ? 201 : 200).json(success(result));
}

export async function remove(req: Request, res: Response) {
  const data = await removeWishlistItem(
    actorId(req),
    String(req.params.productId),
  );
  res.json(success(data));
}

export async function clear(req: Request, res: Response) {
  const data = await clearWishlist(actorId(req));
  res.json(success(data));
}
