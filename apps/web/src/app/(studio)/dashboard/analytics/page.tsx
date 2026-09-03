import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { RevenueChart } from "@/components/studio/revenue-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Analytics",
};

const snapshots = [
  { label: "Revenue (7d)", value: "$0" },
  { label: "Views", value: "—" },
  { label: "Conversion", value: "—" },
];

export default function AnalyticsPage() {
  return (
    <Container className="py-8 sm:py-12">
      <PageHeader
        eyebrow="Performance"
        title="Analytics"
        description="A quiet view of what is selling. Charts stay empty until live order data exists — no vanity numbers."
      />

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {snapshots.map((item) => (
          <Card key={item.label} className="py-0">
            <CardHeader className="pt-5">
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="font-display text-3xl font-normal tracking-tight">
                {item.value}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Revenue</CardTitle>
          <CardDescription>Last seven days. Fills in after your first paid order.</CardDescription>
        </CardHeader>
        <CardContent>
          <RevenueChart />
        </CardContent>
      </Card>
    </Container>
  );
}
