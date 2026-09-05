import { PrismaClient, ProductType, Currency, ProductStatus, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const img = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const DEV_PASSWORD = "password12";

async function main() {
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productFile.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.creatorProfile.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 12);

  const categories = await Promise.all(
    [
      ["ai", "AI & Technology", "Prompt libraries, workflows, and model kits.", "photo-1677442136019-21780ecad995", "ai"],
      ["design", "Design", "UI kits, Figma files, and brand systems.", "photo-1561070791-2526d30994b5", "design"],
      ["development", "Development", "Starters, snippets, and engineering notes.", "photo-1555066931-4365d14bab8c", "development"],
      ["business", "Business", "Contracts, decks, and studio operating systems.", "photo-1454165804606-c3d57bc86b40", "business"],
      ["education", "Education", "Workshops, ateliers, and recorded courses.", "photo-1523580494863-6f3031224c94", "education"],
      ["photography", "Photography", "Presets, lookbooks, and shooting guides.", "photo-1500530855697-b586d89ba3ee", "photography"],
      ["music", "Music", "Sample packs, scores, and sound design.", "photo-1511379938547-c1f69419868d", "music"],
      ["writing", "Writing", "Ebooks, newsletters, and paid essays.", "photo-1455390582262-044cdead277a", "writing"],
      ["productivity", "Productivity", "Operating systems for a quieter week.", "photo-1484480974693-6ca0a78fb36b", "productivity"],
      ["marketing", "Marketing", "Positioning, launch kits, and campaign systems.", "photo-1460925895917-afdab827c52f", "business"],
    ].map(([slug, label, description, photo, icon], index) =>
      prisma.category.create({
        data: {
          slug,
          label,
          description,
          imageUrl: img(photo),
          icon,
          sortOrder: index,
        },
      }),
    ),
  );

  const bySlug = Object.fromEntries(categories.map((category) => [category.slug, category]));

  const admin = await prisma.user.create({
    data: {
      name: "Lumen Ops",
      email: "admin@example.com",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const leah = await prisma.user.create({
    data: {
      name: "Leah Okonkwo",
      email: "leah@example.com",
      passwordHash,
      role: Role.CUSTOMER,
    },
  });

  const owen = await prisma.user.create({
    data: {
      name: "Owen Park",
      email: "owen@example.com",
      passwordHash,
      role: Role.CUSTOMER,
    },
  });

  const sofia = await prisma.user.create({
    data: {
      name: "Sofia Almeida",
      email: "sofia@example.com",
      passwordHash,
      role: Role.CUSTOMER,
    },
  });

  const miraUser = await prisma.user.create({
    data: {
      name: "Mira Chen",
      email: "mira@example.com",
      passwordHash,
      role: Role.CREATOR,
      avatarUrl: img("photo-1494790108377-be9c29b29330", 200),
      creatorProfile: {
        create: {
          displayName: "Mira Chen",
          storeName: "Northline Studio",
          slug: "mira",
          bio: "Typography and interface systems for studios that still print.",
          category: "design",
          avatar: img("photo-1494790108377-be9c29b29330", 200),
        },
      },
    },
    include: { creatorProfile: true },
  });

  const kenjiUser = await prisma.user.create({
    data: {
      name: "Kenji Mori",
      email: "kenji@example.com",
      passwordHash,
      role: Role.CREATOR,
      avatarUrl: img("photo-1500648767791-00dcc994a43e", 200),
      creatorProfile: {
        create: {
          displayName: "Kenji Mori",
          storeName: "Mori Atelier",
          slug: "kenji",
          bio: "Application architecture, sold as repos you can actually ship.",
          category: "development",
          avatar: img("photo-1500648767791-00dcc994a43e", 200),
        },
      },
    },
    include: { creatorProfile: true },
  });

  const julianUser = await prisma.user.create({
    data: {
      name: "Julian Voss",
      email: "julian@example.com",
      passwordHash,
      role: Role.CREATOR,
      avatarUrl: img("photo-1507003211169-0a1dd7228f2d", 200),
      creatorProfile: {
        create: {
          displayName: "Julian Voss",
          storeName: "Voss Atelier",
          slug: "julian",
          bio: "Editorial photography and film-inspired color science.",
          category: "photography",
          avatar: img("photo-1507003211169-0a1dd7228f2d", 200),
        },
      },
    },
    include: { creatorProfile: true },
  });

  const ashaUser = await prisma.user.create({
    data: {
      name: "Asha Raman",
      email: "asha@example.com",
      passwordHash,
      role: Role.CREATOR,
      avatarUrl: img("photo-1531123897727-8f129e1688ce", 200),
      creatorProfile: {
        create: {
          displayName: "Asha Raman",
          storeName: "Raman Field Notes",
          slug: "asha",
          bio: "Launch systems and sample libraries for independent studios.",
          category: "marketing",
          avatar: img("photo-1531123897727-8f129e1688ce", 200),
        },
      },
    },
    include: { creatorProfile: true },
  });

  const mira = miraUser.creatorProfile!;
  const kenji = kenjiUser.creatorProfile!;
  const julian = julianUser.creatorProfile!;
  const asha = ashaUser.creatorProfile!;

  type SeedProduct = {
    creatorId: string;
    category: string;
    slug: string;
    title: string;
    shortDescription: string;
    description: string;
    price: number;
    type: ProductType;
    cover: string;
    featured?: boolean;
    trending?: boolean;
    editorsPick?: boolean;
  };

  const catalog: SeedProduct[] = [
    {
      creatorId: mira.id,
      category: "design",
      slug: "northline-ui-system",
      title: "Northline UI System",
      shortDescription: "A complete Figma kit for modern SaaS products.",
      description:
        "240+ components, 18 screens, and a ruthless type scale — built for teams who care how software feels.",
      price: 7900,
      type: ProductType.TEMPLATE,
      cover: "photo-1558655146-9f40138edfeb",
      featured: true,
      trending: true,
      editorsPick: true,
    },
    {
      creatorId: mira.id,
      category: "ai",
      slug: "prompt-atelier",
      title: "Prompt Atelier",
      shortDescription: "A working library of image and copy systems.",
      description:
        "Structured briefs, negative vocabularies, and the stacks used for campaign stills.",
      price: 3900,
      type: ProductType.DIGITAL_DOWNLOAD,
      cover: "photo-1677442136019-21780ecad995",
      featured: true,
      trending: true,
    },
    {
      creatorId: mira.id,
      category: "ai",
      slug: "ai-prompt-engineering-toolkit",
      title: "AI Prompt Engineering Toolkit",
      shortDescription: "Briefs, evals, and a library you can hand to a junior.",
      description: "The working kit for campaign stills, product copy, and stubborn model drift.",
      price: 5900,
      type: ProductType.COURSE,
      cover: "photo-1620712943543-bcc4688e7485",
      trending: true,
      editorsPick: true,
    },
    {
      creatorId: mira.id,
      category: "design",
      slug: "sunday-market-type",
      title: "Sunday Market Type",
      shortDescription: "A display family with the warmth of painted shop signs.",
      description: "Six weights, stylistic sets, and the specimen printed for a Lisbon grocer.",
      price: 8900,
      type: ProductType.DIGITAL_DOWNLOAD,
      cover: "photo-1561070791-2526d30994b5",
      editorsPick: true,
    },
    {
      creatorId: mira.id,
      category: "design",
      slug: "brand-archive",
      title: "Brand Archive",
      shortDescription: "A modern SaaS UI kit for companies that still want a mark.",
      description: "Logo construction, color stories, and 24 screens — less dashboard, more object.",
      price: 5500,
      type: ProductType.BUNDLE,
      cover: "photo-1618005182384-a83a8bd57fbe",
    },
    {
      creatorId: kenji.id,
      category: "development",
      slug: "atlas-next-starter",
      title: "Atlas Next Starter",
      shortDescription: "Production-grade App Router scaffolding.",
      description: "Typed env, Prisma, and a storefront layout that is not another dashboard.",
      price: 6900,
      type: ProductType.TEMPLATE,
      cover: "photo-1555066931-4365d14bab8c",
      featured: true,
      trending: true,
    },
    {
      creatorId: kenji.id,
      category: "business",
      slug: "studio-operating-system",
      title: "Studio Operating System",
      shortDescription: "Contracts, invoices, and a weekly rhythm.",
      description: "The paperwork a two-person practice actually uses.",
      price: 4900,
      type: ProductType.TEMPLATE,
      cover: "photo-1454165804606-c3d57bc86b40",
      featured: true,
    },
    {
      creatorId: kenji.id,
      category: "development",
      slug: "observability-notebook",
      title: "Observability Notebook",
      shortDescription: "Logging, tracing, and on-call notes.",
      description: "A field guide for the week after you ship.",
      price: 2900,
      type: ProductType.DIGITAL_DOWNLOAD,
      cover: "photo-1517694712202-14dd9538aa97",
    },
    {
      creatorId: kenji.id,
      category: "education",
      slug: "typed-api-atelier",
      title: "Typed API Atelier",
      shortDescription: "A course on designing APIs people enjoy calling.",
      description: "Eight lessons from client work, not a certification track.",
      price: 12900,
      type: ProductType.COURSE,
      cover: "photo-1516321318423-f06f85e504b3",
    },
    {
      creatorId: kenji.id,
      category: "productivity",
      slug: "monday-systems",
      title: "Monday Systems",
      shortDescription: "A quieter operating system for the week.",
      description: "Calendars, reviews, and the one list that actually gets used.",
      price: 2400,
      type: ProductType.TEMPLATE,
      cover: "photo-1484480974693-6ca0a78fb36b",
    },
    {
      creatorId: julian.id,
      category: "photography",
      slug: "editorial-lookbook-kit",
      title: "Editorial Lookbook Kit",
      shortDescription: "Lightroom presets and print-ready grids.",
      description: "Twelve film-inspired profiles used on the last three commissions.",
      price: 4500,
      type: ProductType.DIGITAL_DOWNLOAD,
      cover: "photo-1490481651871-ab68de25d43d",
    },
    {
      creatorId: julian.id,
      category: "photography",
      slug: "northwest-light",
      title: "Northwest Light",
      shortDescription: "A shooting guide for overcast coast.",
      description: "Metering notes, locations, and the hours that actually work.",
      price: 3500,
      type: ProductType.COURSE,
      cover: "photo-1500530855697-b586d89ba3ee",
      featured: true,
    },
    {
      creatorId: julian.id,
      category: "photography",
      slug: "contact-sheet-templates",
      title: "Contact Sheet Templates",
      shortDescription: "InDesign sheets for analog and digital.",
      description: "The layout used when a magazine still asks for a board.",
      price: 1900,
      type: ProductType.TEMPLATE,
      cover: "photo-1452583381412-49b7d4b4c0c0",
    },
    {
      creatorId: mira.id,
      category: "writing",
      slug: "atelier-notes-2025",
      title: "Atelier Notes 2025",
      shortDescription: "A year of studio essays.",
      description: "Weekly notes, retired from the shelf but kept for existing buyers.",
      price: 1200,
      type: ProductType.DIGITAL_DOWNLOAD,
      cover: "photo-1455390582262-044cdead277a",
    },
    {
      creatorId: kenji.id,
      category: "development",
      slug: "edge-auth-patterns",
      title: "Edge Auth Patterns",
      shortDescription: "Cookies, sessions, and the boring parts.",
      description: "What actually holds up when you stop storing JWTs in localStorage.",
      price: 4200,
      type: ProductType.DIGITAL_DOWNLOAD,
      cover: "photo-1555066931-4365d14bab8c",
    },
    {
      creatorId: julian.id,
      category: "education",
      slug: "color-science-workshop",
      title: "Color Science Workshop",
      shortDescription: "Film emulation without the folklore.",
      description: "A recorded atelier on LUTs, display-referred color, and print.",
      price: 8900,
      type: ProductType.COURSE,
      cover: "photo-1500534314210-a0fc50d8c2d8",
    },
    {
      creatorId: mira.id,
      category: "design",
      slug: "northline-specimen",
      title: "Northline Specimen",
      shortDescription: "Print-ready type sheets for the Northline family.",
      description: "A quiet companion to the UI system — grids, optical sizes, and press notes.",
      price: 0,
      type: ProductType.DIGITAL_DOWNLOAD,
      cover: "photo-1455390582262-044cdead277a",
    },
    {
      creatorId: kenji.id,
      category: "business",
      slug: "client-kickoff-kit",
      title: "Client Kickoff Kit",
      shortDescription: "The first two weeks, as a packet.",
      description: "Agenda, scope, and the questions that prevent a rewrite.",
      price: 2700,
      type: ProductType.BUNDLE,
      cover: "photo-1454165804606-c3d57bc86b40",
    },
    {
      creatorId: asha.id,
      category: "marketing",
      slug: "campaign-narrative-system",
      title: "Campaign Narrative System",
      shortDescription: "A positioning kit for launches that need a spine.",
      description:
        "Offer architecture, landing-page outlines, and the email sequence used on three paid drops.",
      price: 6400,
      type: ProductType.TEMPLATE,
      cover: "photo-1460925895917-afdab827c52f",
      featured: true,
      trending: true,
    },
    {
      creatorId: asha.id,
      category: "marketing",
      slug: "quiet-launch-calendar",
      title: "Quiet Launch Calendar",
      shortDescription: "Six weeks of shipping without a splash page panic.",
      description: "A calendar, checklists, and the copy blocks that actually get sent.",
      price: 2800,
      type: ProductType.TEMPLATE,
      cover: "photo-1484480974693-6ca0a78fb36b",
    },
    {
      creatorId: asha.id,
      category: "music",
      slug: "dusk-sample-library",
      title: "Dusk Sample Library",
      shortDescription: "Tape-worn loops and room tone from a Goa evening.",
      description: "Forty-eight loops, dry drums, and the field recordings behind them.",
      price: 3200,
      type: ProductType.DIGITAL_DOWNLOAD,
      cover: "photo-1511379938547-c1f69419868d",
      trending: true,
    },
    {
      creatorId: asha.id,
      category: "writing",
      slug: "field-notes-on-selling",
      title: "Field Notes on Selling",
      shortDescription: "Essays for people who dislike funnels.",
      description: "Twelve letters on pricing, taste, and the email you send after a no.",
      price: 1800,
      type: ProductType.DIGITAL_DOWNLOAD,
      cover: "photo-1455390582262-044cdead277a",
    },
    {
      creatorId: julian.id,
      category: "photography",
      slug: "film-grain-pack",
      title: "Film Grain Pack",
      shortDescription: "Scanned grain overlays from leftover rolls.",
      description: "Sixteen overlays, sized for stills and a 4K timeline.",
      price: 2200,
      type: ProductType.DIGITAL_DOWNLOAD,
      cover: "photo-1490481651871-ab68de25d43d",
    },
    {
      creatorId: kenji.id,
      category: "development",
      slug: "react-patterns-field-notes",
      title: "React Patterns Field Notes",
      shortDescription: "The patterns that survived production, not Twitter.",
      description: "Server components, forms, and the cache bugs that taught us manners.",
      price: 4700,
      type: ProductType.COURSE,
      cover: "photo-1633356122544-f134324a6cee",
      editorsPick: true,
    },
    {
      creatorId: mira.id,
      category: "productivity",
      slug: "studio-week-os",
      title: "Studio Week OS",
      shortDescription: "A Notion system that does not feel like homework.",
      description: "Capacity, shipping, and the Friday review that actually happens.",
      price: 2100,
      type: ProductType.TEMPLATE,
      cover: "photo-1484480974693-6ca0a78fb36b",
    },
    {
      creatorId: mira.id,
      category: "education",
      slug: "type-critique-atelier",
      title: "Type Critique Atelier",
      shortDescription: "A recorded workshop on pairing and optical size.",
      description: "Four sessions from the Northline desk, with the homework files included.",
      price: 9900,
      type: ProductType.COURSE,
      cover: "photo-1523580494863-6f3031224c94",
      featured: true,
    },
  ];

  const products = [];
  for (const item of catalog) {
    const category = bySlug[item.category];
    if (!category) throw new Error(`Missing category ${item.category}`);
    const product = await prisma.product.create({
      data: {
        creatorId: item.creatorId,
        categoryId: category.id,
        title: item.title,
        slug: item.slug,
        shortDescription: item.shortDescription,
        description: item.description,
        price: item.price,
        currency: Currency.USD,
        productType: item.type,
        status: ProductStatus.PUBLISHED,
        coverImage: img(item.cover),
        featured: Boolean(item.featured),
        trending: Boolean(item.trending),
        editorsPick: Boolean(item.editorsPick),
        images: {
          create: [{ url: img(item.cover), publicId: `marketplace/products/${item.slug}/images/cover`, sortOrder: 0 }],
        },
        files: {
          create: [
            {
              fileName: `${item.slug}.zip`,
              publicId: `marketplace/products/${item.slug}/files/source`,
              resourceType: "raw",
              format: "zip",
              fileSize: 12_000_000,
              mimeType: "application/zip",
              isPrivate: true,
            },
          ],
        },
      },
    });
    products.push(product);
  }

  const northline = products.find((product) => product.slug === "northline-ui-system");
  const atlas = products.find((product) => product.slug === "atlas-next-starter");
  const campaign = products.find((product) => product.slug === "campaign-narrative-system");
  const promptAtelier = products.find((product) => product.slug === "prompt-atelier");
  if (!northline || !atlas || !campaign || !promptAtelier) {
    throw new Error("Seed products missing");
  }

  await prisma.product.create({
    data: {
      creatorId: mira.id,
      categoryId: bySlug.design.id,
      title: "Unreleased Type Experiments",
      slug: "unreleased-type-experiments",
      shortDescription: "A private specimen, not for the marketplace yet.",
      description:
        "Draft sketches and failed pairings. This listing stays unpublished so the catalog stays edited.",
      price: 0,
      currency: Currency.USD,
      productType: ProductType.DIGITAL_DOWNLOAD,
      status: ProductStatus.DRAFT,
      coverImage: img("photo-1561070791-2526d30994b5"),
    },
  });

  const order = await prisma.order.create({
    data: {
      customerId: leah.id,
      subtotal: northline.price,
      totalAmount: northline.price,
      currency: Currency.USD,
      status: "PAID",
      items: {
        create: [
          {
            productId: northline.id,
            creatorId: mira.id,
            productTitle: northline.title,
            price: northline.price,
            quantity: 1,
          },
        ],
      },
      payment: {
        create: {
          provider: "RAZORPAY",
          providerPaymentId: "pay_seed_leah_northline",
          amount: northline.price,
          currency: Currency.USD,
          status: "PAID",
        },
      },
    },
  });

  await prisma.order.create({
    data: {
      customerId: owen.id,
      subtotal: atlas.price,
      totalAmount: atlas.price,
      currency: Currency.USD,
      status: "PAID",
      items: {
        create: [
          {
            productId: atlas.id,
            creatorId: kenji.id,
            productTitle: atlas.title,
            price: atlas.price,
            quantity: 1,
          },
        ],
      },
      payment: {
        create: {
          provider: "RAZORPAY",
          providerPaymentId: "pay_seed_owen_atlas",
          amount: atlas.price,
          currency: Currency.USD,
          status: "PAID",
        },
      },
    },
  });

  await prisma.order.create({
    data: {
      customerId: sofia.id,
      subtotal: campaign.price + promptAtelier.price,
      totalAmount: campaign.price + promptAtelier.price,
      currency: Currency.USD,
      status: "PAID",
      items: {
        create: [
          {
            productId: campaign.id,
            creatorId: asha.id,
            productTitle: campaign.title,
            price: campaign.price,
            quantity: 1,
          },
          {
            productId: promptAtelier.id,
            creatorId: mira.id,
            productTitle: promptAtelier.title,
            price: promptAtelier.price,
            quantity: 1,
          },
        ],
      },
      payment: {
        create: {
          provider: "RAZORPAY",
          providerPaymentId: "pay_seed_sofia_campaign",
          amount: campaign.price + promptAtelier.price,
          currency: Currency.USD,
          status: "PAID",
        },
      },
    },
  });

  await prisma.order.create({
    data: {
      customerId: leah.id,
      subtotal: campaign.price,
      totalAmount: campaign.price,
      currency: Currency.USD,
      status: "PAID",
      items: {
        create: [
          {
            productId: campaign.id,
            creatorId: asha.id,
            productTitle: campaign.title,
            price: campaign.price,
            quantity: 1,
          },
        ],
      },
      payment: {
        create: {
          provider: "RAZORPAY",
          providerPaymentId: "pay_seed_leah_campaign",
          amount: campaign.price,
          currency: Currency.USD,
          status: "PAID",
        },
      },
    },
  });

  const paidOrders = await prisma.order.findMany({
    where: { status: "PAID" },
    include: { items: true },
  });
  await prisma.purchase.createMany({
    data: paidOrders.flatMap((paid) =>
      paid.items.map((item) => ({
        userId: paid.customerId,
        productId: item.productId,
        orderId: paid.id,
      })),
    ),
    skipDuplicates: true,
  });

  await prisma.review.create({
    data: {
      productId: northline.id,
      userId: leah.id,
      rating: 5,
      comment: "The type scale alone is worth it. Feels like a studio, not a kit dump.",
    },
  });

  await prisma.review.create({
    data: {
      productId: atlas.id,
      userId: owen.id,
      rating: 5,
      comment: "Started a client repo the same afternoon. The holes were already dug.",
    },
  });

  await prisma.review.create({
    data: {
      productId: campaign.id,
      userId: sofia.id,
      rating: 5,
      comment: "Finally a launch kit that does not smell like a funnel course.",
    },
  });

  await prisma.review.create({
    data: {
      productId: promptAtelier.id,
      userId: sofia.id,
      rating: 4,
      comment: "The negative vocabularies saved a week of guessing.",
    },
  });

  await prisma.cart.create({
    data: {
      customerId: sofia.id,
      items: {
        create: [{ productId: northline.id, quantity: 1 }],
      },
    },
  });

  console.log("Seeded Lumen development data.");
  console.log("Dev password for all accounts: password12");
  console.log({
    admin: admin.email,
    creators: [miraUser.email, kenjiUser.email, julianUser.email, ashaUser.email],
    customers: [leah.email, owen.email, sofia.email],
    products: products.length,
    order: order.id,
  });
}

void main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
