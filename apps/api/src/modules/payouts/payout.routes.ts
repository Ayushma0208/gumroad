import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middleware/validation.middleware";
import { createRateLimiter } from "../../middleware/rate-limit.middleware";
import { asyncHandler } from "../../utils/async-handler";
import * as earningsCtrl from "../earnings/earnings.controller";
import {
  earningsListQuerySchema,
  payoutIdParamSchema,
  payoutListQuerySchema,
  requestPayoutSchema,
  upsertPayoutAccountSchema,
} from "../earnings/earnings.schema";
import * as payoutCtrl from "./payout.controller";

export const earningsRouter = Router();

earningsRouter.use(requireAuth, requireRole("CREATOR", "ADMIN"));

earningsRouter.get("/summary", asyncHandler(earningsCtrl.summary));
earningsRouter.get(
  "/",
  validateQuery(earningsListQuerySchema),
  asyncHandler(earningsCtrl.list),
);

export const payoutsRouter = Router();

payoutsRouter.use(requireAuth, requireRole("CREATOR", "ADMIN"));

payoutsRouter.get("/account", asyncHandler(payoutCtrl.accountGet));
payoutsRouter.put(
  "/account",
  validateBody(upsertPayoutAccountSchema),
  asyncHandler(payoutCtrl.accountUpsert),
);
payoutsRouter.get(
  "/",
  validateQuery(payoutListQuerySchema),
  asyncHandler(payoutCtrl.payoutsList),
);
payoutsRouter.post(
  "/",
  createRateLimiter({
    windowMs: 60_000,
    max: 5,
    keyPrefix: "payout-request",
  }),
  validateBody(requestPayoutSchema),
  asyncHandler(payoutCtrl.payoutRequest),
);
payoutsRouter.get(
  "/:payoutId",
  validateParams(payoutIdParamSchema),
  asyncHandler(payoutCtrl.payoutGet),
);
