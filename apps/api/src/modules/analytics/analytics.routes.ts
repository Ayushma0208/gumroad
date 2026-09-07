import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import {
  validateParams,
  validateQuery,
} from "../../middleware/validation.middleware";
import { asyncHandler } from "../../utils/async-handler";
import {
  coupons,
  customers,
  overview,
  productDetail,
  products,
  recentSales,
  revenue,
  sales,
} from "./analytics.controller";
import {
  analyticsRangeQuerySchema,
  productAnalyticsQuerySchema,
  productIdParamSchema,
  recentSalesQuerySchema,
} from "./analytics.schema";

export const analyticsRouter = Router();

analyticsRouter.use(requireAuth, requireRole("CREATOR", "ADMIN"));

analyticsRouter.get(
  "/overview",
  validateQuery(analyticsRangeQuerySchema),
  asyncHandler(overview),
);
analyticsRouter.get(
  "/revenue",
  validateQuery(analyticsRangeQuerySchema),
  asyncHandler(revenue),
);
analyticsRouter.get(
  "/sales",
  validateQuery(analyticsRangeQuerySchema),
  asyncHandler(sales),
);
analyticsRouter.get(
  "/products",
  validateQuery(productAnalyticsQuerySchema),
  asyncHandler(products),
);
analyticsRouter.get(
  "/products/:productId",
  validateParams(productIdParamSchema),
  validateQuery(analyticsRangeQuerySchema),
  asyncHandler(productDetail),
);
analyticsRouter.get(
  "/customers",
  validateQuery(analyticsRangeQuerySchema),
  asyncHandler(customers),
);
analyticsRouter.get(
  "/coupons",
  validateQuery(analyticsRangeQuerySchema),
  asyncHandler(coupons),
);
analyticsRouter.get(
  "/recent-sales",
  validateQuery(recentSalesQuerySchema),
  asyncHandler(recentSales),
);
