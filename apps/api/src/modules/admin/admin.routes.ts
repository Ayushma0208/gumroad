import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { prisma } from "../../config/database";
import { success } from "../../utils/response";

export const adminRouter = Router();

adminRouter.get(
  "/overview",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(async (_req, res) => {
    const [users, products, orders] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
    ]);
    res.json(success({ users, products, orders }));
  }),
);
