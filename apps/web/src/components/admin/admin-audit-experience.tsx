"use client";

import { useEffect, useState } from "react";
import {
  AdminListPagination,
  AdminPage,
  AdminPageHeader,
} from "@/components/admin/admin-page";
import { StudioQueryError } from "@/components/studio/query-error";
import { TableSkeleton } from "@/components/studio/skeletons";
import { Input } from "@/components/ui/input";
import { useAdminAuditLogs } from "@/hooks/use-admin";
import { formatDate } from "@/lib/format";

type AuditRow = {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: unknown;
  createdAt: string;
  admin: { id: string; name: string; email: string };
};

export function AdminAuditExperience() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);


  const query = useAdminAuditLogs({
    page,
    q: debouncedSearch.trim() || undefined,
  });

  if (query.isPending) {
    return (
      <AdminPage>
        <AdminPageHeader
          title="Audit log"
          description="Operator actions across the admin panel."
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

  const items = query.data.items as AuditRow[];
  const { meta } = query.data;

  return (
    <AdminPage>
      <AdminPageHeader
        title="Audit log"
        description={`${meta.total} event${meta.total === 1 ? "" : "s"}.`}
      />

      <div className="mt-8">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search admin, email, or target id"
          aria-label="Search audit log"
          className="h-11 max-w-md rounded-xl"
        />
      </div>

      {items.length === 0 ? (
        <p className="mt-12 text-center text-sm text-muted-foreground">
          No audit events yet.
        </p>
      ) : (
        <>
          <ul className="mt-6 space-y-3 lg:hidden">
            {items.map((item) => (
              <li key={item.id} className="rounded-xl bg-muted/40 px-3 py-3">
                <p className="text-sm font-medium">
                  {item.admin.name} · {formatAction(item.action)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.targetType} {item.targetId.slice(0, 8)} ·{" "}
                  {formatDate(item.createdAt)}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-6 hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="pb-3 font-medium">Admin</th>
                  <th className="pb-3 font-medium">Action</th>
                  <th className="pb-3 font-medium">Target</th>
                  <th className="pb-3 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-border/70 last:border-0">
                    <td className="py-3 pr-3">
                      <p className="font-medium">{item.admin.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.admin.email}
                      </p>
                    </td>
                    <td className="py-3 pr-3">{formatAction(item.action)}</td>
                    <td className="py-3 pr-3">
                      <p>{item.targetType}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {item.targetId}
                      </p>
                    </td>
                    <td className="py-3 pr-3">{formatDate(item.createdAt)}</td>
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

function formatAction(action: string) {
  return action.replaceAll("_", " ").toLowerCase();
}
