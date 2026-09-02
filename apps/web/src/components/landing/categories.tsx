import {
  BookOpen,
  Briefcase,
  Camera,
  Code2,
  GraduationCap,
  ListChecks,
  Music,
  PenTool,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Container, Section } from "@/components/layout/container";
import { SectionHeading } from "@/components/layout/section-heading";
import { FadeIn } from "@/components/motion/fade-in";
import { formatCompactNumber } from "@/lib/format";
import { categories } from "@/lib/mock/catalog";
import { cn } from "@/lib/utils";
import type { CategoryIcon } from "@/types/catalog";

const icons: Record<CategoryIcon, LucideIcon> = {
  design: PenTool,
  development: Code2,
  ai: Sparkles,
  business: Briefcase,
  photography: Camera,
  music: Music,
  education: GraduationCap,
  writing: BookOpen,
  productivity: ListChecks,
};

export function LandingCategories() {
  return (
    <Section id="categories" className="scroll-mt-24 bg-card/40">
      <Container>
        <FadeIn>
          <SectionHeading
            eyebrow="Categories"
            title="Rooms, not a tag cloud."
            description="Find a discipline, then stay there."
            className="mb-12"
          />
        </FadeIn>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {categories.map((category, index) => {
            const Icon = icons[category.icon];
            const photo = index % 2 === 0;

            return (
              <FadeIn key={category.slug} delay={index * 0.04}>
                <Link
                  href={`/discover?category=${category.slug}`}
                  className={cn(
                    "group relative flex min-h-[11rem] flex-col justify-between overflow-hidden rounded-xl border border-border p-4 sm:min-h-[13.5rem] sm:p-5",
                    photo ? "text-white" : "bg-background",
                  )}
                >
                  {photo ? (
                    <>
                      <Image
                        src={category.imageUrl}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 50vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <span className="absolute inset-0 bg-black/40 transition-colors group-hover:bg-black/48" />
                    </>
                  ) : (
                    <Icon className="relative size-5 text-brand" />
                  )}
                  <span className="relative font-display text-2xl tracking-tight sm:text-[1.85rem]">
                    {category.label}
                  </span>
                  <span
                    className={cn(
                      "relative text-sm",
                      photo ? "text-white/80" : "text-muted-foreground",
                    )}
                  >
                    {formatCompactNumber(category.productCount)} products
                  </span>
                </Link>
              </FadeIn>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
