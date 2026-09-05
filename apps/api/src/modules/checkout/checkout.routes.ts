import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { createOrder } from "./checkout.controller";

export const checkoutRouter = Router();

checkoutRouter.post(
  "/create-order",
  requireAuth,
  requireRole("CUSTOMER"),
  asyncHandler(createOrder),
);
