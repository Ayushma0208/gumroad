export const FONT_TOKENS = [
  "default",
  "inter",
  "space-grotesk",
  "poppins",
  "montserrat",
  "serif",
  "playfair",
  "mono",
] as const;

export const PAGE_LAYOUTS = [
  "classic",
  "hero-card",
  "editorial",
  "split",
  "minimal",
  "poster",
  "gallery",
  "launch",
  "market",
] as const;

export const CHECKOUT_LAYOUTS = [
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
] as const;

export const THEME_TOKENS = ["light", "dark"] as const;
export const CORNER_TOKENS = ["sharp", "soft", "round"] as const;
export const BORDER_TOKENS = ["thin", "medium", "bold"] as const;

export type FontToken = (typeof FONT_TOKENS)[number];
export type PageLayoutId = (typeof PAGE_LAYOUTS)[number];
export type CheckoutLayoutId = (typeof CHECKOUT_LAYOUTS)[number];
export type ThemeToken = (typeof THEME_TOKENS)[number];
export type CornerToken = (typeof CORNER_TOKENS)[number];
export type BorderToken = (typeof BORDER_TOKENS)[number];

export type StyleColors = {
  background: string;
  panel: string;
  border: string;
  text: string;
  accent: string;
  accentText: string;
};

export type PageStyle = {
  layout: PageLayoutId;
  headingFont: FontToken;
  bodyFont: FontToken;
  theme: ThemeToken;
  corners: CornerToken;
  borders: BorderToken;
  colors: StyleColors;
};

export type CheckoutStyle = Omit<PageStyle, "layout"> & {
  layout: CheckoutLayoutId;
};

export const FONT_LABELS: Record<FontToken, string> = {
  default: "Default",
  inter: "Inter",
  "space-grotesk": "Space Grotesk",
  poppins: "Poppins",
  montserrat: "Montserrat",
  serif: "Serif",
  playfair: "Playfair",
  mono: "Mono",
};

export const PAGE_LAYOUT_LABELS: Record<PageLayoutId, string> = {
  classic: "Classic",
  "hero-card": "Hero card",
  editorial: "Editorial",
  split: "Split",
  minimal: "Minimal",
  poster: "Poster",
  gallery: "Gallery",
  launch: "Launch",
  market: "Market",
};

export const CHECKOUT_LAYOUT_LABELS: Record<CheckoutLayoutId, string> = {
  split: "Split",
  flipped: "Flipped",
  focus: "Focus",
  banner: "Banner",
  card: "Card",
  hero: "Hero",
  sidebar: "Sidebar",
  gallery: "Gallery",
  sheet: "Sheet",
  frame: "Frame",
};

export const FONT_STACKS: Record<FontToken, string> = {
  default: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
  inter: 'Inter, ui-sans-serif, system-ui, sans-serif',
  "space-grotesk": '"Space Grotesk", ui-sans-serif, system-ui, sans-serif',
  poppins: "Poppins, ui-sans-serif, system-ui, sans-serif",
  montserrat: "Montserrat, ui-sans-serif, system-ui, sans-serif",
  serif: 'var(--font-instrument), Georgia, "Times New Roman", serif',
  playfair: '"Playfair Display", Georgia, serif',
  mono: 'var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace',
};

export const STUDIO_FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Montserrat:wght@500;700&family=Playfair+Display:ital,wght@0,600;1,700&family=Poppins:wght@400;600;700&family=Space+Grotesk:wght@500;700&display=swap";

export const DEFAULT_PAGE_STYLE: PageStyle = {
  layout: "classic",
  headingFont: "default",
  bodyFont: "default",
  theme: "light",
  corners: "soft",
  borders: "thin",
  colors: {
    background: "#FFFFFF",
    panel: "#F4F4F8",
    border: "#EEEEEE",
    text: "#1A1A1A",
    accent: "#111111",
    accentText: "#FFFFFF",
  },
};

export const DEFAULT_CHECKOUT_STYLE: CheckoutStyle = {
  layout: "split",
  headingFont: "default",
  bodyFont: "default",
  theme: "light",
  corners: "soft",
  borders: "thin",
  colors: {
    background: "#FFFFFF",
    panel: "#F4F4F8",
    border: "#EEEEEE",
    text: "#1A1A1A",
    accent: "#635BFF",
    accentText: "#FFFFFF",
  },
};

export function cornerRadius(corners: CornerToken) {
  if (corners === "sharp") return "2px";
  if (corners === "round") return "24px";
  return "12px";
}

export function borderWidth(borders: BorderToken) {
  if (borders === "medium") return "2px";
  if (borders === "bold") return "3px";
  return "1px";
}

export function isStyleColors(value: unknown): value is StyleColors {
  if (!value || typeof value !== "object") return false;
  const colors = value as Record<string, unknown>;
  return (
    typeof colors.background === "string" &&
    typeof colors.panel === "string" &&
    typeof colors.border === "string" &&
    typeof colors.text === "string" &&
    typeof colors.accent === "string" &&
    typeof colors.accentText === "string"
  );
}

/** True only when the seller saved a template — not an empty Prisma default. */
export function hasCustomPageStyle(value: unknown): value is PageStyle {
  if (!value || typeof value !== "object") return false;
  const raw = value as Record<string, unknown>;
  return typeof raw.layout === "string" && isStyleColors(raw.colors);
}

export function parsePageStyle(value: unknown): PageStyle {
  if (!value || typeof value !== "object") return DEFAULT_PAGE_STYLE;
  const raw = value as Partial<PageStyle>;
  return {
    layout: PAGE_LAYOUTS.includes(raw.layout as PageLayoutId)
      ? (raw.layout as PageLayoutId)
      : DEFAULT_PAGE_STYLE.layout,
    headingFont: FONT_TOKENS.includes(raw.headingFont as FontToken)
      ? (raw.headingFont as FontToken)
      : DEFAULT_PAGE_STYLE.headingFont,
    bodyFont: FONT_TOKENS.includes(raw.bodyFont as FontToken)
      ? (raw.bodyFont as FontToken)
      : DEFAULT_PAGE_STYLE.bodyFont,
    theme: THEME_TOKENS.includes(raw.theme as ThemeToken)
      ? (raw.theme as ThemeToken)
      : DEFAULT_PAGE_STYLE.theme,
    corners: CORNER_TOKENS.includes(raw.corners as CornerToken)
      ? (raw.corners as CornerToken)
      : DEFAULT_PAGE_STYLE.corners,
    borders: BORDER_TOKENS.includes(raw.borders as BorderToken)
      ? (raw.borders as BorderToken)
      : DEFAULT_PAGE_STYLE.borders,
    colors: isStyleColors(raw.colors) ? raw.colors : DEFAULT_PAGE_STYLE.colors,
  };
}

export function parseCheckoutStyle(value: unknown): CheckoutStyle {
  const page = parsePageStyle(value);
  const layout =
    value &&
    typeof value === "object" &&
    CHECKOUT_LAYOUTS.includes(
      (value as { layout?: CheckoutLayoutId }).layout as CheckoutLayoutId,
    )
      ? ((value as { layout: CheckoutLayoutId }).layout)
      : DEFAULT_CHECKOUT_STYLE.layout;
  return { ...page, layout };
}

export function checkoutStyleFromPage(page: PageStyle): CheckoutStyle {
  return {
    ...page,
    layout: DEFAULT_CHECKOUT_STYLE.layout,
  };
}
