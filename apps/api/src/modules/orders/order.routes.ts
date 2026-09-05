import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { getById, list, purchases } from "./order.controller";

export const orderRouter = Router();

orderRouter.get("/", requireAuth, asyncHandler(list));
orderRouter.get("/purchases", requireAuth, asyncHandler(purchases));
orderRouter.get("/:id", requireAuth, asyncHandler(getById));
