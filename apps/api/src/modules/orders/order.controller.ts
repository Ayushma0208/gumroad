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
  const orders = await listOrdersForUser(user.id, user.role);
  res.json(success({ orders }));
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
