import type { Request, Response } from "express";
import { unauthorized } from "../../utils/app-error";
import { success } from "../../utils/response";
import { isSlugAvailable, onboardCreator } from "./creator.service";
import type { OnboardCreatorInput } from "./creator.schema";

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
