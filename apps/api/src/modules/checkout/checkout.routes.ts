import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { createRateLimiter } from "../../middleware/rate-limit.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { checkoutCouponSchema } from "../coupons/coupon.schema";
import { createOrder, preview } from "./checkout.controller";

export const checkoutRouter = Router();

const checkoutCreateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 20,
  keyPrefix: "checkout-create",
});

checkoutRouter.post(
  "/preview",
  requireAuth,
  requireRole("CUSTOMER", "CREATOR"),
  validateBody(checkoutCouponSchema),
  asyncHandler(preview),
);
checkoutRouter.post(
  "/create-order",
  requireAuth,
  requireRole("CUSTOMER", "CREATOR"),
  checkoutCreateLimit,
  validateBody(checkoutCouponSchema),
  asyncHandler(createOrder),
);
