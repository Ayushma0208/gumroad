import type { ReactNode } from "react";
import { Globe2, type LucideIcon } from "lucide-react";
import type { CreatorSocialLinks } from "@/types/catalog";

function BrandIcon({
  path,
  className,
}: {
  path: string;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d={path} />
    </svg>
  );
}

const icons = {
  website: Globe2,
  instagram: (props: { className?: string }) => (
    <BrandIcon
      className={props.className}
      path="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm10 1.8H7A2.2 2.2 0 0 0 4.8 7v10A2.2 2.2 0 0 0 7 19.2h10a2.2 2.2 0 0 0 2.2-2.2V7A2.2 2.2 0 0 0 17 4.8ZM12 8.2A3.8 3.8 0 1 1 8.2 12 3.8 3.8 0 0 1 12 8.2Zm0 1.7A2.1 2.1 0 1 0 14.1 12 2.1 2.1 0 0 0 12 9.9Zm4.55-3.35a.95.95 0 1 1-.95.95.95.95 0 0 1 .95-.95Z"
    />
  ),
  twitter: (props: { className?: string }) => (
    <BrandIcon
      className={props.className}
      path="M18.9 2H22l-6.8 7.77L23 22h-6.4l-5-6.55L6.2 22H3.1l7.27-8.3L1 2h6.56l4.52 6.02L18.9 2Zm-1.12 18h1.77L6.35 3.9H4.45L17.78 20Z"
    />
  ),
  linkedin: (props: { className?: string }) => (
    <BrandIcon
      className={props.className}
      path="M6.5 9.5H3.7V20h2.8V9.5ZM5.1 4A1.6 1.6 0 1 0 5.1 7.2 1.6 1.6 0 0 0 5.1 4ZM20.3 20h-2.8v-5.6c0-1.5-.5-2.5-1.8-2.5-1 0-1.5.7-1.8 1.4-.1.2-.1.6-.1.9V20h-2.8s.1-8.4 0-9.5h2.8v1.3c.4-.6 1.1-1.5 2.7-1.5 2 0 3.6 1.3 3.6 4.2V20Z"
    />
  ),
  youtube: (props: { className?: string }) => (
    <BrandIcon
      className={props.className}
      path="M23 12.2s0-3.3-.4-4.8c-.2-.9-.9-1.6-1.8-1.8C18.9 5.2 12 5.2 12 5.2s-6.9 0-8.8.4c-.9.2-1.6.9-1.8 1.8C1 8.9 1 12.2 1 12.2s0 3.3.4 4.8c.2.9.9 1.6 1.8 1.8 1.9.4 8.8.4 8.8.4s6.9 0 8.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.5.4-4.8.4-4.8ZM9.8 15.5v-6.6l5.8 3.3-5.8 3.3Z"
    />
  ),
  github: (props: { className?: string }) => (
    <BrandIcon
      className={props.className}
      path="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.12-1.47-1.12-1.47-.92-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.9 1.55 2.37 1.1 2.95.84.09-.65.35-1.1.64-1.35-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.58 9.58 0 0 1 12 6.8c.85 0 1.7.11 2.5.32 1.9-1.29 2.74-1.02 2.74-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"
    />
  ),
} as const;

const items: {
  key: keyof CreatorSocialLinks | "website";
  label: string;
  icon: LucideIcon | ((props: { className?: string }) => ReactNode);
}[] = [
  { key: "website", label: "Website", icon: icons.website },
  { key: "instagram", label: "Instagram", icon: icons.instagram },
  { key: "twitter", label: "X", icon: icons.twitter },
  { key: "linkedin", label: "LinkedIn", icon: icons.linkedin },
  { key: "youtube", label: "YouTube", icon: icons.youtube },
  { key: "github", label: "GitHub", icon: icons.github },
];

export function CreatorSocialLinks({
  website,
  socialLinks,
}: {
  website?: string | null;
  socialLinks?: CreatorSocialLinks;
}) {
  const links = items
    .map((item) => {
      const href = item.key === "website" ? website : socialLinks?.[item.key];
      return href ? { ...item, href } : null;
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (links.length === 0) return null;

  return (
    <ul className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <li key={link.key}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-background/80 px-3 text-sm text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <Icon className="size-4" />
              {link.label}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
