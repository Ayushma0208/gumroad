import type { Metadata } from "next";
import { AdminEmailHealth } from "@/components/admin/admin-email-health";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";

export const metadata: Metadata = {
  title: "Settings · Admin",
  robots: { index: false, follow: false },
};

export default function AdminSettingsPage() {
  return (
    <AdminPage>
      <AdminPageHeader
        title="Settings"
        description="How platform metrics are defined today."
      />

      <div className="mt-10 max-w-2xl space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-base font-medium text-foreground">Revenue</h2>
          <p className="mt-2">
            Gross revenue on the admin overview is the sum of paid order totals
            (buyer GMV after discounts). It reflects money customers paid for
            products, not creator payouts or estimated earnings.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-foreground">Platform fees</h2>
          <p className="mt-2">
            Platform fees are not modeled in this product yet. There is no fee
            schedule, take rate, or net revenue setting to configure here.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-foreground">Operations</h2>
          <p className="mt-2">
            Moderation, account status, product visibility, and category changes
            are performed from their respective admin sections and written to the
            audit log.
          </p>
        </section>
      </div>

      <AdminEmailHealth />
    </AdminPage>
  );
}
