import type { Request, Response } from "express";
import { unauthorized } from "../../utils/app-error";
import { success } from "../../utils/response";
import { createCheckoutOrder } from "./checkout.service";

export async function createOrder(req: Request, res: Response) {
  if (!req.user) throw unauthorized();
  const session = await createCheckoutOrder(req.user.id);
  res.status(201).json(success(session));
}
