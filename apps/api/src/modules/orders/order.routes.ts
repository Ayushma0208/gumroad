import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { list } from "./order.controller";

export const orderRouter = Router();

orderRouter.get("/", requireAuth, asyncHandler(list));
