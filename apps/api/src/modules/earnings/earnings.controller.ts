import type { Request, Response } from "express";
import { success } from "../../utils/response";
import {
  getEarningsSummaryForUser,
  listAdminEarnings,
  listEarningsForUser,
  parseOptionalDate,
} from "./earnings.service";
import type {
  adminEarningsQuerySchema,
  earningsListQuerySchema,
} from "./earnings.schema";
import type { z } from "zod";

export async function summary(req: Request, res: Response) {
  const data = await getEarningsSummaryForUser(req.user!.id);
  res.json(success(data));
}

export async function list(req: Request, res: Response) {
  const query = req.query as unknown as z.infer<typeof earningsListQuerySchema>;
  const data = await listEarningsForUser(req.user!.id, {
    page: query.page,
    pageSize: query.pageSize,
    status: query.status,
    productId: query.productId,
    from: parseOptionalDate(query.from, "from"),
    to: parseOptionalDate(query.to, "to"),
  });
  res.json(success(data));
}

export async function adminList(req: Request, res: Response) {
  const query = req.query as unknown as z.infer<typeof adminEarningsQuerySchema>;
  const data = await listAdminEarnings({
    page: query.page,
    pageSize: query.pageSize,
    status: query.status,
    creatorId: query.creatorId,
  });
  res.json(success(data));
}
