"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { featuredCreators, getFeaturedProducts } from "@/lib/mock/catalog";
import { cn } from "@/lib/utils";

const products = getFeaturedProducts().slice(0, 3);
const creator = featuredCreators[0];

export function HeroShowcase() {
  const reduceMotion = useReducedMotion();
  const [lead, second, third] = products;
  const enter = reduceMotion
    ? undefined
    : { opacity: 0, y: 18 };

  if (!lead || !second || !third) {
    return null;
  }

  return (
    <div className="grid gap-3 pb-4 sm:grid-cols-[1.15fr_0.85fr] sm:gap-4">
      <motion.div
        initial={enter}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
      >
        <ShowcaseCard product={lead} priority className="aspect-[4/5] sm:aspect-[4/5]" />
      </motion.div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-1 sm:gap-4">
        <motion.div
          initial={enter}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <ShowcaseCard product={second} className="aspect-[4/3] sm:aspect-[16/10]" />
        </motion.div>
        <motion.div
          initial={enter}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <ShowcaseCard product={third} className="aspect-[4/3] sm:aspect-[16/10]" />
          <Link
            href={`/creators/${creator.slug}`}
            className="absolute -bottom-3 left-3 flex items-center gap-2 rounded-full border border-border bg-card py-1.5 pr-3 pl-1.5 shadow-sm sm:left-4"
          >
            <span className="relative size-7 overflow-hidden rounded-full">
              <Image
                src={creator.avatarUrl}
                alt=""
                fill
                sizes="28px"
                className="object-cover"
              />
            </span>
            <span className="pr-1 text-xs">
              <span className="block font-medium">{creator.name}</span>
              <span className="text-muted-foreground">just published</span>
            </span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

function ShowcaseCard({
  product,
  className,
  priority = false,
}: {
  product: (typeof products)[number];
  className?: string;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative block overflow-hidden rounded-xl bg-muted"
    >
      <span className={cn("relative block", className)}>
        <Image
          src={product.imageUrl}
          alt={product.title}
          fill
          priority={priority}
          sizes="(max-width: 1024px) 90vw, 480px"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
      </span>
      <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-3 sm:p-4">
        <span className="block text-sm font-medium text-white">{product.title}</span>
        <span className="text-xs text-white/75">
          {formatPrice(product.priceCents, product.currency)} · {product.creator.name}
        </span>
      </span>
    </Link>
  );
}
