import type { Request, Response } from "express";
import { success } from "../../utils/response";
import {
  adminGetPayout,
  adminListPayouts,
  adminUpdatePayoutAccount,
  adminUpdatePayoutStatus,
  getPayoutAccountForUser,
  getPayoutForUser,
  listPayoutsForUser,
  requestPayoutForUser,
  upsertPayoutAccountForUser,
} from "./payout.service";
import type { z } from "zod";
import type {
  adminPayoutAccountSchema,
  adminPayoutStatusSchema,
  adminPayoutsQuerySchema,
  payoutListQuerySchema,
  requestPayoutSchema,
  upsertPayoutAccountSchema,
} from "../earnings/earnings.schema";

export async function accountGet(req: Request, res: Response) {
  const data = await getPayoutAccountForUser(req.user!.id);
  res.json(success(data));
}

export async function accountUpsert(req: Request, res: Response) {
  const body = req.body as z.infer<typeof upsertPayoutAccountSchema>;
  const data = await upsertPayoutAccountForUser(req.user!.id, body);
  res.json(success(data));
}

export async function payoutsList(req: Request, res: Response) {
  const query = req.query as unknown as z.infer<typeof payoutListQuerySchema>;
  const data = await listPayoutsForUser(req.user!.id, {
    page: query.page,
    pageSize: query.pageSize,
    status: query.status,
  });
  res.json(success(data));
}

export async function payoutGet(req: Request, res: Response) {
  const data = await getPayoutForUser(req.user!.id, req.params.payoutId as string);
  res.json(success(data));
}

export async function payoutRequest(req: Request, res: Response) {
  const body = req.body as z.infer<typeof requestPayoutSchema>;
  const data = await requestPayoutForUser(req.user!.id, body);
  res.status(201).json(success(data));
}

export async function adminPayouts(req: Request, res: Response) {
  const query = req.query as unknown as z.infer<typeof adminPayoutsQuerySchema>;
  const data = await adminListPayouts(query);
  res.json(success(data));
}

export async function adminPayoutDetail(req: Request, res: Response) {
  const data = await adminGetPayout(req.params.payoutId as string);
  res.json(success(data));
}

export async function adminPayoutStatus(req: Request, res: Response) {
  const body = req.body as z.infer<typeof adminPayoutStatusSchema>;
  const data = await adminUpdatePayoutStatus({
    adminId: req.user!.id,
    payoutId: req.params.payoutId as string,
    status: body.status,
    failureMessage: body.failureMessage,
    providerPayoutId: body.providerPayoutId,
  });
  res.json(success(data));
}

export async function adminCreatorPayoutAccount(req: Request, res: Response) {
  const body = req.body as z.infer<typeof adminPayoutAccountSchema>;
  const data = await adminUpdatePayoutAccount({
    adminId: req.user!.id,
    creatorId: req.params.creatorId as string,
    status: body.status,
  });
  res.json(success(data));
}
