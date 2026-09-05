import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { env } from "../../config/env";
import { success } from "../../utils/response";
import { verify } from "./payment.controller";
import { verifyRazorpaySchema } from "./payment.validation";

export const paymentRouter = Router();

paymentRouter.post(
  "/razorpay/verify",
  requireAuth,
  requireRole("CUSTOMER"),
  validateBody(verifyRazorpaySchema),
  asyncHandler(verify),
);

paymentRouter.get("/status", requireAuth, requireRole("ADMIN"), (_req, res) => {
  res.json(
    success({
      provider: "RAZORPAY",
      configured: Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET),
    }),
  );
});
