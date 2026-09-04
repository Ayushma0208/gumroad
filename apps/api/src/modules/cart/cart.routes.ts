import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { getCart } from "./cart.controller";

export const cartRouter = Router();

cartRouter.get("/", requireAuth, asyncHandler(getCart));
