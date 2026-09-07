import type { Request, Response } from "express";
import { unauthorized } from "../../utils/app-error";
import { success } from "../../utils/response";
import type { CheckoutCouponInput } from "../coupons/coupon.schema";
import { createCheckoutOrder, previewCheckout } from "./checkout.service";

export async function createOrder(req: Request, res: Response) {
  if (!req.user) throw unauthorized();
  const body = (req.body ?? {}) as CheckoutCouponInput;
  const session = await createCheckoutOrder(req.user.id, body.couponCode);
  res.status(201).json(success(session));
}

export async function preview(req: Request, res: Response) {
  if (!req.user) throw unauthorized();
  const body = (req.body ?? {}) as CheckoutCouponInput;
  const data = await previewCheckout(req.user.id, body.couponCode);
  res.json(success(data));
}
