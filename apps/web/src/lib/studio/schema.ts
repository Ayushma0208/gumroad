import { z } from "zod";

const kindSchema = z.enum(["download", "course", "template", "bundle"]);
const pricingSchema = z.enum(["free", "fixed", "pwyw"]);
const currencySchema = z.enum(["USD", "INR"]);

export const productDraftSchema = z
  .object({
    kind: kindSchema,
    title: z.string().trim().min(3, "Give the product a title."),
    shortDescription: z
      .string()
      .trim()
      .min(12, "Write a short pitch buyers will see first.")
      .max(140, "Keep the pitch under 140 characters."),
    description: z
      .string()
      .trim()
      .min(40, "Add a fuller description — at least 40 characters."),
    categorySlug: z.string().min(1, "Pick a category."),
    coverUrl: z.string(),
    gallery: z.array(z.string()),
    files: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        sizeBytes: z.number(),
        mimeType: z.string(),
      }),
    ),
    pricingModel: pricingSchema,
    currency: currencySchema,
    priceCents: z.number().int().min(0),
    suggestedPriceCents: z.number().int().min(0),
    minPriceCents: z.number().int().min(0),
  })
  .superRefine((value, ctx) => {
    if (value.pricingModel === "fixed" && value.priceCents < 100) {
      ctx.addIssue({
        code: "custom",
        path: ["priceCents"],
        message: "Set a price of at least $1.00.",
      });
    }
    if (value.pricingModel === "pwyw") {
      if (value.suggestedPriceCents < value.minPriceCents) {
        ctx.addIssue({
          code: "custom",
          path: ["suggestedPriceCents"],
          message: "Suggested price should be at or above the minimum.",
        });
      }
    }
  });

export const studioSettingsSchema = z.object({
  displayName: z.string().trim().min(2, "Enter a display name."),
  bio: z
    .string()
    .trim()
    .min(20, "Give people a little more — at least 20 characters.")
    .max(280, "Keep the bio under 280 characters."),
  avatarUrl: z.string(),
  storeName: z.string().trim().min(2, "Enter a store name."),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Use at least 3 characters.")
    .max(32, "Keep it under 32 characters.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and hyphens.",
    ),
  storeDescription: z
    .string()
    .trim()
    .min(20, "Describe the store in at least 20 characters.")
    .max(400, "Keep it under 400 characters."),
  notifySales: z.boolean(),
  notifyProductUpdates: z.boolean(),
  notifyWeeklyDigest: z.boolean(),
});

export type ProductDraftValues = z.infer<typeof productDraftSchema>;
export type StudioSettingsValues = z.infer<typeof studioSettingsSchema>;

export const emptyProductDraft: ProductDraftValues = {
  kind: "download",
  title: "",
  shortDescription: "",
  description: "",
  categorySlug: "design",
  coverUrl: "",
  gallery: [],
  files: [],
  pricingModel: "fixed",
  currency: "USD",
  priceCents: 2900,
  suggestedPriceCents: 1900,
  minPriceCents: 0,
};
