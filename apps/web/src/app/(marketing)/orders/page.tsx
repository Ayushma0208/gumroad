import { Receipt } from "lucide-react";
import { EmptyState } from "@/components/layout/empty-state";

export default function OrdersPage() {
  return (
    <EmptyState
      icon={Receipt}
      title="No orders yet"
      description="When you buy something on Lumen, the receipt and files will live here."
      actionHref="/discover"
      actionLabel="Browse the marketplace"
    />
  );
}
