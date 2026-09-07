import type { Request, Response } from "express";
import { unauthorized } from "../../utils/app-error";
import { success } from "../../utils/response";
import type {
  AnalyticsRangeQuery,
  ProductAnalyticsQuery,
  RecentSalesQuery,
} from "./analytics.schema";
import {
  getCreatorAnalyticsOverview,
  getCreatorCouponAnalytics,
  getCreatorCustomerAnalytics,
  getCreatorProductAnalytics,
  getCreatorProductDetailAnalytics,
  getCreatorRecentSales,
  getCreatorRevenueAnalytics,
  getCreatorSalesAnalytics,
} from "./analytics.service";

function actor(req: Request) {
  if (!req.user) throw unauthorized();
  return req.user;
}

export async function overview(req: Request, res: Response) {
  const user = actor(req);
  const data = await getCreatorAnalyticsOverview(
    user.id,
    req.query as AnalyticsRangeQuery,
  );
  res.json(success(data));
}

export async function revenue(req: Request, res: Response) {
  const user = actor(req);
  const data = await getCreatorRevenueAnalytics(
    user.id,
    req.query as AnalyticsRangeQuery,
  );
  res.json(success(data));
}

export async function sales(req: Request, res: Response) {
  const user = actor(req);
  const data = await getCreatorSalesAnalytics(
    user.id,
    req.query as AnalyticsRangeQuery,
  );
  res.json(success(data));
}

export async function products(req: Request, res: Response) {
  const user = actor(req);
  const data = await getCreatorProductAnalytics(
    user.id,
    req.query as unknown as ProductAnalyticsQuery,
  );
  res.json(success(data));
}

export async function customers(req: Request, res: Response) {
  const user = actor(req);
  const data = await getCreatorCustomerAnalytics(
    user.id,
    req.query as AnalyticsRangeQuery,
  );
  res.json(success(data));
}

export async function coupons(req: Request, res: Response) {
  const user = actor(req);
  const data = await getCreatorCouponAnalytics(
    user.id,
    req.query as AnalyticsRangeQuery,
  );
  res.json(success(data));
}

export async function recentSales(req: Request, res: Response) {
  const user = actor(req);
  const data = await getCreatorRecentSales(
    user.id,
    req.query as unknown as RecentSalesQuery,
  );
  res.json(success(data));
}

export async function productDetail(req: Request, res: Response) {
  const user = actor(req);
  const data = await getCreatorProductDetailAnalytics(
    user.id,
    String(req.params.productId),
    req.query as AnalyticsRangeQuery,
  );
  res.json(success(data));
}
