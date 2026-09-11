import { z } from "zod";

const hexColor = z
  .string()
  .trim()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Use a hex color like #1A1A1A.");

export const fontTokenSchema = z.enum([
  "default",
  "inter",
  "space-grotesk",
  "poppins",
  "montserrat",
  "serif",
  "playfair",
  "mono",
]);

export const pageLayoutSchema = z.enum([
  "classic",
  "hero-card",
  "editorial",
  "split",
  "minimal",
  "poster",
  "gallery",
  "launch",
  "market",
]);

export const checkoutLayoutSchema = z.enum([
  "split",
  "flipped",
  "focus",
  "banner",
  "card",
  "hero",
  "sidebar",
  "gallery",
  "sheet",
  "frame",
]);

export const themeTokenSchema = z.enum(["light", "dark"]);
export const cornersTokenSchema = z.enum(["sharp", "soft", "round"]);
export const bordersTokenSchema = z.enum(["thin", "medium", "bold"]);

const styleColorsSchema = z.object({
  background: hexColor,
  panel: hexColor,
  border: hexColor,
  text: hexColor,
  accent: hexColor,
  accentText: hexColor,
});

const styleTokensSchema = z.object({
  headingFont: fontTokenSchema,
  bodyFont: fontTokenSchema,
  theme: themeTokenSchema,
  corners: cornersTokenSchema,
  borders: bordersTokenSchema,
  colors: styleColorsSchema,
});

export const pageStyleSchema = styleTokensSchema.extend({
  layout: pageLayoutSchema,
});

export const checkoutStyleSchema = styleTokensSchema.extend({
  layout: checkoutLayoutSchema,
});

export const pageTemplateIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase template id.");
