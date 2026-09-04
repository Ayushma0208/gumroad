import { Router } from "express";
import { success } from "../../utils/response";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json(
    success({
      status: "healthy",
      service: "creator-marketplace-api",
      timestamp: new Date().toISOString(),
    }),
  );
});
