/**
 * In-memory creator studio store. Swap `lib/api/studio.ts` to Express later.
 * Kept on globalThis so mutations survive Turbopack HMR.
 */

import { categories } from "@/lib/mock/catalog";
import type {
  ConversionFunnel,
  DateRangeKey,
  ProductPerformancePoint,
  RevenuePoint,
  StudioAnalytics,
  StudioCustomer,
  StudioFile,
  StudioOverview,
  StudioProduct,
  StudioProductDraft,
  StudioProductStatus,
  StudioSale,
  StudioSettings,
} from "@/types/studio";

const img = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const portrait = (id: string) => img(id, 200);

const MIRA_ID = "u_mira";

type StudioMemory = {
  products: Map<string, StudioProduct[]>;
  sales: Map<string, StudioSale[]>;
  settings: Map<string, StudioSettings>;
};

const globalForStudio = globalThis as typeof globalThis & {
  __lumenStudioMemory?: StudioMemory;
};

function file(id: string, name: string, sizeBytes: number, mimeType: string): StudioFile {
  return { id, name, sizeBytes, mimeType };
}

function seedMiraProducts(): StudioProduct[] {
  return [
    {
      id: "sp_northline",
      slug: "northline-ui-system",
      title: "Northline UI System",
      shortDescription: "A complete Figma kit for modern SaaS products.",
      description:
        "240+ components, 18 screens, and a ruthless type scale — built for teams who care how software feels.",
      kind: "template",
      categorySlug: "design",
      categoryLabel: "Design",
      coverUrl: img("photo-1558655146-9f40138edfeb"),
      gallery: [img("photo-1618005182384-a83a8bd57fbe"), img("photo-1561070791-2526d30994b5")],
      files: [file("f1", "Northline-UI.fig", 48_200_000, "application/octet-stream")],
      status: "published",
      pricingModel: "fixed",
      priceCents: 7900,
      currency: "USD",
      salesCount: 186,
      revenueCents: 1_469_400,
      views: 12480,
      createdAt: "2026-03-18T10:00:00.000Z",
      updatedAt: "2026-08-22T14:12:00.000Z",
    },
    {
      id: "sp_prompt",
      slug: "prompt-atelier",
      title: "Prompt Atelier",
      shortDescription: "A working library of image and copy systems.",
      description:
        "Structured briefs, negative vocabularies, and the exact stacks used for campaign stills.",
      kind: "download",
      categorySlug: "ai",
      categoryLabel: "AI & Technology",
      coverUrl: img("photo-1677442136019-21780ecad995"),
      gallery: [img("photo-1620712943543-bcc4688e7485")],
      files: [file("f2", "prompt-atelier.zip", 18_400_000, "application/zip")],
      status: "published",
      pricingModel: "fixed",
      priceCents: 3900,
      currency: "USD",
      salesCount: 124,
      revenueCents: 483_600,
      views: 8920,
      createdAt: "2026-04-02T10:00:00.000Z",
      updatedAt: "2026-08-11T09:40:00.000Z",
    },
    {
      id: "sp_toolkit",
      slug: "ai-prompt-engineering-toolkit",
      title: "AI Prompt Engineering Toolkit",
      shortDescription: "Briefs, evals, and a library you can hand to a junior.",
      description:
        "The working kit for campaign stills, product copy, and stubborn model drift.",
      kind: "course",
      categorySlug: "ai",
      categoryLabel: "AI & Technology",
      coverUrl: img("photo-1620712943543-bcc4688e7485"),
      gallery: [],
      files: [file("f3", "toolkit-lessons.zip", 820_000_000, "application/zip")],
      status: "published",
      pricingModel: "fixed",
      priceCents: 5900,
      currency: "USD",
      salesCount: 74,
      revenueCents: 436_600,
      views: 4100,
      createdAt: "2026-07-28T10:00:00.000Z",
      updatedAt: "2026-08-30T16:02:00.000Z",
    },
    {
      id: "sp_sunday",
      slug: "sunday-market-type",
      title: "Sunday Market Type",
      shortDescription: "A display family with the warmth of painted shop signs.",
      description:
        "Six weights, stylistic sets, and the specimen printed for a Lisbon grocer.",
      kind: "download",
      categorySlug: "design",
      categoryLabel: "Design",
      coverUrl: img("photo-1561070791-2526d30994b5"),
      gallery: [img("photo-1455390582262-044cdead277a")],
      files: [
        file("f4", "SundayMarket-Desktop.zip", 12_200_000, "application/zip"),
        file("f5", "SundayMarket-Web.zip", 3_100_000, "application/zip"),
      ],
      status: "published",
      pricingModel: "pwyw",
      priceCents: 8900,
      suggestedPriceCents: 8900,
      minPriceCents: 1900,
      currency: "USD",
      salesCount: 41,
      revenueCents: 312_400,
      views: 2680,
      createdAt: "2026-05-14T10:00:00.000Z",
      updatedAt: "2026-07-19T11:20:00.000Z",
    },
    {
      id: "sp_archive",
      slug: "brand-archive",
      title: "Brand Archive",
      shortDescription: "A modern SaaS UI kit for companies that still want a mark.",
      description:
        "Logo construction, color stories, and 24 screens — less dashboard, more object.",
      kind: "bundle",
      categorySlug: "design",
      categoryLabel: "Design",
      coverUrl: img("photo-1618005182384-a83a8bd57fbe"),
      gallery: [img("photo-1558655146-9f40138edfeb")],
      files: [file("f6", "brand-archive.zip", 96_000_000, "application/zip")],
      status: "published",
      pricingModel: "fixed",
      priceCents: 5500,
      currency: "USD",
      salesCount: 58,
      revenueCents: 319_000,
      views: 3340,
      createdAt: "2026-06-30T10:00:00.000Z",
      updatedAt: "2026-08-04T08:15:00.000Z",
    },
    {
      id: "sp_specimen",
      slug: "northline-specimen",
      title: "Northline Specimen",
      shortDescription: "Print-ready type sheets for the Northline family.",
      description:
        "A quiet companion to the UI system — grids, optical sizes, and press notes.",
      kind: "download",
      categorySlug: "design",
      categoryLabel: "Design",
      coverUrl: img("photo-1455390582262-044cdead277a"),
      gallery: [],
      files: [file("f7", "northline-specimen.pdf", 8_400_000, "application/pdf")],
      status: "draft",
      pricingModel: "free",
      priceCents: 0,
      currency: "USD",
      salesCount: 0,
      revenueCents: 0,
      views: 120,
      createdAt: "2026-08-26T10:00:00.000Z",
      updatedAt: "2026-09-01T19:44:00.000Z",
    },
    {
      id: "sp_atelier_notes",
      slug: "atelier-notes-2025",
      title: "Atelier Notes 2025",
      shortDescription: "Last year’s studio essays, retired from the shelf.",
      description: "An archive of weekly notes. Kept for existing buyers.",
      kind: "download",
      categorySlug: "writing",
      categoryLabel: "Writing",
      coverUrl: img("photo-1455390582262-044cdead277a"),
      gallery: [],
      files: [file("f8", "atelier-notes-2025.epub", 2_200_000, "application/epub+zip")],
      status: "archived",
      pricingModel: "fixed",
      priceCents: 1200,
      currency: "USD",
      salesCount: 19,
      revenueCents: 22_800,
      views: 980,
      createdAt: "2025-11-02T10:00:00.000Z",
      updatedAt: "2026-06-12T12:00:00.000Z",
    },
  ];
}

type Buyer = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
};

const buyers: Buyer[] = [
  { id: "cu_1", name: "Leah Okonkwo", email: "leah@studio.co", avatarUrl: portrait("photo-1531123897727-8f129e1688ce") },
  { id: "cu_2", name: "Owen Park", email: "owen@field.studio", avatarUrl: portrait("photo-1506794778202-cad84cf45f1d") },
  { id: "cu_3", name: "Sofia Almeida", email: "sofia@press.io", avatarUrl: portrait("photo-1544005313-94ddf0286df2") },
  { id: "cu_4", name: "Nate Hollis", email: "nate@hollis.design", avatarUrl: portrait("photo-1500648767791-00dcc994a43e") },
  { id: "cu_5", name: "Priya Shah", email: "priya@north.lab", avatarUrl: portrait("photo-1487412720507-e7ab37603c6f") },
  { id: "cu_6", name: "Jonas Berg", email: "jonas@atelier.se", avatarUrl: portrait("photo-1507003211169-0a1dd7228f2d") },
  { id: "cu_7", name: "Amara Diallo", email: "amara@lumen.work", avatarUrl: portrait("photo-1524504388940-b1c1722653e1") },
  { id: "cu_8", name: "Theo Marin", email: "theo@marin.co", avatarUrl: portrait("photo-1472099645785-5658abf4ff4e") },
  { id: "cu_9", name: "Hannah Cole", email: "hannah@cole.type", avatarUrl: portrait("photo-1438761681033-6461ffad8d80") },
  { id: "cu_10", name: "Ravi Menon", email: "ravi@grid.studio", avatarUrl: portrait("photo-1504257432389-52343af06d8c") },
  { id: "cu_11", name: "Clara Voss", email: "clara@voss.photo", avatarUrl: portrait("photo-1573496359142-b8d87734a5a2") },
  { id: "cu_12", name: "Eli Navarro", email: "eli@navarro.dev", avatarUrl: portrait("photo-1519345182560-3f2917c472ef") },
];

function seedMiraSales(): StudioSale[] {
  const published = seedMiraProducts().filter((product) => product.status === "published");
  const rows: StudioSale[] = [];
  const start = new Date("2026-07-12T09:14:00.000Z");

  for (let i = 0; i < 28; i += 1) {
    const product = published[i % published.length];
    if (!product) continue;
    const buyer = buyers[i % buyers.length];
    if (!buyer) continue;
    const purchasedAt = new Date(start.getTime() + i * 37 * 60 * 60 * 1000);
    const statuses: StudioSale["status"][] = ["paid", "paid", "paid", "paid", "refunded", "paid", "failed"];
    const status = statuses[i % statuses.length] ?? "paid";
    const amount =
      status === "failed"
        ? product.priceCents
        : product.pricingModel === "pwyw"
          ? 4900 + (i % 4) * 1000
          : product.priceCents;

    rows.push({
      id: `sale_${String(i + 1).padStart(3, "0")}`,
      productId: product.id,
      productTitle: product.title,
      productCoverUrl: product.coverUrl,
      customerId: buyer.id,
      customerName: buyer.name,
      customerEmail: buyer.email,
      customerAvatarUrl: buyer.avatarUrl,
      amountCents: amount,
      currency: "USD",
      status,
      purchasedAt: purchasedAt.toISOString(),
    });
  }

  return rows.sort(
    (a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime(),
  );
}

function seedMiraSettings(): StudioSettings {
  return {
    displayName: "Mira Chen",
    bio: "Typography and interface systems for studios that still print.",
    avatarUrl: portrait("photo-1494790108377-be9c29b29330"),
    storeName: "Northline Studio",
    slug: "mira",
    storeDescription:
      "Figma kits, type, and prompt libraries for teams who still care how software feels.",
    notifySales: true,
    notifyProductUpdates: true,
    notifyWeeklyDigest: false,
  };
}

function emptySettings(userId: string): StudioSettings {
  return {
    displayName: "Creator",
    bio: "Tell buyers who you are and what you make.",
    avatarUrl: "",
    storeName: "Your store",
    slug: userId.slice(0, 8).toLowerCase(),
    storeDescription: "A new store on Lumen.",
    notifySales: true,
    notifyProductUpdates: false,
    notifyWeeklyDigest: true,
  };
}

function createMemory(): StudioMemory {
  return {
    products: new Map([[MIRA_ID, seedMiraProducts()]]),
    sales: new Map([[MIRA_ID, seedMiraSales()]]),
    settings: new Map([[MIRA_ID, seedMiraSettings()]]),
  };
}

function memory(): StudioMemory {
  if (!globalForStudio.__lumenStudioMemory) {
    globalForStudio.__lumenStudioMemory = createMemory();
  }
  return globalForStudio.__lumenStudioMemory;
}

function productsFor(userId: string): StudioProduct[] {
  const store = memory();
  if (!store.products.has(userId)) {
    store.products.set(userId, []);
  }
  return store.products.get(userId) ?? [];
}

function salesFor(userId: string): StudioSale[] {
  const store = memory();
  if (!store.sales.has(userId)) {
    store.sales.set(userId, []);
  }
  return store.sales.get(userId) ?? [];
}

function settingsFor(userId: string): StudioSettings {
  const store = memory();
  const existing = store.settings.get(userId);
  if (existing) return existing;
  const created = emptySettings(userId);
  store.settings.set(userId, created);
  return created;
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function formatTick(date: Date, range: DateRangeKey): string {
  if (range === "daily") {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  if (range === "weekly") {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  if (range === "monthly") {
    return date.toLocaleDateString("en-US", { month: "short" });
  }
  return String(date.getUTCFullYear());
}

function buildSeries(userId: string, range: DateRangeKey): RevenuePoint[] {
  const paid = salesFor(userId).filter((sale) => sale.status === "paid");
  const now = new Date("2026-09-04T12:00:00.000Z");
  const rand = mulberry32(userId.length * 97 + range.length);

  const configs: Record<DateRangeKey, { count: number; stepMs: number }> = {
    daily: { count: 14, stepMs: 24 * 60 * 60 * 1000 },
    weekly: { count: 12, stepMs: 7 * 24 * 60 * 60 * 1000 },
    monthly: { count: 12, stepMs: 30 * 24 * 60 * 60 * 1000 },
    yearly: { count: 4, stepMs: 365 * 24 * 60 * 60 * 1000 },
  };

  const { count, stepMs } = configs[range];
  const points: RevenuePoint[] = [];

  for (let i = count - 1; i >= 0; i -= 1) {
    const end = new Date(now.getTime() - i * stepMs);
    const start = new Date(end.getTime() - stepMs);
    const inBucket = paid.filter((sale) => {
      const t = new Date(sale.purchasedAt).getTime();
      return t >= start.getTime() && t < end.getTime();
    });

    let revenueCents = inBucket.reduce((sum, sale) => sum + sale.amountCents, 0);
    let sales = inBucket.length;
    const customers = new Set(inBucket.map((sale) => sale.customerId)).size;

    if (sales === 0 && userId === MIRA_ID) {
      revenueCents = Math.round(18000 + rand() * 42000);
      sales = 2 + Math.floor(rand() * 8);
    }

    points.push({
      label: formatTick(end, range),
      date: end.toISOString(),
      revenueCents,
      sales,
      customers: customers || Math.max(1, Math.round(sales * 0.7)),
    });
  }

  return points;
}

function categoryLabel(slug: string): string {
  return categories.find((category) => category.slug === slug)?.label ?? slug;
}

export async function delay(ms = 360): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function listStudioProducts(userId: string): StudioProduct[] {
  return [...productsFor(userId)].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function getStudioProduct(userId: string, id: string): StudioProduct | null {
  return productsFor(userId).find((product) => product.id === id) ?? null;
}

export function listStudioSales(userId: string): StudioSale[] {
  return [...salesFor(userId)];
}

export function listStudioCustomers(userId: string): StudioCustomer[] {
  const paid = salesFor(userId).filter((sale) => sale.status === "paid");
  const map = new Map<string, StudioCustomer>();

  for (const sale of paid) {
    const current = map.get(sale.customerId);
    if (!current) {
      map.set(sale.customerId, {
        id: sale.customerId,
        name: sale.customerName,
        email: sale.customerEmail,
        avatarUrl: sale.customerAvatarUrl,
        purchaseCount: 1,
        totalSpentCents: sale.amountCents,
        lastPurchaseAt: sale.purchasedAt,
      });
      continue;
    }
    current.purchaseCount += 1;
    current.totalSpentCents += sale.amountCents;
    if (new Date(sale.purchasedAt) > new Date(current.lastPurchaseAt)) {
      current.lastPurchaseAt = sale.purchasedAt;
    }
  }

  return [...map.values()].sort((a, b) => b.totalSpentCents - a.totalSpentCents);
}

export function getStudioSettings(userId: string): StudioSettings {
  return { ...settingsFor(userId) };
}

export function saveStudioSettings(
  userId: string,
  next: StudioSettings,
): StudioSettings {
  memory().settings.set(userId, { ...next });
  return { ...next };
}

export function getStudioOverview(userId: string): StudioOverview {
  const products = listStudioProducts(userId);
  const sales = listStudioSales(userId);
  const customers = listStudioCustomers(userId);
  const paid = sales.filter((sale) => sale.status === "paid");
  const revenueCents = paid.reduce((sum, sale) => sum + sale.amountCents, 0);
  const published = products.filter((product) => product.status === "published");

  const series = {
    daily: buildSeries(userId, "daily"),
    weekly: buildSeries(userId, "weekly"),
    monthly: buildSeries(userId, "monthly"),
    yearly: buildSeries(userId, "yearly"),
  } as const;

  return {
    metrics: {
      revenueCents,
      revenueChange: products.length ? 0.12 : 0,
      salesCount: paid.length,
      salesChange: products.length ? 0.08 : 0,
      productCount: published.length,
      productChange: published.length ? 0.25 : 0,
      customerCount: customers.length,
      customerChange: customers.length ? 0.06 : 0,
    },
    series,
    recentSales: sales.slice(0, 6),
    topProducts: [...published]
      .sort((a, b) => b.revenueCents - a.revenueCents)
      .slice(0, 5),
  };
}

export function getStudioAnalytics(userId: string): StudioAnalytics {
  const products = listStudioProducts(userId);
  const overview = getStudioOverview(userId);
  const views = products.reduce((sum, product) => sum + product.views, 0);
  const purchases = overview.metrics.salesCount;
  const checkouts = Math.round(purchases * 1.35 + (products.length ? 12 : 0));
  const funnel: ConversionFunnel = {
    views: views || (products.length ? 2400 : 0),
    checkouts,
    purchases,
  };
  const productPerformance: ProductPerformancePoint[] = [...products]
    .filter((product) => product.status !== "archived")
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, 6)
    .map((product) => ({
      productId: product.id,
      title: product.title,
      revenueCents: product.revenueCents,
      sales: product.salesCount,
    }));

  return {
    series: overview.series,
    productPerformance,
    funnel,
    conversionRate: funnel.views ? funnel.purchases / funnel.views : 0,
  };
}

function fromDraft(
  draft: StudioProductDraft,
  status: StudioProductStatus,
  existing?: StudioProduct,
): StudioProduct {
  const now = new Date().toISOString();
  const slug = existing?.slug ?? slugFromTitle(draft.title);
  return {
    id: existing?.id ?? `sp_${Math.random().toString(16).slice(2, 10)}`,
    slug,
    title: draft.title,
    shortDescription: draft.shortDescription,
    description: draft.description,
    kind: draft.kind,
    categorySlug: draft.categorySlug,
    categoryLabel: categoryLabel(draft.categorySlug),
    coverUrl: draft.coverUrl,
    gallery: draft.gallery,
    files: draft.files,
    status,
    pricingModel: draft.pricingModel,
    priceCents:
      draft.pricingModel === "free"
        ? 0
        : draft.pricingModel === "pwyw"
          ? draft.suggestedPriceCents
          : draft.priceCents,
    suggestedPriceCents: draft.suggestedPriceCents,
    minPriceCents: draft.minPriceCents,
    currency: draft.currency,
    salesCount: existing?.salesCount ?? 0,
    revenueCents: existing?.revenueCents ?? 0,
    views: existing?.views ?? 0,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

function slugFromTitle(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || `product-${Date.now()}`;
}

export function upsertStudioProduct(
  userId: string,
  draft: StudioProductDraft,
  status: StudioProductStatus,
  productId?: string,
): StudioProduct {
  const list = productsFor(userId);
  const existing = productId
    ? list.find((product) => product.id === productId)
    : undefined;
  const next = fromDraft(draft, status, existing);
  const store = memory();
  const current = productsFor(userId);
  const index = current.findIndex((product) => product.id === next.id);
  if (index === -1) {
    store.products.set(userId, [next, ...current]);
  } else {
    const copy = [...current];
    copy[index] = next;
    store.products.set(userId, copy);
  }
  return next;
}

export function duplicateStudioProduct(
  userId: string,
  productId: string,
): StudioProduct | null {
  const product = getStudioProduct(userId, productId);
  if (!product) return null;
  const copy: StudioProduct = {
    ...product,
    id: `sp_${Math.random().toString(16).slice(2, 10)}`,
    slug: `${product.slug}-copy`,
    title: `${product.title} (copy)`,
    status: "draft",
    salesCount: 0,
    revenueCents: 0,
    views: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  memory().products.set(userId, [copy, ...productsFor(userId)]);
  return copy;
}

export function archiveStudioProduct(
  userId: string,
  productId: string,
): StudioProduct | null {
  const list = productsFor(userId);
  const index = list.findIndex((product) => product.id === productId);
  const product = list[index];
  if (index === -1 || !product) return null;
  const next: StudioProduct = {
    ...product,
    status: product.status === "archived" ? "draft" : "archived",
    updatedAt: new Date().toISOString(),
  };
  const copy = [...list];
  copy[index] = next;
  memory().products.set(userId, copy);
  return next;
}

export function deleteStudioProduct(userId: string, productId: string): boolean {
  const list = productsFor(userId);
  const next = list.filter((product) => product.id !== productId);
  if (next.length === list.length) return false;
  memory().products.set(userId, next);
  return true;
}

export function setStudioProductStatus(
  userId: string,
  productId: string,
  status: StudioProductStatus,
): StudioProduct | null {
  const list = productsFor(userId);
  const index = list.findIndex((product) => product.id === productId);
  const product = list[index];
  if (index === -1 || !product) return null;
  const next: StudioProduct = {
    ...product,
    status,
    updatedAt: new Date().toISOString(),
  };
  const copy = [...list];
  copy[index] = next;
  memory().products.set(userId, copy);
  return next;
}
