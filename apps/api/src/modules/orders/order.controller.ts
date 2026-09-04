import type { Request, Response } from "express";
import { unauthorized } from "../../utils/app-error";
import { success } from "../../utils/response";
import { listOrdersForUser } from "./order.service";

export async function list(req: Request, res: Response) {
  if (!req.user) throw unauthorized();
  const orders = await listOrdersForUser(req.user.id);
  res.json(success({ orders }));
}
