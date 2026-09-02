export const siteConfig = {
  name: "Lumen",
  tagline: "Sell what you make.",
  description:
    "Lumen is the marketplace for independent creators to sell digital products — templates, courses, art, and more — without the noise.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

export const navLinks = [
  { href: "/discover", label: "Discover" },
  { href: "/#categories", label: "Categories" },
] as const;
