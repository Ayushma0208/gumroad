import {
  checkoutStyleFromPage,
  DEFAULT_PAGE_STYLE,
  type CheckoutStyle,
  type FontToken,
  type PageLayoutId,
  type PageStyle,
  type StyleColors,
  type ThemeToken,
} from "@/lib/studio/page-style";

export type TemplateGroup = "basic" | "vivid" | "dark" | "natural";

export type PageTemplate = {
  id: string;
  name: string;
  group: TemplateGroup;
  style: PageStyle;
};

export const TEMPLATE_GROUP_LABELS: Record<TemplateGroup, string> = {
  basic: "Basic",
  vivid: "Vivid",
  dark: "Dark",
  natural: "Natural",
};

function palette(
  background: string,
  panel: string,
  border: string,
  text: string,
  accent: string,
  accentText: string,
): StyleColors {
  return { background, panel, border, text, accent, accentText };
}

function template(
  id: string,
  name: string,
  group: TemplateGroup,
  layout: PageLayoutId,
  theme: ThemeToken,
  colors: StyleColors,
  fonts: { heading?: FontToken; body?: FontToken } = {},
  extras: Partial<Pick<PageStyle, "corners" | "borders">> = {},
): PageTemplate {
  return {
    id,
    name,
    group,
    style: {
      layout,
      theme,
      headingFont: fonts.heading ?? "default",
      bodyFont: fonts.body ?? "default",
      corners: extras.corners ?? "soft",
      borders: extras.borders ?? "thin",
      colors,
    },
  };
}

export const PAGE_TEMPLATES: PageTemplate[] = [
  template("classic", "Classic", "basic", "classic", "light", palette("#FFFFFF", "#F4F4F8", "#EEEEEE", "#1A1A1A", "#111111", "#FFFFFF")),
  template("minimal-mono", "Minimal Mono", "basic", "classic", "dark", palette("#101826", "#182235", "#2A3A52", "#E8EEF7", "#E8EEF7", "#101826"), { heading: "mono", body: "mono" }, { corners: "sharp", borders: "thin" }),
  template("warm-cream", "Warm Cream", "basic", "classic", "light", palette("#F6EFE6", "#FFF8F0", "#E4D5C4", "#2A2218", "#1A1A1A", "#FFF8F0"), { heading: "serif" }),
  template("lagoon", "Lagoon", "basic", "classic", "light", palette("#E7F3F4", "#F7FBFC", "#C5DEE1", "#16363C", "#1F7A86", "#FFFFFF")),
  template("cocoa", "Cocoa", "basic", "classic", "dark", palette("#2A1F18", "#3A2C22", "#5A4638", "#F3E6D8", "#C4A484", "#2A1F18"), { heading: "serif" }),
  template("royal", "Royal", "basic", "hero-card", "dark", palette("#1A1028", "#2A1A44", "#4A3480", "#F4EEFF", "#7C5CFF", "#FFFFFF"), { heading: "playfair" }),

  template("engine-blurple", "Engine Blurple", "vivid", "split", "dark", palette("#1B1C3A", "#2B2D5C", "#5865F2", "#F4F5FF", "#5865F2", "#FFFFFF"), { heading: "space-grotesk" }),
  template("candy", "Candy", "vivid", "gallery", "light", palette("#FFF0F6", "#FFFFFF", "#FFC2D7", "#4A1028", "#FF4D8D", "#FFFFFF"), { heading: "poppins" }, { corners: "round" }),
  template("crimson", "Crimson", "vivid", "market", "light", palette("#FFF7F7", "#FFFFFF", "#F0C4C4", "#3A1010", "#C41E3A", "#FFFFFF"), { heading: "montserrat" }, { borders: "bold", corners: "sharp" }),
  template("bubblegum", "Bubblegum", "vivid", "launch", "light", palette("#FFF5FB", "#FFFFFF", "#F7C6E0", "#4A1840", "#FF8AB7", "#4A1840"), { heading: "poppins" }, { corners: "round" }),
  template("citrus", "Citrus", "vivid", "poster", "light", palette("#FFFCEB", "#FFFFFF", "#F0E08A", "#2A2A10", "#F5C518", "#1A1A1A"), { heading: "space-grotesk" }),
  template("blush", "Blush", "vivid", "gallery", "light", palette("#FDF2F4", "#FFFFFF", "#F3C9D2", "#4A2430", "#E89AA8", "#4A2430"), { heading: "serif" }, { corners: "round" }),
  template("punch", "Punch", "vivid", "poster", "light", palette("#FFF5F2", "#FFFFFF", "#F5B8A8", "#3A120C", "#E23D28", "#FFFFFF"), { heading: "montserrat" }, { corners: "sharp", borders: "bold" }),
  template("neon", "Neon", "vivid", "poster", "dark", palette("#0B0F14", "#121820", "#2AFF9A", "#E8FFF4", "#2AFF9A", "#0B0F14"), { heading: "space-grotesk", body: "mono" }, { corners: "sharp" }),
  template("lemonade", "Lemonade", "vivid", "launch", "light", palette("#FFFBEA", "#FFFFFF", "#F3E08A", "#2C2A10", "#F2C14E", "#1A1A1A"), { heading: "poppins" }, { corners: "round" }),
  template("sunset", "Sunset", "vivid", "poster", "dark", palette("#2A1420", "#3C1C28", "#F08A5A", "#FFE8DC", "#F08A5A", "#2A1420"), { heading: "playfair" }),
  template("wine", "Wine", "vivid", "hero-card", "dark", palette("#2A1018", "#3C1824", "#8A3048", "#F8E8EE", "#A33C58", "#FFFFFF"), { heading: "playfair" }),
  template("coral", "Coral", "vivid", "launch", "light", palette("#FFF4F0", "#FFFFFF", "#F5C4B4", "#3A2018", "#E07A5F", "#FFFFFF"), { heading: "poppins" }),
  template("peach", "Peach", "vivid", "gallery", "light", palette("#FFF3EA", "#FFFFFF", "#F3CDB4", "#4A2C20", "#F0A07A", "#3A2018"), { heading: "serif" }),
  template("ember", "Ember", "vivid", "market", "dark", palette("#1C1410", "#2A1E18", "#E07A3A", "#F8E8DC", "#E07A3A", "#1C1410"), { heading: "montserrat" }),

  template("noir", "Noir", "dark", "minimal", "dark", palette("#0D0D0F", "#16161A", "#2C2C32", "#F4F4F5", "#F4F4F5", "#0D0D0F"), { heading: "default" }, { corners: "sharp" }),
  template("midnight-gold", "Midnight Gold", "dark", "hero-card", "dark", palette("#0E1628", "#172038", "#C9A227", "#F7F0D8", "#C9A227", "#0E1628"), { heading: "playfair" }),
  template("velvet", "Velvet", "dark", "hero-card", "dark", palette("#2A1028", "#3C1838", "#8A4A80", "#F8E8F4", "#C47BB8", "#2A1028"), { heading: "playfair" }),
  template("terminal", "Terminal", "dark", "market", "dark", palette("#07140C", "#0E1E14", "#1F6A3A", "#C8F5D4", "#3DDC84", "#07140C"), { heading: "mono", body: "mono" }, { corners: "sharp" }),
  template("ink", "Ink", "dark", "minimal", "dark", palette("#09090B", "#141416", "#2A2A2E", "#FAFAFA", "#FAFAFA", "#09090B"), { heading: "serif" }, { corners: "sharp", borders: "bold" }),
  template("violet-noir", "Violet Noir", "dark", "hero-card", "dark", palette("#12081C", "#1E1030", "#6A3CBC", "#F0E8FF", "#A078F0", "#12081C"), { heading: "space-grotesk" }),
  template("charcoal", "Charcoal", "dark", "minimal", "dark", palette("#1C1C1C", "#2A2A2A", "#4A4A4A", "#F0F0F0", "#F0F0F0", "#1C1C1C"), { heading: "montserrat" }),
  template("forest", "Forest", "dark", "market", "dark", palette("#102018", "#183024", "#2A5A40", "#E4F4EA", "#4A9A6A", "#102018"), { heading: "serif" }),
  template("ocean", "Ocean", "dark", "split", "dark", palette("#0C1C28", "#142838", "#2A6080", "#E4F4FA", "#3A90C0", "#0C1C28"), { heading: "space-grotesk" }),
  template("denim", "Denim", "dark", "split", "dark", palette("#1A2838", "#243448", "#3A5A78", "#E8F0F8", "#6A8AB0", "#1A2838"), { heading: "montserrat" }),
  template("slate", "Slate", "dark", "split", "dark", palette("#1C2228", "#2A323A", "#4A5864", "#E8EEF2", "#8AA0B0", "#1C2228"), { heading: "inter" }),

  template("canvas", "Canvas", "natural", "classic", "light", palette("#F4F0E8", "#FBF8F2", "#DDD4C4", "#2C281E", "#3A3428", "#FBF8F2"), { heading: "serif" }, { corners: "sharp" }),
  template("frost", "Frost", "natural", "classic", "light", palette("#F2F6FA", "#FFFFFF", "#D0DCE8", "#1C2A38", "#5A7A98", "#FFFFFF"), { heading: "inter" }),
  template("sage", "Sage", "natural", "classic", "light", palette("#EEF3EC", "#F8FBF6", "#C8D8C4", "#243028", "#5A7A62", "#FFFFFF"), { heading: "serif" }),
  template("dune", "Dune", "natural", "market", "light", palette("#F3E6D4", "#FBF3E8", "#E0C8A8", "#3A2C1C", "#A07848", "#FFF8F0"), { heading: "serif" }),
  template("paper", "Paper", "natural", "classic", "light", palette("#F7F3EA", "#FFFCF6", "#E4DCC8", "#2A261C", "#1A1A1A", "#FFFCF6"), { heading: "serif" }, { corners: "sharp" }),
  template("paper-pack", "Paper Pack", "natural", "editorial", "light", palette("#EFE6D6", "#F8F1E4", "#D4C4A8", "#2C2418", "#4A3C28", "#F8F1E4"), { heading: "serif", body: "serif" }, { corners: "sharp" }),
  template("mint", "Mint", "natural", "classic", "light", palette("#E8F6EE", "#F6FCF8", "#B8DEC8", "#1C3428", "#3A9A6A", "#FFFFFF"), { heading: "inter" }),
  template("sky", "Sky", "natural", "launch", "light", palette("#EAF4FC", "#F7FBFE", "#B8D4EC", "#183048", "#3A7AB8", "#FFFFFF"), { heading: "poppins" }),
  template("coach", "Coach", "natural", "editorial", "light", palette("#F4EDE4", "#FBF6F0", "#D8C4B0", "#3A2818", "#8A5A38", "#FBF6F0"), { heading: "playfair" }),
  template("studio", "Studio", "natural", "editorial", "light", palette("#F2F2F0", "#FFFFFF", "#D8D8D4", "#222220", "#222220", "#FFFFFF"), { heading: "inter" }, { corners: "sharp" }),
  template("moose-and-gold", "Moose and Gold", "natural", "market", "dark", palette("#241C14", "#32281C", "#C9A227", "#F7EFD4", "#C9A227", "#241C14"), { heading: "playfair" }),
  template("terracotta", "Terracotta", "natural", "market", "light", palette("#F6E8DC", "#FBF3EA", "#E0C0A4", "#3A2418", "#C46A3A", "#FFF8F0"), { heading: "serif" }),
  template("olive", "Olive", "natural", "market", "light", palette("#EEF0E4", "#F7F8F0", "#C8CCB0", "#2A2C1C", "#6A7040", "#F7F8F0"), { heading: "serif" }),
  template("rosewood", "Rosewood", "natural", "editorial", "light", palette("#F6E8EA", "#FCF4F5", "#E0C0C4", "#3A2024", "#8A4850", "#FCF4F5"), { heading: "playfair" }),
  template("marshmallow", "Marshmallow", "natural", "gallery", "light", palette("#FFF7FB", "#FFFFFF", "#F0D8E4", "#4A3040", "#E8B4C8", "#4A3040"), { heading: "poppins" }, { corners: "round" }),
  template("gray", "Gray", "natural", "minimal", "light", palette("#F4F4F5", "#FFFFFF", "#D4D4D8", "#27272A", "#3F3F46", "#FFFFFF"), { heading: "inter" }),
  template("emerald", "Emerald", "natural", "market", "dark", palette("#10241C", "#18382A", "#1F8A58", "#E4F8EC", "#2ECF7A", "#10241C"), { heading: "montserrat" }),
];

export const DEFAULT_PAGE_TEMPLATE_ID = "classic";

const templatesById = new Map(PAGE_TEMPLATES.map((item) => [item.id, item]));

export function getPageTemplate(id: string | undefined | null): PageTemplate {
  return templatesById.get(id ?? "") ?? PAGE_TEMPLATES[0]!;
}

export function styleFromTemplate(id: string): PageStyle {
  return getPageTemplate(id).style;
}

export function checkoutFromTemplate(id: string): CheckoutStyle {
  return checkoutStyleFromPage(styleFromTemplate(id));
}

export function isPageTemplateId(id: string): boolean {
  return templatesById.has(id);
}

export const TEMPLATE_GROUPS: TemplateGroup[] = ["basic", "vivid", "dark", "natural"];
