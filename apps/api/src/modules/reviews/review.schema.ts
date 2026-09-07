import { ReviewStatus } from "@prisma/client";
import { z } from "zod";

const emptyToUndefined = (value: unknown) =>
  value === "" || value === undefined || value === null ? undefined : value;

const optionalInt = (min: number, max?: number) =>
  z.preprocess((value) => {
    if (emptyToUndefined(value) === undefined) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }, z.number().int().min(min).max(max ?? Number.MAX_SAFE_INTEGER).optional());

export const reviewRatingSchema = z
  .number()
  .int("Ratings are whole stars only.")
  .min(1, "Choose a rating from 1 to 5.")
  .max(5, "Choose a rating from 1 to 5.");

export const createReviewSchema = z.object({
  rating: reviewRatingSchema,
  title: z.string().trim().min(1, "Add a title.").max(120, "Keep the title under 120 characters."),
  comment: z
    .string()
    .trim()
    .min(10, "Write a little more — at least 10 characters.")
    .max(5000, "Keep the review under 5,000 characters."),
});

export const updateReviewSchema = createReviewSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "Nothing to update." },
);

export const reviewReplySchema = z.object({
  comment: z
    .string()
    .trim()
    .min(2, "Write a short reply.")
    .max(2000, "Keep the reply under 2,000 characters."),
});

export const productIdParamSchema = z.object({
  productId: z.string().min(1),
});

export const reviewIdParamSchema = z.object({
  reviewId: z.string().min(1),
});

export const listReviewsQuerySchema = z.object({
  sort: z.preprocess(
    emptyToUndefined,
    z.enum(["newest", "oldest", "highest", "lowest"]).optional(),
  ),
  page: optionalInt(1),
  limit: optionalInt(1, 20),
});

export const creatorReviewsQuerySchema = z.object({
  rating: z.preprocess((value) => {
    if (emptyToUndefined(value) === undefined) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }, z.number().int().min(1).max(5).optional()),
  sort: z.preprocess(emptyToUndefined, z.enum(["newest", "oldest"]).optional()),
  page: optionalInt(1),
  limit: optionalInt(1, 48),
});

export const adminReviewsQuerySchema = creatorReviewsQuerySchema.extend({
  status: z.preprocess(emptyToUndefined, z.nativeEnum(ReviewStatus).optional()),
});

export const moderateReviewSchema = z.object({
  status: z.nativeEnum(ReviewStatus),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;
export type CreatorReviewsQuery = z.infer<typeof creatorReviewsQuerySchema>;
export type AdminReviewsQuery = z.infer<typeof adminReviewsQuerySchema>;
