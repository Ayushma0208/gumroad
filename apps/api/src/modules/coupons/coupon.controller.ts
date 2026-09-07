import type { Request, Response } from "express";
import { unauthorized } from "../../utils/app-error";
import { success } from "../../utils/response";
import type {
  CreateCouponInput,
  ListCreatorCouponsQuery,
  UpdateCouponInput,
} from "./coupon.schema";
import {
  createCreatorCoupon,
  deactivateCreatorCoupon,
  deleteCreatorCoupon,
  getCreatorCoupon,
  getCreatorCouponUsage,
  listCreatorCoupons,
  updateCreatorCoupon,
} from "./coupon.service";

function actor(req: Request) {
  if (!req.user) throw unauthorized();
  return req.user;
}

export async function listMine(req: Request, res: Response) {
  const user = actor(req);
  const data = await listCreatorCoupons(
    user.id,
    req.query as unknown as ListCreatorCouponsQuery,
  );
  res.json(success(data));
}

export async function getMine(req: Request, res: Response) {
  const user = actor(req);
  const coupon = await getCreatorCoupon(user.id, String(req.params.couponId));
  res.json(success({ coupon }));
}

export async function createMine(req: Request, res: Response) {
  const user = actor(req);
  const coupon = await createCreatorCoupon(
    user.id,
    req.body as CreateCouponInput,
  );
  res.status(201).json(success({ coupon }));
}

export async function updateMine(req: Request, res: Response) {
  const user = actor(req);
  const coupon = await updateCreatorCoupon(
    user.id,
    String(req.params.couponId),
    req.body as UpdateCouponInput,
  );
  res.json(success({ coupon }));
}

export async function deactivateMine(req: Request, res: Response) {
  const user = actor(req);
  const coupon = await deactivateCreatorCoupon(
    user.id,
    String(req.params.couponId),
  );
  res.json(success({ coupon }));
}

export async function removeMine(req: Request, res: Response) {
  const user = actor(req);
  const result = await deleteCreatorCoupon(user.id, String(req.params.couponId));
  res.json(success(result));
}

export async function usageMine(req: Request, res: Response) {
  const user = actor(req);
  const data = await getCreatorCouponUsage(
    user.id,
    String(req.params.couponId),
  );
  res.json(success(data));
}
