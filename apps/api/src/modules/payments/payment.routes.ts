import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { success } from "../../utils/response";

/**
 * Payment capture is not implemented in this milestone.
 * Razorpay/Stripe webhooks will live here later.
 */
export const paymentRouter = Router();

paymentRouter.get(
  "/status",
  requireAuth,
  requireRole("ADMIN"),
  (_req, res) => {
    res.json(
      success({
        provider: "none",
        configured: false,
      }),
    );
  },
);
