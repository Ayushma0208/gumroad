import type { Metadata } from "next";
import { ProductEditor } from "@/components/studio/product-editor";

export const metadata: Metadata = {
  title: "Create product",
};

export default function NewProductPage() {
  return <ProductEditor mode="create" />;
}
