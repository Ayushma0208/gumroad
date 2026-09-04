import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(48)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const categoryFields = {
  name: z.string().trim().min(2).max(80).optional(),
  label: z.string().trim().min(2).max(80).optional(),
  slug: slugSchema.optional(),
  description: z.string().trim().min(8).max(400),
  image: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  icon: z.string().min(1).optional(),
  sortOrder: z.number().int().optional(),
};

export const createCategorySchema = z.object(categoryFields).superRefine((value, ctx) => {
  if (!value.name && !value.label) {
    ctx.addIssue({ code: "custom", path: ["name"], message: "Name is required." });
  }
});

export const updateCategorySchema = z.object({
  name: categoryFields.name,
  label: categoryFields.label,
  slug: categoryFields.slug,
  description: z.string().trim().min(8).max(400).optional(),
  image: categoryFields.image,
  imageUrl: categoryFields.imageUrl,
  icon: categoryFields.icon,
  sortOrder: categoryFields.sortOrder,
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
