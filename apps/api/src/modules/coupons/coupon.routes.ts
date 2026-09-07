import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middleware/validation.middleware";
import { asyncHandler } from "../../utils/async-handler";
import {
  createMine,
  deactivateMine,
  getMine,
  listMine,
  removeMine,
  updateMine,
  usageMine,
} from "./coupon.controller";
import {
  couponIdParamSchema,
  createCouponSchema,
  listCreatorCouponsQuerySchema,
  updateCouponSchema,
} from "./coupon.schema";

export const couponRouter = Router();
const creator = [requireAuth, requireRole("CREATOR", "ADMIN")] as const;

couponRouter.get(
  "/",
  ...creator,
  validateQuery(listCreatorCouponsQuerySchema),
  asyncHandler(listMine),
);
couponRouter.post(
  "/",
  ...creator,
  validateBody(createCouponSchema),
  asyncHandler(createMine),
);
couponRouter.get(
  "/:couponId/usage",
  ...creator,
  validateParams(couponIdParamSchema),
  asyncHandler(usageMine),
);
couponRouter.get(
  "/:couponId",
  ...creator,
  validateParams(couponIdParamSchema),
  asyncHandler(getMine),
);
couponRouter.patch(
  "/:couponId",
  ...creator,
  validateParams(couponIdParamSchema),
  validateBody(updateCouponSchema),
  asyncHandler(updateMine),
);
couponRouter.post(
  "/:couponId/deactivate",
  ...creator,
  validateParams(couponIdParamSchema),
  asyncHandler(deactivateMine),
);
couponRouter.delete(
  "/:couponId",
  ...creator,
  validateParams(couponIdParamSchema),
  asyncHandler(removeMine),
);
