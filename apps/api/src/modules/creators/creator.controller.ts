import type { Request, Response } from "express";
import { unauthorized } from "../../utils/app-error";
import { success } from "../../utils/response";
import {
  getMyCreatorProfile,
  getPublicCreatorBySlug,
  isSlugAvailable,
  listPublicCreatorProducts,
  listPublicCreators,
  onboardCreator,
  updateMyCreatorProfile,
} from "./creator.service";
import type {
  CreatorProductsQuery,
  OnboardCreatorInput,
  UpdateCreatorProfileInput,
} from "./creator.schema";

export async function onboard(req: Request, res: Response) {
  if (!req.user) throw unauthorized();
  const user = await onboardCreator(req.user.id, req.body as OnboardCreatorInput);
  res.status(201).json(success({ user }));
}

export async function checkSlug(req: Request, res: Response) {
  const slug = String(req.query.slug ?? "");
  const available = await isSlugAvailable(slug, req.user?.id);
  res.json(success({ slug, available }));
}

export async function getBySlug(req: Request, res: Response) {
  const result = await getPublicCreatorBySlug(String(req.params.slug));
  res.json(success(result));
}

export async function listCreators(req: Request, res: Response) {
  const result = await listPublicCreators({
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    exclude: typeof req.query.exclude === "string" ? req.query.exclude : undefined,
  });
  res.json(success(result));
}

export async function listProducts(req: Request, res: Response) {
  const result = await listPublicCreatorProducts(
    String(req.params.slug),
    req.query as CreatorProductsQuery,
  );
  res.json(success(result));
}

export async function getMe(req: Request, res: Response) {
  if (!req.user) throw unauthorized();
  const result = await getMyCreatorProfile(req.user.id);
  res.json(success(result));
}

export async function updateMe(req: Request, res: Response) {
  if (!req.user) throw unauthorized();
  const result = await updateMyCreatorProfile(
    req.user.id,
    req.body as UpdateCreatorProfileInput,
  );
  res.json(success(result));
}
