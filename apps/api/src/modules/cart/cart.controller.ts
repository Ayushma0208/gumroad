import type { Request, Response } from "express";
import { unauthorized } from "../../utils/app-error";
import { success } from "../../utils/response";
import { getOrCreateCart } from "./cart.service";

export async function getCart(req: Request, res: Response) {
  if (!req.user) throw unauthorized();
  const cart = await getOrCreateCart(req.user.id);
  res.json(success({ cart }));
}
