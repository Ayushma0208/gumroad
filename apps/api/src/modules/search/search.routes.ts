import { Router } from "express";
import {
  validateQuery,
} from "../../middleware/validation.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { search, suggest } from "./search.controller";
import { searchQuerySchema, suggestQuerySchema } from "./search.schema";

export const searchRouter = Router();

searchRouter.get("/", validateQuery(searchQuerySchema), asyncHandler(search));
searchRouter.get(
  "/suggest",
  validateQuery(suggestQuerySchema),
  asyncHandler(suggest),
);
