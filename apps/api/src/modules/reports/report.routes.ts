import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { unauthorized } from "../../utils/app-error";
import { success } from "../../utils/response";
import { createReportSchema } from "../admin/admin.schema";
import { createReport } from "./report.service";
import type { CreateReportInput } from "../admin/admin.schema";
import type { Request, Response } from "express";

export const reportRouter = Router();

reportRouter.post(
  "/",
  requireAuth,
  validateBody(createReportSchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw unauthorized();
    const report = await createReport(
      req.user.id,
      req.body as CreateReportInput,
    );
    res.status(201).json(success({ report }));
  }),
);
