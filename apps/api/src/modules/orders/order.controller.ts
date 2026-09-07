import type { Request, Response } from "express";
import { unauthorized } from "../../utils/app-error";
import { success } from "../../utils/response";
import {
  getOrderForViewer,
  listOrdersForUser,
  listPurchasesForUser,
} from "./order.service";

function actor(req: Request) {
  if (!req.user) throw unauthorized();
  return req.user;
}

export async function list(req: Request, res: Response) {
  const user = actor(req);
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 24);
  const result = await listOrdersForUser(user.id, user.role, page, limit);
  // Keep `orders` key for backward-compatible clients; also expose paginated shape.
  res.json(
    success({
      orders: result.items,
      items: result.items,
      meta: result.meta,
    }),
  );
}

export async function getById(req: Request, res: Response) {
  const user = actor(req);
  const order = await getOrderForViewer(String(req.params.id), user);
  res.json(success({ order }));
}

export async function purchases(req: Request, res: Response) {
  const user = actor(req);
  const items = await listPurchasesForUser(user.id);
  res.json(success({ purchases: items }));
}
