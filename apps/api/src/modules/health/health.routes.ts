import { Router } from "express";
import { prisma } from "../../config/database";
import { success } from "../../utils/response";

export const healthRouter = Router();

/** Liveness — process is up. */
healthRouter.get("/", (_req, res) => {
  res.json(
    success({
      status: "ok",
      service: "lumen-api",
      timestamp: new Date().toISOString(),
    }),
  );
});

/** Readiness — database reachable. Does not expose connection details. */
healthRouter.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json(
      success({
        status: "ready",
        database: "up",
        timestamp: new Date().toISOString(),
      }),
    );
  } catch {
    res.status(503).json(
      success({
        status: "not_ready",
        database: "down",
        timestamp: new Date().toISOString(),
      }),
    );
  }
});
