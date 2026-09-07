import type { Request, Response } from "express";
import { unauthorized } from "../../utils/app-error";
import { success } from "../../utils/response";
import type { ReviewStatus } from "@prisma/client";
import {
  createReview,
  deleteReview,
  getReviewEligibility,
  getReviewSummary,
  listAdminReviews,
  listCreatorReviews,
  listPublishedReviews,
  moderateReview,
  updateReview,
  upsertReviewReply,
} from "./review.service";
import type {
  AdminReviewsQuery,
  CreateReviewInput,
  CreatorReviewsQuery,
  ListReviewsQuery,
  UpdateReviewInput,
} from "./review.schema";

function actor(req: Request) {
  if (!req.user) throw unauthorized();
  return req.user;
}

export async function summary(req: Request, res: Response) {
  const data = await getReviewSummary(String(req.params.productId));
  res.json(success(data));
}

export async function listForProduct(req: Request, res: Response) {
  const data = await listPublishedReviews(
    String(req.params.productId),
    req.query as ListReviewsQuery,
  );
  res.json(success(data));
}

export async function eligibility(req: Request, res: Response) {
  const data = await getReviewEligibility(req.user?.id, String(req.params.productId));
  res.json(success(data));
}

export async function create(req: Request, res: Response) {
  const user = actor(req);
  const review = await createReview(
    user.id,
    String(req.params.productId),
    req.body as CreateReviewInput,
  );
  res.status(201).json(success({ review }));
}

export async function update(req: Request, res: Response) {
  const user = actor(req);
  const review = await updateReview(
    user.id,
    user.role,
    String(req.params.reviewId),
    req.body as UpdateReviewInput,
  );
  res.json(success({ review }));
}

export async function remove(req: Request, res: Response) {
  const user = actor(req);
  const result = await deleteReview(user.id, user.role, String(req.params.reviewId));
  res.json(success(result));
}

export async function reply(req: Request, res: Response) {
  const user = actor(req);
  const data = await upsertReviewReply(
    user.id,
    user.role,
    String(req.params.reviewId),
    String((req.body as { comment: string }).comment),
  );
  res.json(success({ reply: data }));
}

export async function listMine(req: Request, res: Response) {
  const user = actor(req);
  const data = await listCreatorReviews(user.id, user.role, req.query as CreatorReviewsQuery);
  res.json(success(data));
}

export async function listAdmin(req: Request, res: Response) {
  const data = await listAdminReviews(req.query as AdminReviewsQuery);
  res.json(success(data));
}

export async function moderate(req: Request, res: Response) {
  const review = await moderateReview(
    String(req.params.reviewId),
    (req.body as { status: ReviewStatus }).status,
  );
  res.json(success({ review }));
}

export async function removeAdmin(req: Request, res: Response) {
  const user = actor(req);
  const result = await deleteReview(user.id, "ADMIN", String(req.params.reviewId));
  res.json(success(result));
}
