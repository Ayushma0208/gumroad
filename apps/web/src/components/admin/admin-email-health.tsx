"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { requestJson } from "@/lib/api/http";
import { useToastStore } from "@/stores/toast-store";

type EmailHealth = {
  counts: {
    pending: number;
    sending: number;
    sent: number;
    failed: number;
  };
  recentFailures: Array<{
    id: string;
    type: string;
    toEmail: string;
    attempts: number;
    lastError: string | null;
    updatedAt: string;
    createdAt: string;
  }>;
};

export function AdminEmailHealth() {
  const qc = useQueryClient();
  const showToast = useToastStore((s) => s.show);
  const query = useQuery({
    queryKey: ["admin", "email-jobs"],
    queryFn: () => requestJson<EmailHealth>("/api/v1/admin/email-jobs"),
  });
  const process = useMutation({
    mutationFn: () =>
      requestJson<{ processed: number }>("/api/v1/admin/email-jobs/process", {
        method: "POST",
      }),
    onSuccess: (data) => {
      showToast({ title: `Processed ${data.processed} email job(s)` });
      void qc.invalidateQueries({ queryKey: ["admin", "email-jobs"] });
    },
    onError: () => {
      showToast({ title: "Couldn’t process email jobs" });
    },
  });

  const counts = query.data?.counts;

  return (
    <section className="mt-12 max-w-2xl border-t border-border pt-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-medium text-foreground">Email delivery</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Operational status for transactional email jobs. No provider secrets or full payloads.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={process.isPending}
          onClick={() => void process.mutateAsync()}
        >
          Process pending
        </Button>
      </div>

      {query.isPending ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      ) : query.isError ? (
        <p className="mt-4 text-sm text-muted-foreground">Unable to load email health.</p>
      ) : counts ? (
        <>
          <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {(
              [
                ["Pending", counts.pending],
                ["Sending", counts.sending],
                ["Sent", counts.sent],
                ["Failed", counts.failed],
              ] as const
            ).map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 text-2xl font-medium tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>

          {query.data.recentFailures.length > 0 ? (
            <div className="mt-8">
              <h3 className="text-sm font-medium">Recent failures</h3>
              <ul className="mt-3 divide-y divide-border border-t border-border">
                {query.data.recentFailures.map((job) => (
                  <li key={job.id} className="py-3 text-sm">
                    <p className="font-medium">
                      {job.type} · {job.toEmail}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {job.attempts} attempts
                      {job.lastError ? ` · ${job.lastError}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
