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
  fileCount?: number;
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
  id?: string;
  slug: string;
  label: string;
  description: string;
  imageUrl: string;
  productCount: number;
  icon: CategoryIcon;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type FeaturedCreator = CreatorSummary & {
  coverUrl: string;
  bio: string;
  storeName?: string;
  productCount: number;
  followerCount: number;
};

export type CreatorProfile = FeaturedCreator;

export type IncludeIcon =
  | "video"
  | "layers"
  | "code"
  | "refresh"
  | "users"
  | "file"
  | "book"
  | "image"
  | "audio"
  | "sparkles"
  | "layout"
  | "download";

export type IncludedItem = {
  id: string;
  label: string;
  detail?: string;
  icon: IncludeIcon;
};

export type ProductReview = {
  id: string;
  productId: string;
  authorName: string;
  authorAvatarUrl: string;
  rating: number;
  body: string;
  createdAt: string;
};

export type ProductDetail = Product & {
  images: string[];
  highlights: string[];
  audience: string[];
  outcomes: string[];
  includedItems: IncludedItem[];
  paragraphs: string[];
  reviews: ProductReview[];
};

export type Testimonial = {
  id: string;
  quote: string;
  name: string;
  role: string;
  avatarUrl: string;
};

export type ProductCardLayout = "default" | "compact" | "featured";
