import { LandingCategories } from "@/components/landing/categories";
import { CreatorBenefits } from "@/components/landing/creator-benefits";
import { FeaturedCreators } from "@/components/landing/featured-creators";
import { FeaturedProducts } from "@/components/landing/featured-products";
import { FinalCta } from "@/components/landing/final-cta";
import { LandingHero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LandingStats } from "@/components/landing/stats";

export default function HomePage() {
  return (
    <>
      <LandingHero />
      <LandingStats />
      <FeaturedProducts />
      <LandingCategories />
      <HowItWorks />
      <CreatorBenefits />
      <FeaturedCreators />
      <FinalCta />
    </>
  );
}
