import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { checkoutCouponSchema } from "../coupons/coupon.schema";
import { createOrder, preview } from "./checkout.controller";

export const checkoutRouter = Router();

checkoutRouter.post(
  "/preview",
  requireAuth,
  requireRole("CUSTOMER"),
  validateBody(checkoutCouponSchema),
  asyncHandler(preview),
);
checkoutRouter.post(
  "/create-order",
  requireAuth,
  requireRole("CUSTOMER"),
  validateBody(checkoutCouponSchema),
  asyncHandler(createOrder),
);
