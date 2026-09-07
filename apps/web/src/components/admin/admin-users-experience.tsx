"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AdminListPagination,
  AdminPage,
  AdminPageHeader,
} from "@/components/admin/admin-page";
import { StudioQueryError } from "@/components/studio/query-error";
import { TableSkeleton } from "@/components/studio/skeletons";
import { Input } from "@/components/ui/input";
import { useAdminUsers } from "@/hooks/use-admin";
import { formatDate } from "@/lib/format";

export function AdminUsersExperience() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [role, setRole] = useState(searchParams.get("role") ?? "all");
  const [status, setStatus] = useState(searchParams.get("status") ?? "all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);


  const query = useAdminUsers({
    page,
    q: debouncedSearch.trim() || undefined,
    role,
    status,
  });

  if (query.isPending) {
    return (
      <AdminPage>
        <AdminPageHeader title="Users" description="Accounts across the marketplace." />
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
        title="Users"
        description={`${meta.total} account${meta.total === 1 ? "" : "s"} on the platform.`}
      />

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name or email"
          aria-label="Search users"
          className="h-11 flex-1 rounded-xl"
        />
        <select
          value={role}
          onChange={(event) => { setRole(event.target.value); setPage(1); }}
          aria-label="Filter by role"
          className="h-11 rounded-xl border border-input bg-transparent px-3 text-sm"
        >
          <option value="all">All roles</option>
          <option value="CUSTOMER">Customer</option>
          <option value="CREATOR">Creator</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select
          value={status}
          onChange={(event) => { setStatus(event.target.value); setPage(1); }}
          aria-label="Filter by status"
          className="h-11 rounded-xl border border-input bg-transparent px-3 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {items.length === 0 ? (
        <p className="mt-12 text-center text-sm text-muted-foreground">
          No users match those filters.
        </p>
      ) : (
        <>
          <ul className="mt-6 space-y-3 lg:hidden">
            {items.map((user) => (
              <li key={user.id}>
                <Link
                  href={`/admin/users/${user.id}`}
                  className="block rounded-xl bg-muted/40 px-3 py-3"
                >
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{user.email}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {user.role} · {user.status} · {formatDate(user.createdAt)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6 hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Joined</th>
                  <th className="pb-3 text-right font-medium">Orders</th>
                </tr>
              </thead>
              <tbody>
                {items.map((user) => (
                  <tr key={user.id} className="border-b border-border/70 last:border-0">
                    <td className="py-3 pr-3">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="font-medium hover:underline"
                      >
                        {user.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </td>
                    <td className="py-3 pr-3">{user.role}</td>
                    <td className="py-3 pr-3">{user.status}</td>
                    <td className="py-3 pr-3">{formatDate(user.createdAt)}</td>
                    <td className="py-3 text-right tabular-nums">{user.orderCount}</td>
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
