"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  AdminListPagination,
  AdminPage,
  AdminPageHeader,
} from "@/components/admin/admin-page";
import { StudioQueryError } from "@/components/studio/query-error";
import { TableSkeleton } from "@/components/studio/skeletons";
import { useAdminReports } from "@/hooks/use-admin";
import { formatDate } from "@/lib/format";

export function AdminReportsExperience() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState(searchParams.get("status") ?? "all");
  const [targetType, setTargetType] = useState(
    searchParams.get("targetType") ?? "all",
  );
  const [page, setPage] = useState(1);


  const query = useAdminReports({
    page,
    status,
    targetType,
  });

  if (query.isPending) {
    return (
      <AdminPage>
        <AdminPageHeader
          title="Reports"
          description="User-submitted moderation reports."
        />
        <div className="mt-8">
          <TableSkeleton />
        </div>
      </AdminPage>
    );
  }

  if (query.isError || !query.data) {
    return (
      <AdminPage>
        <StudioQueryError onRetry={() => void query.refetch()} />
      </AdminPage>
    );
  }

  const { items, meta } = query.data;

  return (
    <AdminPage>
      <AdminPageHeader
        title="Reports"
        description={`${meta.total} report${meta.total === 1 ? "" : "s"}.`}
      />

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <select
          value={status}
          onChange={(event) => { setStatus(event.target.value); setPage(1); }}
          aria-label="Filter by status"
          className="h-11 rounded-xl border border-input bg-transparent px-3 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="UNDER_REVIEW">Under review</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DISMISSED">Dismissed</option>
        </select>
        <select
          value={targetType}
          onChange={(event) => { setTargetType(event.target.value); setPage(1); }}
          aria-label="Filter by target type"
          className="h-11 rounded-xl border border-input bg-transparent px-3 text-sm"
        >
          <option value="all">All targets</option>
          <option value="PRODUCT">Product</option>
          <option value="REVIEW">Review</option>
          <option value="CREATOR">Creator</option>
        </select>
      </div>

      {items.length === 0 ? (
        <p className="mt-12 text-center text-sm text-muted-foreground">
          No reports match those filters.
        </p>
      ) : (
        <>
          <ul className="mt-6 space-y-3 lg:hidden">
            {items.map((report) => (
              <li key={report.id}>
                <Link
                  href={`/admin/reports/${report.id}`}
                  className="block rounded-xl bg-muted/40 px-3 py-3"
                >
                  <p className="text-sm font-medium">
                    {report.targetType} · {report.reason}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {report.status} · {report.reporter.name} ·{" "}
                    {formatDate(report.createdAt)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6 hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="pb-3 font-medium">Report</th>
                  <th className="pb-3 font-medium">Reporter</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {items.map((report) => (
                  <tr key={report.id} className="border-b border-border/70 last:border-0">
                    <td className="py-3 pr-3">
                      <Link
                        href={`/admin/reports/${report.id}`}
                        className="font-medium hover:underline"
                      >
                        {report.targetType} · {report.reason}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {report.targetId.slice(0, 8)}…
                      </p>
                    </td>
                    <td className="py-3 pr-3">
                      <p>{report.reporter.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {report.reporter.email}
                      </p>
                    </td>
                    <td className="py-3 pr-3">{report.status}</td>
                    <td className="py-3 pr-3">{formatDate(report.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <AdminListPagination
            page={meta.page}
            totalPages={meta.totalPages}
            hasNextPage={meta.hasNextPage}
            hasPreviousPage={meta.hasPreviousPage}
            onPrevious={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => p + 1)}
          />
        </>
      )}
    </AdminPage>
  );
}
