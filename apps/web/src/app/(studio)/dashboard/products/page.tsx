import type { Metadata } from "next";
import { ProductsExperience } from "@/components/studio/products-experience";

export const metadata: Metadata = {
  title: "Products",
};

export default function DashboardProductsPage() {
  return <ProductsExperience />;
}
