import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middleware/validation.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { reviewIdParamSchema, adminReviewsQuerySchema, moderateReviewSchema } from "../reviews/review.schema";
import * as ctrl from "./admin.controller";
import {
  adminAnalyticsQuerySchema,
  adminAuditQuerySchema,
  adminCategoryBodySchema,
  adminCouponsQuerySchema,
  adminCreatorIdParamSchema,
  adminCreatorsQuerySchema,
  adminOrderIdParamSchema,
  adminOrdersQuerySchema,
  adminProductIdParamSchema,
  adminProductStatusSchema,
  adminProductsQuerySchema,
  adminReportIdParamSchema,
  adminReportStatusSchema,
  adminReportsQuerySchema,
  adminUserIdParamSchema,
  adminUserStatusSchema,
  adminUsersQuerySchema,
} from "./admin.schema";
import { z } from "zod";
import { emailHealth, processEmails } from "../notifications/notification.controller";
import * as earningsCtrl from "../earnings/earnings.controller";
import * as payoutCtrl from "../payouts/payout.controller";
import {
  adminEarningsQuerySchema,
  adminPayoutAccountSchema,
  adminPayoutStatusSchema,
  adminPayoutsQuerySchema,
  payoutIdParamSchema,
} from "../earnings/earnings.schema";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("ADMIN"));

adminRouter.get(
  "/analytics/overview",
  validateQuery(adminAnalyticsQuerySchema),
  asyncHandler(ctrl.analyticsOverview),
);
adminRouter.get(
  "/overview",
  validateQuery(adminAnalyticsQuerySchema),
  asyncHandler(ctrl.analyticsOverview),
);

adminRouter.get(
  "/users",
  validateQuery(adminUsersQuerySchema),
  asyncHandler(ctrl.users),
);
adminRouter.get(
  "/users/:userId",
  validateParams(adminUserIdParamSchema),
  asyncHandler(ctrl.userDetail),
);
adminRouter.patch(
  "/users/:userId/status",
  validateParams(adminUserIdParamSchema),
  validateBody(adminUserStatusSchema),
  asyncHandler(ctrl.userStatus),
);

adminRouter.get(
  "/creators",
  validateQuery(adminCreatorsQuerySchema),
  asyncHandler(ctrl.creators),
);
adminRouter.get(
  "/creators/:creatorId",
  validateParams(adminCreatorIdParamSchema),
  asyncHandler(ctrl.creatorDetail),
);

adminRouter.get(
  "/products",
  validateQuery(adminProductsQuerySchema),
  asyncHandler(ctrl.products),
);
adminRouter.get(
  "/products/:productId",
  validateParams(adminProductIdParamSchema),
  asyncHandler(ctrl.productDetail),
);
adminRouter.patch(
  "/products/:productId/status",
  validateParams(adminProductIdParamSchema),
  validateBody(adminProductStatusSchema),
  asyncHandler(ctrl.productStatus),
);

adminRouter.get(
  "/orders",
  validateQuery(adminOrdersQuerySchema),
  asyncHandler(ctrl.orders),
);
adminRouter.get(
  "/orders/:orderId",
  validateParams(adminOrderIdParamSchema),
  asyncHandler(ctrl.orderDetail),
);

adminRouter.get(
  "/coupons",
  validateQuery(adminCouponsQuerySchema),
  asyncHandler(ctrl.coupons),
);

adminRouter.get(
  "/reviews",
  validateQuery(adminReviewsQuerySchema),
  asyncHandler(ctrl.reviews),
);
adminRouter.patch(
  "/reviews/:reviewId",
  validateParams(reviewIdParamSchema),
  validateBody(moderateReviewSchema),
  asyncHandler(ctrl.reviewModerate),
);
adminRouter.delete(
  "/reviews/:reviewId",
  validateParams(reviewIdParamSchema),
  asyncHandler(ctrl.reviewRemove),
);

adminRouter.get(
  "/reports",
  validateQuery(adminReportsQuerySchema),
  asyncHandler(ctrl.reports),
);
adminRouter.get(
  "/reports/:reportId",
  validateParams(adminReportIdParamSchema),
  asyncHandler(ctrl.reportDetail),
);
adminRouter.patch(
  "/reports/:reportId",
  validateParams(adminReportIdParamSchema),
  validateBody(adminReportStatusSchema),
  asyncHandler(ctrl.reportStatus),
);

adminRouter.get(
  "/audit-logs",
  validateQuery(adminAuditQuerySchema),
  asyncHandler(ctrl.auditLogs),
);

adminRouter.get("/categories", asyncHandler(ctrl.categories));
adminRouter.post(
  "/categories",
  validateBody(adminCategoryBodySchema),
  asyncHandler(ctrl.categoryCreate),
);
adminRouter.patch(
  "/categories/:categoryId",
  validateParams(z.object({ categoryId: z.string().min(1) })),
  validateBody(adminCategoryBodySchema.partial()),
  asyncHandler(ctrl.categoryUpdate),
);
adminRouter.delete(
  "/categories/:categoryId",
  validateParams(z.object({ categoryId: z.string().min(1) })),
  asyncHandler(ctrl.categoryRemove),
);

adminRouter.get("/email-jobs", asyncHandler(emailHealth));
adminRouter.post("/email-jobs/process", asyncHandler(processEmails));

adminRouter.get(
  "/payouts",
  validateQuery(adminPayoutsQuerySchema),
  asyncHandler(payoutCtrl.adminPayouts),
);
adminRouter.get(
  "/payouts/:payoutId",
  validateParams(payoutIdParamSchema),
  asyncHandler(payoutCtrl.adminPayoutDetail),
);
adminRouter.patch(
  "/payouts/:payoutId/status",
  validateParams(payoutIdParamSchema),
  validateBody(adminPayoutStatusSchema),
  asyncHandler(payoutCtrl.adminPayoutStatus),
);
adminRouter.patch(
  "/creators/:creatorId/payout-account",
  validateParams(adminCreatorIdParamSchema),
  validateBody(adminPayoutAccountSchema),
  asyncHandler(payoutCtrl.adminCreatorPayoutAccount),
);
adminRouter.get(
  "/earnings",
  validateQuery(adminEarningsQuerySchema),
  asyncHandler(earningsCtrl.adminList),
);
