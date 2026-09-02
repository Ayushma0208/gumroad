import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Enter your name."),
  email: z.email("Enter a valid email."),
  password: z.string().min(8, "Use at least 8 characters."),
  role: z.enum(["CUSTOMER", "CREATOR"]),
});

export const loginSchema = z.object({
  email: z.email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});

export type SignupValues = z.infer<typeof signupSchema>;
export type LoginValues = z.infer<typeof loginSchema>;
