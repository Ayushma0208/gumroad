import { z } from "zod";

export const onboardCreatorSchema = z.object({
  displayName: z.string().trim().min(2, "Enter a display name."),
  storeName: z.string().trim().min(2, "Enter a store name."),
  bio: z
    .string()
    .trim()
    .min(20, "Give people a little more — at least 20 characters.")
    .max(280, "Keep the bio under 280 characters."),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(32)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens."),
  category: z.string().min(1, "Pick a category."),
  avatarUrl: z.string().optional(),
});

export type OnboardCreatorInput = z.infer<typeof onboardCreatorSchema>;

export const slugQuerySchema = z.object({
  slug: z.string().trim().min(1),
});
