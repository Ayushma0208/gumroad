import type { CreatorProfile } from "@/types/catalog";

const img = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const creatorProfiles: CreatorProfile[] = [
  {
    id: "c_mira",
    name: "Mira Chen",
    slug: "mira",
    avatarUrl: img("photo-1494790108377-be9c29b29330", 200),
    headline: "Product designer & type obsessive",
    coverUrl: img("photo-1522202176988-66273c2fd55f"),
    bio: "Typography and interface systems for studios that still print. Mira ships Figma kits the way some people ship type specimens — slowly, and with a point of view.",
    storeName: "Northline Studio",
    productCount: 5,
    followerCount: 18400,
  },
  {
    id: "c_kenji",
    name: "Kenji Mori",
    slug: "kenji",
    avatarUrl: img("photo-1500648767791-00dcc994a43e", 200),
    headline: "Engineer who still writes documentation",
    coverUrl: img("photo-1517694712202-14dd9538aa97"),
    bio: "Application architecture, sold as repos you can actually ship. Kenji’s notes read like a senior sitting next to you, not a course landing page.",
    storeName: "Mori Atelier",
    productCount: 5,
    followerCount: 11200,
  },
  {
    id: "c_julian",
    name: "Julian Voss",
    slug: "julian",
    avatarUrl: img("photo-1507003211169-0a1dd7228f2d", 200),
    headline: "Photographer in the Pacific Northwest",
    coverUrl: img("photo-1500530855697-b586d89ba3ee"),
    bio: "Editorial photography and film-inspired color science. Julian teaches the way he shoots — with a clock in the room and almost no talking over the work.",
    storeName: "Voss Atelier",
    productCount: 3,
    followerCount: 9200,
  },
  {
    id: "c_asha",
    name: "Asha Reddy",
    slug: "asha",
    avatarUrl: img("photo-1534528741775-53994a69daeb", 200),
    headline: "Composer and independent publisher",
    coverUrl: img("photo-1470225620780-dba8ba36b745"),
    bio: "Scores, essays, and workshops for independent makers. Asha publishes the work she would have wanted at the start of her own studio.",
    storeName: "Chamber Press",
    productCount: 4,
    followerCount: 12100,
  },
  {
    id: "c_noor",
    name: "Noor Al-Farsi",
    slug: "noor",
    avatarUrl: img("photo-1573496359142-b8d87734a5a2", 200),
    headline: "Operator who designs the week",
    coverUrl: img("photo-1497366216548-37526070297c"),
    bio: "Operating systems for people who already own too many tools. Noor designs Mondays, not dashboards.",
    storeName: "Field Notes Studio",
    productCount: 2,
    followerCount: 6400,
  },
  {
    id: "c_elena",
    name: "Elena Park",
    slug: "elena",
    avatarUrl: img("photo-1438761681033-6461ffad8d80", 200),
    headline: "Design educator in Seoul",
    coverUrl: img("photo-1609921212029-bb5a28e60960"),
    bio: "Elena teaches semantic color and type the way a good editor teaches sentences — by showing the mistakes she leaves in.",
    storeName: "Park Workshop",
    productCount: 1,
    followerCount: 8700,
  },
];

export function getCreatorProfileBySlug(slug: string): CreatorProfile | undefined {
  return creatorProfiles.find((creator) => creator.slug === slug);
}
