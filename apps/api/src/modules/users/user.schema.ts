import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter your name.")
    .max(80, "Keep your name under 80 characters."),
});

export const closeAccountSchema = z.object({
  password: z.string().min(1, "Enter your password to confirm."),
  confirm: z.boolean().refine((value) => value === true, {
    message: "Confirm that you want to close this account.",
  }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CloseAccountInput = z.infer<typeof closeAccountSchema>;
