import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your name."),
    email: z.email("Enter a valid email."),
    password: z
      .string()
      .min(8, "Use at least 8 characters.")
      .regex(/[A-Za-z]/, "Include a letter.")
      .regex(/[0-9]/, "Include a number."),
    confirmPassword: z.string().min(1, "Confirm your password."),
    terms: z.boolean().refine((value) => value, {
      message: "Please accept the terms to continue.",
    }),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email."),
});

export const creatorProfileSchema = z.object({
  displayName: z.string().trim().min(2, "Enter a display name."),
  storeName: z.string().trim().min(2, "Enter a store name."),
  bio: z
    .string()
    .trim()
    .min(20, "Give people a little more — at least 20 characters.")
    .max(280, "Keep the bio under 280 characters."),
});

export const storeSetupSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Use at least 3 characters.")
    .max(32, "Keep it under 32 characters.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens."),
  category: z.string().min(1, "Pick a category."),
  avatarUrl: z.string().optional(),
});

export const becomeCreatorSchema = creatorProfileSchema.merge(storeSetupSchema);

export type LoginValues = z.infer<typeof loginSchema>;
export type SignupValues = z.infer<typeof signupSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type CreatorProfileValues = z.infer<typeof creatorProfileSchema>;
export type StoreSetupValues = z.infer<typeof storeSetupSchema>;
export type BecomeCreatorValues = z.infer<typeof becomeCreatorSchema>;
