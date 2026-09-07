import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CLIENT_URL: z.string().url(),
  /// Public web app URL for email links. Falls back to CLIENT_URL when unset.
  APP_URL: z.string().url().optional(),
  COOKIE_NAME: z.string().default("lumen_session"),
  /**
   * Cookie SameSite. Prefer `lax` with same-origin Next proxy.
   * Use `none` only for true cross-site API hosting (requires Secure + CSRF header).
   */
  COOKIE_SAME_SITE: z.enum(["lax", "none", "strict"]).default("lax"),
  /// Display-capable From header, e.g. `Lumen <noreply@example.com>` or a bare email.
  EMAIL_FROM: z.string().min(3).optional(),
  EMAIL_PROVIDER: z.enum(["console", "resend"]).default("console"),
  EMAIL_API_KEY: z.string().optional(),
  EMAIL_WORKER_INTERVAL_MS: z.coerce.number().int().positive().default(15000),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  MAX_PRODUCT_FILE_SIZE_MB: z.coerce.number().int().positive().default(100),
  MAX_PRODUCT_IMAGE_SIZE_MB: z.coerce.number().int().positive().default(10),
  CLOUDINARY_DOWNLOAD_TTL_SECONDS: z.coerce.number().int().positive().default(120),
  /**
   * Platform commission in basis points (100 = 1%). Default 0 — business rate not yet set.
   * Snapshot onto CreatorEarning.platformFeeBps when earnings are posted.
   */
  PLATFORM_FEE_BPS: z.coerce.number().int().min(0).max(10_000).default(0),
  /**
   * Hours before a PENDING earning becomes AVAILABLE. Default 168 (7 days).
   * Configurable assumption — not a confirmed finance policy.
   */
  PAYOUT_HOLDING_PERIOD_HOURS: z.coerce.number().int().min(0).max(8760).default(168),
  /**
   * Minimum payout request in minor units of the wallet currency. Default 1000.
   * Configurable assumption — not a confirmed finance policy.
   */
  MIN_PAYOUT_AMOUNT_CENTS: z.coerce.number().int().min(0).default(1000),
}).superRefine((value, ctx) => {
  if (value.NODE_ENV !== "production") return;
  if (!value.RAZORPAY_KEY_ID) {
    ctx.addIssue({ code: "custom", path: ["RAZORPAY_KEY_ID"], message: "Required in production" });
  }
  if (!value.RAZORPAY_KEY_SECRET) {
    ctx.addIssue({ code: "custom", path: ["RAZORPAY_KEY_SECRET"], message: "Required in production" });
  }
  if (!value.RAZORPAY_WEBHOOK_SECRET) {
    ctx.addIssue({
      code: "custom",
      path: ["RAZORPAY_WEBHOOK_SECRET"],
      message: "Required in production",
    });
  }
  if (!value.CLOUDINARY_CLOUD_NAME) {
    ctx.addIssue({ code: "custom", path: ["CLOUDINARY_CLOUD_NAME"], message: "Required in production" });
  }
  if (!value.CLOUDINARY_API_KEY) {
    ctx.addIssue({ code: "custom", path: ["CLOUDINARY_API_KEY"], message: "Required in production" });
  }
  if (!value.CLOUDINARY_API_SECRET) {
    ctx.addIssue({ code: "custom", path: ["CLOUDINARY_API_SECRET"], message: "Required in production" });
  }
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function loadEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment: ${details}`);
  }
  cached = parsed.data;
  return cached;
}

export function resetEnvCache() {
  cached = null;
}

export const env = new Proxy({} as Env, {
  get(_target, prop) {
    return loadEnv()[prop as keyof Env];
  },
});
