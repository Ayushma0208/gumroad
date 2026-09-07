import { z } from "zod";

export const RESERVED_STORE_SLUGS = new Set([
  "me",
  "slug",
  "store-slug",
  "onboard",
  "check",
  "admin",
  "api",
  "login",
  "signup",
  "discover",
  "library",
  "dashboard",
  "analytics",
]);

export const storeSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Use at least 3 characters.")
  .max(32, "Keep it under 32 characters.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers, and hyphens.",
  )
  .refine((slug) => !RESERVED_STORE_SLUGS.has(slug), "That store URL is reserved.");

const emptyToNull = (value: unknown) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  return value;
};

const optionalHttpUrl = z.preprocess(
  emptyToNull,
  z
    .union([
      z.null(),
      z
        .string()
        .trim()
        .max(500)
        .url("Enter a valid URL.")
        .refine(
          (value) => /^https?:\/\//i.test(value),
          "URLs must start with http:// or https://.",
        ),
    ])
    .optional(),
);

export const onboardCreatorSchema = z.object({
  displayName: z.string().trim().min(2, "Enter a display name."),
  storeName: z.string().trim().min(2, "Enter a store name."),
  bio: z
    .string()
    .trim()
    .min(20, "Give people a little more — at least 20 characters.")
    .max(280, "Keep the bio under 280 characters."),
  slug: storeSlugSchema,
  category: z.string().min(1, "Pick a category."),
  avatarUrl: optionalHttpUrl,
});

export type OnboardCreatorInput = z.infer<typeof onboardCreatorSchema>;

export const slugQuerySchema = z.object({
  slug: z.string().trim().min(1),
});

const optionalText = (max: number) =>
  z.preprocess(
    emptyToNull,
    z.union([z.null(), z.string().trim().max(max)]).optional(),
  );

export const updateCreatorProfileSchema = z.object({
  displayName: z.string().trim().min(2, "Enter a display name.").max(80).optional(),
  storeName: z.string().trim().min(2, "Enter a store name.").max(80).optional(),
  slug: storeSlugSchema.optional(),
  bio: z
    .string()
    .trim()
    .min(20, "Give people a little more — at least 20 characters.")
    .max(280, "Keep the bio under 280 characters.")
    .optional(),
  description: optionalText(4000),
  website: optionalHttpUrl,
  instagram: optionalHttpUrl,
  twitter: optionalHttpUrl,
  linkedin: optionalHttpUrl,
  youtube: optionalHttpUrl,
  github: optionalHttpUrl,
});

export type UpdateCreatorProfileInput = z.infer<typeof updateCreatorProfileSchema>;

export const creatorSlugParamSchema = z.object({
  slug: z.string().trim().min(1),
});

export const creatorProductsQuerySchema = z.object({
  sort: z.preprocess(
    (value) => (value === "" || value === undefined || value === null ? undefined : value),
    z
      .enum(["featured", "newest", "price_asc", "price_desc", "price-asc", "price-desc"])
      .optional(),
  ),
  page: z.preprocess((value) => {
    if (value === "" || value === undefined || value === null) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }, z.number().int().min(1).optional()),
  limit: z.preprocess((value) => {
    if (value === "" || value === undefined || value === null) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }, z.number().int().min(1).max(48).optional()),
  featured: z.preprocess((value) => {
    if (value === "true" || value === true) return true;
    if (value === "false" || value === false) return false;
    return undefined;
  }, z.boolean().optional()),
});

export type CreatorProductsQuery = z.infer<typeof creatorProductsQuerySchema>;

export const listCreatorsQuerySchema = z.object({
  limit: z.preprocess((value) => {
    if (value === "" || value === undefined || value === null) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }, z.number().int().min(1).max(24).optional()),
  exclude: z.string().trim().optional(),
});
