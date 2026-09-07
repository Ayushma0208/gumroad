import { z } from "zod";

export const reviewFormSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, "Choose a rating from 1 to 5.")
    .max(5, "Choose a rating from 1 to 5."),
  title: z.string().trim().min(1, "Add a title.").max(120, "Keep the title under 120 characters."),
  comment: z
    .string()
    .trim()
    .min(10, "Write a little more — at least 10 characters.")
    .max(5000, "Keep the review under 5,000 characters."),
});

export type ReviewFormValues = z.infer<typeof reviewFormSchema>;
