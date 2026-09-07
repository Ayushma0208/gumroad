import type { Request, Response } from "express";
import type { ProductStatus, UserStatus } from "@prisma/client";
import { unauthorized } from "../../utils/app-error";
import { success } from "../../utils/response";
import {
  getAdminAnalyticsOverview,
  getAdminRecentAudit,
} from "./admin.analytics.service";
import type {
  AdminAnalyticsQuery,
  AdminAuditQuery,
  AdminCouponsQuery,
  AdminCreatorsQuery,
  AdminOrdersQuery,
  AdminProductsQuery,
  AdminReportsQuery,
  AdminUsersQuery,
  CreateReportInput,
} from "./admin.schema";
import {
  adminCreateCategory,
  adminDeleteCategory,
  adminDeleteReview,
  adminModerateReview,
  adminUpdateCategory,
  getAdminCreator,
  getAdminOrder,
  getAdminProduct,
  getAdminUser,
  listAdminAuditLogs,
  listAdminCategories,
  listAdminCoupons,
  listAdminCreators,
  listAdminOrders,
  listAdminProducts,
  listAdminReviews,
  listAdminUsers,
  setAdminProductStatus,
  setAdminUserStatus,
} from "./admin.ops.service";
import {
  listAdminReports,
  serializeReport,
  updateAdminReportStatus,
} from "../reports/report.service";
import type { AdminReviewsQuery } from "../reviews/review.schema";

function actor(req: Request) {
  if (!req.user) throw unauthorized();
  return req.user;
}

export async function analyticsOverview(req: Request, res: Response) {
  const [overview, recentActivity] = await Promise.all([
    getAdminAnalyticsOverview(req.query as AdminAnalyticsQuery),
    getAdminRecentAudit(10),
  ]);
  res.json(success({ ...overview, recentActivity }));
}

export async function users(req: Request, res: Response) {
  const data = await listAdminUsers(req.query as unknown as AdminUsersQuery);
  res.json(success(data));
}

export async function userDetail(req: Request, res: Response) {
  const data = await getAdminUser(String(req.params.userId));
  res.json(success({ user: data }));
}

export async function userStatus(req: Request, res: Response) {
  const admin = actor(req);
  const data = await setAdminUserStatus(
    admin.id,
    String(req.params.userId),
    (req.body as { status: UserStatus }).status,
  );
  res.json(success({ user: data }));
}

export async function creators(req: Request, res: Response) {
  const data = await listAdminCreators(
    req.query as unknown as AdminCreatorsQuery,
  );
  res.json(success(data));
}

export async function creatorDetail(req: Request, res: Response) {
  const data = await getAdminCreator(String(req.params.creatorId));
  res.json(success({ creator: data }));
}

export async function products(req: Request, res: Response) {
  const data = await listAdminProducts(
    req.query as unknown as AdminProductsQuery,
  );
  res.json(success(data));
}

export async function productDetail(req: Request, res: Response) {
  const data = await getAdminProduct(String(req.params.productId));
  res.json(success({ product: data }));
}

export async function productStatus(req: Request, res: Response) {
  const admin = actor(req);
  const data = await setAdminProductStatus(
    admin.id,
    String(req.params.productId),
    (req.body as { status: ProductStatus }).status,
  );
  res.json(success({ product: data }));
}

export async function orders(req: Request, res: Response) {
  const data = await listAdminOrders(req.query as unknown as AdminOrdersQuery);
  res.json(success(data));
}

export async function orderDetail(req: Request, res: Response) {
  const data = await getAdminOrder(String(req.params.orderId));
  res.json(success({ order: data }));
}

export async function coupons(req: Request, res: Response) {
  const data = await listAdminCoupons(
    req.query as unknown as AdminCouponsQuery,
  );
  res.json(success(data));
}

export async function reviews(req: Request, res: Response) {
  const data = await listAdminReviews(req.query as AdminReviewsQuery);
  res.json(success(data));
}

export async function reviewModerate(req: Request, res: Response) {
  const admin = actor(req);
  const review = await adminModerateReview(
    admin.id,
    String(req.params.reviewId),
    (req.body as { status: "PUBLISHED" | "HIDDEN" }).status,
  );
  res.json(success({ review }));
}

export async function reviewRemove(req: Request, res: Response) {
  const admin = actor(req);
  await adminDeleteReview(admin.id, String(req.params.reviewId));
  res.json(success({ ok: true }));
}

export async function reports(req: Request, res: Response) {
  const data = await listAdminReports(
    req.query as unknown as AdminReportsQuery,
  );
  res.json(success(data));
}

export async function reportDetail(req: Request, res: Response) {
  const data = await serializeReport(String(req.params.reportId));
  res.json(success({ report: data }));
}

export async function reportStatus(req: Request, res: Response) {
  const admin = actor(req);
  const body = req.body as {
    status: "UNDER_REVIEW" | "RESOLVED" | "DISMISSED";
    resolutionNote?: string;
  };
  const data = await updateAdminReportStatus(
    admin.id,
    String(req.params.reportId),
    body.status,
    body.resolutionNote,
  );
  res.json(success({ report: data }));
}

export async function auditLogs(req: Request, res: Response) {
  const data = await listAdminAuditLogs(
    req.query as unknown as AdminAuditQuery,
  );
  res.json(success(data));
}

export async function categories(req: Request, res: Response) {
  const items = await listAdminCategories();
  res.json(success({ items }));
}

export async function categoryCreate(req: Request, res: Response) {
  const admin = actor(req);
  const category = await adminCreateCategory(admin.id, req.body);
  res.status(201).json(success({ category }));
}

export async function categoryUpdate(req: Request, res: Response) {
  const admin = actor(req);
  const category = await adminUpdateCategory(
    admin.id,
    String(req.params.categoryId),
    req.body,
  );
  res.json(success({ category }));
}

export async function categoryRemove(req: Request, res: Response) {
  const admin = actor(req);
  await adminDeleteCategory(admin.id, String(req.params.categoryId));
  res.json(success({ ok: true }));
}

// Silence unused CreateReportInput if only used in reports module
export type { CreateReportInput };
