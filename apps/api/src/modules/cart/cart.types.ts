import type { Currency, ProductType } from "@prisma/client";

export const DIGITAL_PRODUCT_TYPES: readonly ProductType[] = [
  "DIGITAL_DOWNLOAD",
  "COURSE",
  "TEMPLATE",
  "BUNDLE",
] as const;

export function isDigitalProduct(type: ProductType) {
  return DIGITAL_PRODUCT_TYPES.includes(type);
}

export type CartProductSnapshot = {
  id: string;
  title: string;
  slug: string;
  coverImage: string;
  price: number;
  priceCents: number;
  currency: Currency;
  productType: ProductType;
  available: boolean;
  creator: {
    storeName: string;
    slug: string;
  };
};

export type CartItemDto = {
  id: string;
  quantity: number;
  subtotal: number;
  subtotalCents: number;
  product: CartProductSnapshot;
};

export type CartSummary = {
  subtotal: number;
  subtotalCents: number;
  discount: number;
  discountCents: number;
  total: number;
  totalCents: number;
  currency: Currency;
  itemCount: number;
};

export type CartDto = {
  id: string;
  items: CartItemDto[];
  summary: CartSummary;
};

type CartRecord = {
  id: string;
  items: Array<{
    id: string;
    quantity: number;
    product: {
      id: string;
      title: string;
      slug: string;
      coverImage: string;
      price: number;
      currency: Currency;
      productType: ProductType;
      status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
      creator: { storeName: string; slug: string };
    };
  }>;
};

function dollars(cents: number) {
  return Number((cents / 100).toFixed(2));
}

export function serializeCart(cart: CartRecord): CartDto {
  const items: CartItemDto[] = cart.items.map((item) => {
    const available = item.product.status === "PUBLISHED";
    const quantity = isDigitalProduct(item.product.productType)
      ? 1
      : item.quantity;
    const lineCents = available ? item.product.price * quantity : 0;
    return {
      id: item.id,
      quantity,
      subtotal: dollars(lineCents),
      subtotalCents: lineCents,
      product: {
        id: item.product.id,
        title: item.product.title,
        slug: item.product.slug,
        coverImage: item.product.coverImage,
        price: dollars(item.product.price),
        priceCents: item.product.price,
        currency: item.product.currency,
        productType: item.product.productType,
        available,
        creator: {
          storeName: item.product.creator.storeName,
          slug: item.product.creator.slug,
        },
      },
    };
  });

  const payable = items.filter((item) => item.product.available);
  const subtotalCents = payable.reduce((sum, item) => sum + item.subtotalCents, 0);
  const currency = payable[0]?.product.currency ?? items[0]?.product.currency ?? "USD";

  return {
    id: cart.id,
    items,
    summary: {
      subtotal: dollars(subtotalCents),
      subtotalCents,
      discount: 0,
      discountCents: 0,
      total: dollars(subtotalCents),
      totalCents: subtotalCents,
      currency,
      itemCount: payable.length,
    },
  };
}
