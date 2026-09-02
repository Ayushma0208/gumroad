export type Currency = "USD" | "INR";

export type ProductType = "kit" | "course" | "pack" | "template" | "ebook";

export type CreatorSummary = {
  id: string;
  name: string;
  slug: string;
  avatarUrl: string;
  headline?: string;
};

export type Product = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  priceCents: number;
  currency: Currency;
  imageUrl: string;
  categorySlug: string;
  categoryLabel: string;
  productType: ProductType;
  createdAt: string;
  rating: number;
  reviewCount: number;
  salesCount: number;
  featured?: boolean;
  trending?: boolean;
  editorsPick?: boolean;
  creator: CreatorSummary;
};

export type CategoryIcon =
  | "design"
  | "development"
  | "ai"
  | "business"
  | "photography"
  | "music"
  | "education"
  | "writing"
  | "productivity";

export type Category = {
  slug: string;
  label: string;
  description: string;
  imageUrl: string;
  productCount: number;
  icon: CategoryIcon;
};

export type FeaturedCreator = CreatorSummary & {
  coverUrl: string;
  bio: string;
  productCount: number;
  followerCount: number;
};

export type Testimonial = {
  id: string;
  quote: string;
  name: string;
  role: string;
  avatarUrl: string;
};

export type ProductCardLayout = "default" | "compact" | "featured";
