import type { IncludedItem, ProductReview } from "@/types/catalog";

const img = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export type ProductContent = {
  images: string[];
  paragraphs: string[];
  highlights: string[];
  audience: string[];
  outcomes: string[];
  includedItems: IncludedItem[];
};

function include(
  id: string,
  label: string,
  icon: IncludedItem["icon"],
  detail?: string,
): IncludedItem {
  return { id, label, icon, detail };
}

const lifetime = include(
  "lifetime",
  "Lifetime updates",
  "refresh",
  "New files land in your library when the creator ships them.",
);

export const productContent: Record<string, ProductContent> = {
  "northline-ui-system": {
    images: [
      img("photo-1561070791-2526d30994b5"),
      img("photo-1609921212029-bb5a28e60960"),
    ],
    paragraphs: [
      "Northline is the system Mira actually opens on a Monday: 240+ components, 18 production screens, and a type scale that refuses to be cute.",
      "It is built for SaaS teams who still care how software feels — not another dashboard kit with 400 unused variants.",
    ],
    highlights: [
      "A complete Figma library with auto-layout that survives real product work",
      "18 screens you can duplicate, not just stare at",
      "A ruthless type and color scale documented in plain language",
    ],
    audience: [
      "Product designers shipping a first or fifth SaaS interface",
      "Studios who need a system they can hand to a junior without a lecture",
    ],
    outcomes: [
      "Start a new product from a coherent kit instead of a blank page",
      "Keep spacing, type, and color consistent as the team grows",
    ],
    includedItems: [
      include("figma", "Figma library", "layout", "240+ components and 18 screens"),
      include("tokens", "Design tokens", "layers", "Color, type, and radius as variables"),
      include("guide", "Usage notes", "file", "How Mira names, nests, and ships"),
      lifetime,
    ],
  },
  "atlas-next-starter": {
    images: [
      img("photo-1486312338219-ce68d2c6f44d"),
      img("photo-1551288049-bebda4e38f71"),
    ],
    paragraphs: [
      "Atlas is the App Router repo Kenji uses to start client work. Typed env, Prisma, and a storefront layout that is not another admin dashboard.",
      "The holes for auth and billing are already dug. You bring the product, not the scaffolding argument.",
    ],
    highlights: [
      "Production App Router structure with typed environment variables",
      "Prisma and a storefront layout you can actually show a client",
      "Auth and billing seams marked, not pretended away",
    ],
    audience: [
      "Engineers starting a product without wanting a seventh boilerplate",
      "Studios who bill for the work, not the weekend of setup",
    ],
    outcomes: [
      "Clone, rename, and ship a first vertical slice in a day",
      "Stop re-litigating folder structure on every engagement",
    ],
    includedItems: [
      include("repo", "Source repository", "code", "Next.js App Router, TypeScript, Prisma"),
      include("docs", "Setup notes", "file", "The README Kenji actually follows"),
      include("layout", "Storefront layout", "layout", "Marketing and product shells"),
      lifetime,
    ],
  },
  "prompt-atelier": {
    images: [
      img("photo-1620712943543-bcc4688e7485"),
      img("photo-1677442136019-21780ecad995"),
    ],
    paragraphs: [
      "Prompt Atelier is a working library of image and copy systems — structured briefs, negative vocabularies, and the stacks Mira uses for campaign stills.",
      "It is not a dump of one-liners. Each brief is written the way a creative director would actually brief a model.",
    ],
    highlights: [
      "Structured briefs instead of prompt soup",
      "Negative vocabularies that save you a night of cleanup",
      "The exact stacks used on Mira’s last campaign stills",
    ],
    audience: [
      "Designers and marketers who already use models and want them to listen",
      "Studios tired of prompt packs that read like spam",
    ],
    outcomes: [
      "Brief an image model the way you would brief a photographer",
      "Build a reusable library instead of starting from zero each Monday",
    ],
    includedItems: [
      include("briefs", "Prompt briefs", "sparkles", "Image and copy systems, not one-liners"),
      include("neg", "Negative vocabularies", "file", "What Mira tells the model to refuse"),
      include("stacks", "Campaign stacks", "layers", "The sequences used in production"),
      lifetime,
    ],
  },
  "studio-operating-system": {
    images: [
      img("photo-1497366216548-37526070297c"),
      img("photo-1484480974693-6ca0a78fb36b"),
    ],
    paragraphs: [
      "The paperwork Kenji and Mira actually use — contracts, invoices, and a weekly rhythm for a two-person practice.",
      "It is not a 90-page MBA template. It is the smallest set of documents that keep a studio from improvising every Friday.",
    ],
    highlights: [
      "Contracts and invoices written in language a client will sign",
      "A weekly rhythm for two people who already have too many tools",
      "Templates you can duplicate the morning a project starts",
    ],
    audience: [
      "Two-person studios and freelancers ready to stop reinventing the admin",
      "Makers who want paperwork that matches the work, not a law firm",
    ],
    outcomes: [
      "Send a contract without rewriting it from memory",
      "Run the week from one place instead of four inboxes",
    ],
    includedItems: [
      include("contracts", "Contract set", "file", "Client, licensing, and kill-fee language"),
      include("invoices", "Invoice templates", "layout", "Simple, dated, and usable"),
      include("week", "Weekly rhythm", "book", "The Monday checklist they actually open"),
      lifetime,
    ],
  },
  "editorial-lookbook-kit": {
    images: [
      img("photo-1516035069371-29a1b244cc32"),
      img("photo-1500530855697-b586d89ba3ee"),
    ],
    paragraphs: [
      "Twelve film-inspired Lightroom profiles and InDesign grids from Julian’s last three commissions.",
      "Built for print-ready work — lookbooks, editorials, and the kind of PDF a client still prints.",
    ],
    highlights: [
      "Film-inspired color that survives skin, cedar, and sodium light",
      "InDesign grids sized for lookbook spreads",
      "The same profiles Julian used on paid commissions",
    ],
    audience: [
      "Photographers finishing editorial and lookbook work",
      "Studios who still deliver print, not only a Drive folder",
    ],
    outcomes: [
      "Grade a set in an afternoon instead of a week",
      "Hand a client a layout that already knows its margins",
    ],
    includedItems: [
      include("presets", "Lightroom profiles", "image", "Twelve film-inspired looks"),
      include("grids", "InDesign grids", "layout", "Lookbook spreads, print-ready"),
      include("notes", "Shooting notes", "book", "How Julian meters the rain"),
      lifetime,
    ],
  },
  "quiet-hours": {
    images: [
      img("photo-1514320291840-2e0a9bf2a9ae"),
      img("photo-1470225620780-dba8ba36b745"),
    ],
    paragraphs: [
      "An 18-track ambient library recorded in a converted chapel outside Pune. Stems, loops, and full mixes.",
      "Asha left the human layer in on purpose. It is music for film and product films that should not sound like a stock search.",
    ],
    highlights: [
      "18 tracks with stems and loops, not a single mixed dump",
      "Recorded in a dry, quiet room — chapel, not a hall",
      "Cleared for commercial use in film and product work",
    ],
    audience: [
      "Editors and directors who need air, not a trailer cue",
      "Product teams tired of the same three ambient beds",
    ],
    outcomes: [
      "Score a sequence without fighting a watermark",
      "Build a bed from stems instead of stretching a loop",
    ],
    includedItems: [
      include("tracks", "18 full mixes", "audio", "Chapel recordings, mixed"),
      include("stems", "Stems and loops", "layers", "The parts Asha would actually mute"),
      include("license", "Commercial license", "file", "Film and product use, written plainly"),
      lifetime,
    ],
  },
  "figure-atelier": {
    images: [
      img("photo-1523580494863-6f3031224c94"),
      img("photo-1513364776144-60967b0f800f"),
    ],
    paragraphs: [
      "Six recorded life-drawing sessions with timed poses and almost no talking over the model.",
      "Julian’s weekend atelier, filmed simply — charcoal, clock, and the discipline of staying in the room.",
    ],
    highlights: [
      "Timed poses you can draw along with, not a lecture",
      "Six full sessions, filmed without a host talking over the work",
      "Notes on proportion that assume you already have a pencil",
    ],
    audience: [
      "Drawers who want a room, not a personality",
      "Students rebuilding a figure practice after years away",
    ],
    outcomes: [
      "Sit a session with a clock instead of a playlist of tips",
      "Leave with pages, not notes about pages",
    ],
    includedItems: [
      include("sessions", "Six recorded sessions", "video", "Timed poses, chapel-quiet"),
      include("notes", "Proportion notes", "book", "Julian’s marks, not a textbook"),
      include("refs", "Still frames", "image", "Key poses for later study"),
      lifetime,
    ],
  },
  "the-independent-writer": {
    images: [
      img("photo-1471107340929-a87cd0f5b5f3"),
      img("photo-1455390582262-044cdead277a"),
    ],
    paragraphs: [
      "A six-week workshop on essays, newsletters, and paid readers. Lessons, prompts, and the contracts Asha uses when licensing work.",
      "It is for people who already write and want the work to pay without turning into a content mill.",
    ],
    highlights: [
      "Six weeks of lessons that assume you can already make a sentence",
      "Contracts for licensing essays and newsletters",
      "Prompts that produce pages, not tweets",
    ],
    audience: [
      "Writers building a paid newsletter or essay practice",
      "Makers who want readers, not an audience-as-a-service",
    ],
    outcomes: [
      "Ship a six-week sequence of work you would stand behind",
      "License a piece without inventing the paperwork at midnight",
    ],
    includedItems: [
      include("lessons", "Six video lessons", "video", "Essays, newsletters, paid readers"),
      include("prompts", "Writing prompts", "book", "The ones that produce pages"),
      include("contracts", "Licensing contracts", "file", "Asha’s actual language"),
      include("community", "Writer circle", "users", "A quiet room, not a Discord carnival"),
      lifetime,
    ],
  },
  "advanced-react-patterns": {
    images: [
      img("photo-1555066931-4365d14bab8c"),
      img("photo-1633356122544-f134324a6cee"),
    ],
    paragraphs: [
      "Composition, state machines, and the patterns Kenji uses in production. A recorded workshop with typed examples — not a highlight reel of hooks trivia.",
    ],
    highlights: [
      "Patterns from production, typed and runnable",
      "Composition over a zoo of custom hooks",
      "State machines where the UI actually needs them",
    ],
    audience: [
      "React engineers past the tutorial and into the messy middle",
    ],
    outcomes: [
      "Recognize when a pattern is load-bearing versus fashionable",
    ],
    includedItems: [
      include("workshop", "Recorded workshop", "video", "Typed examples, no trivia"),
      include("repo", "Example repository", "code", "The files Kenji steps through"),
      lifetime,
    ],
  },
  "freelance-business-playbook": {
    images: [
      img("photo-1454165804606-c3d57bc86b40"),
      img("photo-1486312338219-ce68d2c6f44d"),
    ],
    paragraphs: [
      "Pricing, contracts, and the first 90 days of a studio. What Kenji actually sends when a friend asks how to stop undercharging.",
    ],
    highlights: [
      "Pricing language you can say out loud",
      "The first 90 days without a guru calendar",
    ],
    audience: [
      "Freelancers moving from gigs to a practice",
    ],
    outcomes: [
      "Quote a number and mean it",
    ],
    includedItems: [
      include("book", "Playbook (PDF & EPUB)", "book", "Short, dated, usable on a Sunday"),
      include("sheets", "Rate worksheets", "file", "The math, not a vibe"),
      lifetime,
    ],
  },
  "pacific-color-science": {
    images: [
      img("photo-1490481651871-ab68de25d43d"),
      img("photo-1500530855697-b586d89ba3ee"),
    ],
    paragraphs: [
      "Fourteen Lightroom profiles with before/after catalogs from Julian’s Pacific Northwest book. Rain, cedar, and sodium light.",
    ],
    highlights: [
      "Color that holds up in weather, not only in a studio",
      "Before/after catalogs from a published book",
    ],
    audience: [
      "Photographers shooting in bad light on purpose",
    ],
    outcomes: [
      "Grade a wet afternoon without making it look like a filter pack",
    ],
    includedItems: [
      include("profiles", "14 Lightroom profiles", "image", "Pacific color science"),
      include("catalog", "Before/after catalog", "file", "From the book, not a marketing PDF"),
      lifetime,
    ],
  },
  "notion-productivity-system": {
    images: [
      img("photo-1454165804606-c3d57bc86b40"),
      img("photo-1484480974693-6ca0a78fb36b"),
    ],
    paragraphs: [
      "A calm operating system for people who already own too many tools. Projects, writing, and money in one workspace — with the views Noor actually opens on Monday.",
    ],
    highlights: [
      "One workspace instead of four abandoned systems",
      "Views Noor still uses, not a template graveyard",
    ],
    audience: [
      "Operators and writers who are tired of productivity as a personality",
    ],
    outcomes: [
      "Open Monday without rebuilding the week from a blank page",
    ],
    includedItems: [
      include("notion", "Notion workspace", "layout", "Projects, writing, money"),
      include("guide", "Setup guide", "book", "What to delete on day one"),
      lifetime,
    ],
  },
  "ai-prompt-engineering-toolkit": {
    images: [
      img("photo-1677442136019-21780ecad995"),
      img("photo-1620712943543-bcc4688e7485"),
    ],
    paragraphs: [
      "Briefs, evals, and a library you can hand to a junior. The working kit Mira uses for campaign stills, product copy, and stubborn model drift.",
    ],
    highlights: [
      "Evals, not just clever prompts",
      "A library structured enough to hand off",
    ],
    audience: [
      "Teams putting models into a real workflow",
    ],
    outcomes: [
      "Measure whether a prompt still works next month",
    ],
    includedItems: [
      include("kit", "Prompt kit", "sparkles", "Briefs and evals"),
      include("library", "Working library", "layers", "Copy, stills, drift notes"),
      include("handoff", "Junior handoff", "users", "The page Mira gives a new hire"),
      lifetime,
    ],
  },
  "sunday-market-type": {
    images: [
      img("photo-1558655146-9f40138edfeb"),
      img("photo-1618005182384-a83a8bd57fbe"),
    ],
    paragraphs: [
      "A display family with the warmth of painted shop signs. Six weights, stylistic sets, and the specimen Mira printed for a Lisbon grocer.",
    ],
    highlights: [
      "Six weights that hold at poster size and on a label",
      "A specimen you can print, not only screenshot",
    ],
    audience: [
      "Designers who still specify type for physical objects",
    ],
    outcomes: [
      "Set a shop, a poster, or a masthead without a second family",
    ],
    includedItems: [
      include("fonts", "Desktop & web fonts", "file", "Six weights, stylistic sets"),
      include("specimen", "Print specimen", "book", "The Lisbon grocer edition"),
      lifetime,
    ],
  },
  "chamber-strings": {
    images: [
      img("photo-1511379938547-c1f69419868d"),
      img("photo-1514320291840-2e0a9bf2a9ae"),
    ],
    paragraphs: [
      "Intimate quartet samples recorded in a dry room, not a hall. Shorts, longs, and the messy human layer Asha leaves in on purpose.",
    ],
    highlights: [
      "Dry-room strings, close and imperfect",
      "Shorts and longs you can actually arrange",
    ],
    audience: [
      "Composers who want chamber, not Hollywood",
    ],
    outcomes: [
      "Write a quartet line that does not sound like a trailer",
    ],
    includedItems: [
      include("library", "Sample library", "audio", "Quartet shorts and longs"),
      include("mics", "Mic notes", "file", "How the room was captured"),
      lifetime,
    ],
  },
  "the-essay-desk": {
    images: [
      img("photo-1455390582262-044cdead277a"),
      img("photo-1471107340929-a87cd0f5b5f3"),
    ],
    paragraphs: [
      "A small book on structure, voice, and charging for sentences. Twelve essays and the editing checklist Asha uses before anything leaves the house.",
    ],
    highlights: [
      "Twelve essays you can steal structure from",
      "The checklist before a piece is allowed out",
    ],
    audience: [
      "Writers who want to charge without becoming a brand",
    ],
    outcomes: [
      "Finish an essay and know what to ask for it",
    ],
    includedItems: [
      include("ebook", "Ebook", "book", "PDF and EPUB"),
      include("checklist", "Editing checklist", "file", "Asha’s last pass"),
      lifetime,
    ],
  },
  "figma-tokens-workshop": {
    images: [
      img("photo-1561070791-2526d30994b5"),
      img("photo-1609921212029-bb5a28e60960"),
    ],
    paragraphs: [
      "A live-recorded course on semantic color, type, and shipping a system. Elena’s two-day workshop, including the files and the mistakes she leaves in.",
    ],
    highlights: [
      "Semantic tokens taught with the files still messy",
      "Two days of workshop, not a slideshow",
    ],
    audience: [
      "Designers responsible for a system other people have to use",
    ],
    outcomes: [
      "Name color and type so a team can ship without a meeting",
    ],
    includedItems: [
      include("course", "Two-day recording", "video", "Live workshop, unpolished on purpose"),
      include("files", "Figma files", "layout", "Including the mistakes"),
      include("community", "Workshop notes", "users", "Questions Elena still gets"),
      lifetime,
    ],
  },
  "brand-archive": {
    images: [
      img("photo-1561070791-2526d30994b5"),
      img("photo-1558655146-9f40138edfeb"),
    ],
    paragraphs: [
      "A modern SaaS UI kit for companies that still want a mark. Logo construction, color stories, and 24 screens — less dashboard, more object.",
    ],
    highlights: [
      "A mark and a product kit that belong to each other",
      "24 screens that are not another settings page",
    ],
    audience: [
      "Founders and designers building a product that should feel like an object",
    ],
    outcomes: [
      "Present a brand and an interface in the same conversation",
    ],
    includedItems: [
      include("kit", "UI kit", "layout", "24 screens"),
      include("mark", "Logo construction", "layers", "The mark, not a logo pack"),
      include("color", "Color stories", "image", "How the palette behaves"),
      lifetime,
    ],
  },
  "ship-log": {
    images: [
      img("photo-1484480974693-6ca0a78fb36b"),
      img("photo-1551288049-bebda4e38f71"),
    ],
    paragraphs: [
      "A product analytics template for teams tired of vanity dashboards. The questions Kenji asks before a launch, laid out as Notion and SQL.",
    ],
    highlights: [
      "Questions before charts",
      "Notion and SQL that match each other",
    ],
    audience: [
      "Product teams who have too many dashboards and not enough answers",
    ],
    outcomes: [
      "Walk into a launch review with the right three numbers",
    ],
    includedItems: [
      include("notion", "Notion kit", "layout", "Launch questions"),
      include("sql", "SQL sketches", "code", "The queries behind the questions"),
      lifetime,
    ],
  },
  "field-notes-for-founders": {
    images: [
      img("photo-1454165804606-c3d57bc86b40"),
      img("photo-1497366216548-37526070297c"),
    ],
    paragraphs: [
      "A short operating manual for the first hire, the first no, and the first raise. Noor’s notes from three studios — spare, dated, and usable on a Sunday night.",
    ],
    highlights: [
      "Notes from three studios, not a framework",
      "The first hire, the first no, the first raise",
    ],
    audience: [
      "Founders in the unglamorous middle of year one",
    ],
    outcomes: [
      "Make the next hard call without opening another Twitter thread",
    ],
    includedItems: [
      include("ebook", "Field notes", "book", "PDF and EPUB"),
      include("prompts", "Decision prompts", "file", "Sunday-night usable"),
      lifetime,
    ],
  },
};

export const productReviews: ProductReview[] = [
  {
    id: "r1",
    productId: "p_northline",
    authorName: "Leah Okonkwo",
    authorAvatarUrl: img("photo-1544005313-94ddf0286df2", 200),
    rating: 5,
    body: "We replaced three abandoned kits with this one. Auto-layout that survives a real sprint is rarer than people admit.",
    createdAt: "2026-07-12",
  },
  {
    id: "r2",
    productId: "p_northline",
    authorName: "Mateo Ruiz",
    authorAvatarUrl: img("photo-1472099645785-5658abf4ff4e", 200),
    rating: 5,
    body: "The type scale is the reason we bought it. Everything else is a bonus that happens to be excellent.",
    createdAt: "2026-06-03",
  },
  {
    id: "r3",
    productId: "p_northline",
    authorName: "Samir Shah",
    authorAvatarUrl: img("photo-1506794778202-cad84cf45f1d", 200),
    rating: 4,
    body: "I wanted more empty states. Still the first library I duplicate when a new product starts.",
    createdAt: "2026-05-21",
  },
  {
    id: "r4",
    productId: "p_atlas",
    authorName: "Nia Brooks",
    authorAvatarUrl: img("photo-1531123897727-8f129e1688ce", 200),
    rating: 5,
    body: "I billed the setup day instead of eating it. That is the whole review.",
    createdAt: "2026-08-02",
  },
  {
    id: "r5",
    productId: "p_atlas",
    authorName: "Mateo Ruiz",
    authorAvatarUrl: img("photo-1472099645785-5658abf4ff4e", 200),
    rating: 5,
    body: "Typed env and a storefront that does not look like a dashboard. Kenji knows what client work actually is.",
    createdAt: "2026-04-18",
  },
  {
    id: "r6",
    productId: "p_prompt",
    authorName: "Priya Nair",
    authorAvatarUrl: img("photo-1580489944761-15a19d654956", 200),
    rating: 5,
    body: "Finally a prompt library that reads like a brief. I handed it to a junior and they did not get lost.",
    createdAt: "2026-07-29",
  },
  {
    id: "r7",
    productId: "p_prompt",
    authorName: "Jules Adeyemi",
    authorAvatarUrl: img("photo-1527980965255-d3b416303d12", 200),
    rating: 4,
    body: "The negative vocabularies are worth the price. I still rewrite the image stacks for our brand.",
    createdAt: "2026-06-14",
  },
  {
    id: "r8",
    productId: "p_studio_os",
    authorName: "Leah Okonkwo",
    authorAvatarUrl: img("photo-1544005313-94ddf0286df2", 200),
    rating: 5,
    body: "We sent the contract the same afternoon. No 90-page theater.",
    createdAt: "2026-03-09",
  },
  {
    id: "r9",
    productId: "p_lookbook",
    authorName: "Samir Shah",
    authorAvatarUrl: img("photo-1506794778202-cad84cf45f1d", 200),
    rating: 5,
    body: "The grids made the print PDF look like we have a studio twice our size.",
    createdAt: "2026-08-01",
  },
  {
    id: "r10",
    productId: "p_lookbook",
    authorName: "Nia Brooks",
    authorAvatarUrl: img("photo-1531123897727-8f129e1688ce", 200),
    rating: 4,
    body: "Profiles are lovely in cedar and rain. I push them a little for studio strobe.",
    createdAt: "2026-07-04",
  },
  {
    id: "r11",
    productId: "p_quiet",
    authorName: "Priya Nair",
    authorAvatarUrl: img("photo-1580489944761-15a19d654956", 200),
    rating: 5,
    body: "I used a stem under a product film and nobody asked what library it was from. That is the compliment.",
    createdAt: "2026-02-11",
  },
  {
    id: "r12",
    productId: "p_figure",
    authorName: "Jules Adeyemi",
    authorAvatarUrl: img("photo-1527980965255-d3b416303d12", 200),
    rating: 5,
    body: "No talking over the model. I sat three sessions in a weekend and filled a book.",
    createdAt: "2026-05-02",
  },
  {
    id: "r13",
    productId: "p_writer",
    authorName: "Priya Nair",
    authorAvatarUrl: img("photo-1580489944761-15a19d654956", 200),
    rating: 5,
    body: "The contracts alone paid for the workshop. The lessons made me finish the essays I had been circling.",
    createdAt: "2026-06-22",
  },
  {
    id: "r14",
    productId: "p_react_patterns",
    authorName: "Mateo Ruiz",
    authorAvatarUrl: img("photo-1472099645785-5658abf4ff4e", 200),
    rating: 5,
    body: "I finally have language for why we stopped adding hooks. The repo is the course.",
    createdAt: "2026-08-09",
  },
  {
    id: "r15",
    productId: "p_freelance",
    authorName: "Leah Okonkwo",
    authorAvatarUrl: img("photo-1544005313-94ddf0286df2", 200),
    rating: 4,
    body: "I raised my rate the next week. The worksheets are blunt in the useful way.",
    createdAt: "2026-07-18",
  },
  {
    id: "r16",
    productId: "p_pacific_color",
    authorName: "Samir Shah",
    authorAvatarUrl: img("photo-1506794778202-cad84cf45f1d", 200),
    rating: 5,
    body: "Sodium light that still looks like a photograph. I bought it after the lookbook kit.",
    createdAt: "2026-08-24",
  },
  {
    id: "r17",
    productId: "p_notion_studio",
    authorName: "Nia Brooks",
    authorAvatarUrl: img("photo-1531123897727-8f129e1688ce", 200),
    rating: 5,
    body: "I deleted three other systems the same night. Monday is quieter.",
    createdAt: "2026-08-12",
  },
  {
    id: "r18",
    productId: "p_prompt_toolkit",
    authorName: "Jules Adeyemi",
    authorAvatarUrl: img("photo-1527980965255-d3b416303d12", 200),
    rating: 5,
    body: "The evals are the part nobody else sells. We caught drift in a week instead of a quarter.",
    createdAt: "2026-08-05",
  },
  {
    id: "r19",
    productId: "p_sunday_market",
    authorName: "Leah Okonkwo",
    authorAvatarUrl: img("photo-1544005313-94ddf0286df2", 200),
    rating: 5,
    body: "I specified it for a grocer and a masthead. It holds both.",
    createdAt: "2026-06-30",
  },
  {
    id: "r20",
    productId: "p_chamber",
    authorName: "Priya Nair",
    authorAvatarUrl: img("photo-1580489944761-15a19d654956", 200),
    rating: 4,
    body: "Dry and close, as promised. I layer it under Quiet Hours more than I expected.",
    createdAt: "2026-05-16",
  },
  {
    id: "r21",
    productId: "p_essay_desk",
    authorName: "Mateo Ruiz",
    authorAvatarUrl: img("photo-1472099645785-5658abf4ff4e", 200),
    rating: 5,
    body: "Short enough to finish. The checklist is now the last thing before I send work out.",
    createdAt: "2026-08-26",
  },
  {
    id: "r22",
    productId: "p_figma_tokens",
    authorName: "Nia Brooks",
    authorAvatarUrl: img("photo-1531123897727-8f129e1688ce", 200),
    rating: 5,
    body: "Elena leaves the mistakes in. That is why the team can actually ship the system.",
    createdAt: "2026-04-02",
  },
  {
    id: "r23",
    productId: "p_brand_archive",
    authorName: "Samir Shah",
    authorAvatarUrl: img("photo-1506794778202-cad84cf45f1d", 200),
    rating: 4,
    body: "The mark and the screens feel like the same object. I wanted one more empty state.",
    createdAt: "2026-07-21",
  },
  {
    id: "r24",
    productId: "p_ship_log",
    authorName: "Jules Adeyemi",
    authorAvatarUrl: img("photo-1527980965255-d3b416303d12", 200),
    rating: 5,
    body: "We walked into a launch review with three numbers. The dashboard people were quiet.",
    createdAt: "2026-08-16",
  },
  {
    id: "r25",
    productId: "p_field_notes",
    authorName: "Leah Okonkwo",
    authorAvatarUrl: img("photo-1544005313-94ddf0286df2", 200),
    rating: 5,
    body: "I read it the night before a hire. It is dated in the way that makes it trustworthy.",
    createdAt: "2026-07-08",
  },
];

export function getProductContent(slug: string): ProductContent | undefined {
  return productContent[slug];
}

export function getReviewsForProduct(productId: string): ProductReview[] {
  return productReviews.filter((review) => review.productId === productId);
}
