import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { download, getProduct, ids, list, listFiles } from "./library.controller";

export const libraryRouter = Router();

libraryRouter.get("/", requireAuth, asyncHandler(list));
libraryRouter.get("/ids", requireAuth, asyncHandler(ids));
libraryRouter.get(
  "/products/:productId/download",
  requireAuth,
  asyncHandler(download),
);
libraryRouter.get("/:productId/files", requireAuth, asyncHandler(listFiles));
libraryRouter.get("/:productId", requireAuth, asyncHandler(getProduct));
