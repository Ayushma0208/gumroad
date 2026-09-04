import type { Metadata } from "next";
import { CustomersExperience } from "@/components/studio/customers-experience";

export const metadata: Metadata = {
  title: "Customers",
};

export default function CustomersPage() {
  return <CustomersExperience />;
}
