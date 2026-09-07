"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  AdminConfirmButton,
  AdminPage,
  AdminPageHeader,
} from "@/components/admin/admin-page";
import { StudioQueryError } from "@/components/studio/query-error";
import { TableSkeleton } from "@/components/studio/skeletons";
import {
  useAdminReport,
  useAdminReportStatusMutation,
} from "@/hooks/use-admin";
import { formatDate } from "@/lib/format";
import { useToastStore } from "@/stores/toast-store";

export function AdminReportDetailExperience() {
  const params = useParams<{ reportId: string }>();
  const reportId = params.reportId;
  const query = useAdminReport(reportId);
  const statusMutation = useAdminReportStatusMutation();
  const showToast = useToastStore((state) => state.show);
  const [note, setNote] = useState("");

  if (query.isPending) {
    return (
      <AdminPage>
        <div className="mt-2">
          <TableSkeleton />
        </div>
      </AdminPage>
    );
  }

  if (query.isError || !query.data?.report) {
    return (
      <AdminPage>
        <StudioQueryError onRetry={() => void query.refetch()} />
      </AdminPage>
    );
  }

  const report = query.data.report;
  const closed = report.status === "RESOLVED" || report.status === "DISMISSED";
  const target = report.target as Record<string, unknown>;

  const runStatus = (
    status: "UNDER_REVIEW" | "RESOLVED" | "DISMISSED",
    title: string,
  ) => {
    void statusMutation
      .mutateAsync({
        reportId: report.id,
        status,
        resolutionNote: note.trim() || undefined,
      })
      .then(() => showToast({ title }))
      .catch((error: Error) =>
        showToast({ title: error.message || "Action failed" }),
      );
  };

  return (
    <AdminPage>
      <AdminPageHeader
        title={`${report.targetType} report`}
        description={`${report.reason} · ${report.status}`}
        actions={
          closed ? undefined : (
            <>
              {report.status !== "UNDER_REVIEW" ? (
                <AdminConfirmButton
                  label="Under review"
                  confirmLabel="Mark this report as under review?"
                  disabled={statusMutation.isPending}
                  onConfirm={() => runStatus("UNDER_REVIEW", "Marked under review")}
                />
              ) : null}
              <AdminConfirmButton
                label="Resolve"
                confirmLabel="Resolve this report?"
                disabled={statusMutation.isPending}
                onConfirm={() => runStatus("RESOLVED", "Report resolved")}
              />
              <AdminConfirmButton
                label="Dismiss"
                confirmLabel="Dismiss this report?"
                variant="destructive"
                disabled={statusMutation.isPending}
                onConfirm={() => runStatus("DISMISSED", "Report dismissed")}
              />
            </>
          )
        }
      />

      <p className="mt-4">
        <Link href="/admin/reports" className="text-sm text-muted-foreground hover:underline">
          ← All reports
        </Link>
      </p>

      <dl className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <DetailField label="Status" value={report.status} />
        <DetailField label="Reason" value={report.reason} />
        <DetailField label="Filed" value={formatDate(report.createdAt)} />
        <DetailField
          label="Reporter"
          value={
            <Link
              href={`/admin/users/${report.reporter.id}`}
              className="hover:underline"
            >
              {report.reporter.name}
            </Link>
          }
        />
        <DetailField label="Reporter email" value={report.reporter.email} />
        <DetailField label="Target id" value={report.targetId} />
      </dl>

      {typeof report.description === "string" && report.description ? (
        <section className="mt-10">
          <h2 className="text-base font-medium">Description</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
            {report.description}
          </p>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="text-base font-medium">Target</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {summarizeTarget(report.targetType, target)}
        </p>
      </section>

      {!closed ? (
        <section className="mt-10 max-w-xl">
          <label className="text-sm font-medium" htmlFor="resolution-note">
            Resolution note
          </label>
          <textarea
            id="resolution-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            className="mt-2 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            placeholder="Optional note for the audit trail"
          />
        </section>
      ) : typeof report.resolutionNote === "string" && report.resolutionNote ? (
        <section className="mt-10">
          <h2 className="text-base font-medium">Resolution note</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
            {report.resolutionNote}
          </p>
        </section>
      ) : null}
    </AdminPage>
  );
}

function summarizeTarget(type: string, target: Record<string, unknown>) {
  if (target.missing) return `${type} no longer exists (${String(target.id ?? "")})`;
  if (type === "PRODUCT") {
    return String(target.title ?? target.id ?? "Product");
  }
  if (type === "CREATOR") {
    return String(target.storeName ?? target.displayName ?? target.id ?? "Creator");
  }
  if (type === "REVIEW") {
    const title = target.title ? String(target.title) : "Review";
    const rating = target.rating != null ? ` · ${String(target.rating)}★` : "";
    return `${title}${rating}`;
  }
  return String(target.id ?? "Unknown target");
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}
