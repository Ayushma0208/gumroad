import multer from "multer";
import { env } from "../../config/env";
import { badRequest } from "../../utils/app-error";
import type { RequestHandler } from "express";

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_PRODUCT_IMAGE_SIZE_MB * 1024 * 1024, files: 1 },
});

const fileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_PRODUCT_FILE_SIZE_MB * 1024 * 1024, files: 1 },
});

function wrap(mw: RequestHandler): RequestHandler {
  return (req, res, next) => {
    mw(req, res, (error: unknown) => {
      if (error && typeof error === "object" && "code" in error) {
        const code = (error as { code: string }).code;
        if (code === "LIMIT_FILE_SIZE") {
          next(badRequest("That file is larger than the allowed size."));
          return;
        }
      }
      next(error as Error);
    });
  };
}

export const uploadProductImageMiddleware = wrap(imageUpload.single("file"));
export const uploadProductFileMiddleware = wrap(fileUpload.single("file"));
export const uploadAvatarMiddleware = wrap(imageUpload.single("file"));
