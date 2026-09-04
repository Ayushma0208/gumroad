import type { RequestHandler } from "express";
import { notFound } from "../utils/app-error";

export const notFoundMiddleware: RequestHandler = (_req, _res, next) => {
  next(notFound("Route not found"));
};
