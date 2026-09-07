"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchEarnings,
  fetchEarningsSummary,
  fetchPayout,
  fetchPayoutAccount,
  fetchPayouts,
  requestPayout,
  updatePayoutAccount,
  fetchAdminPayouts,
  fetchAdminPayout,
  updateAdminPayoutStatus,
} from "@/lib/api/earnings";

export const earningsKeys = {
  summary: ["creator-earnings", "summary"] as const,
  list: (params: Record<string, unknown>) =>
    ["creator-earnings", "list", params] as const,
  payouts: (params: Record<string, unknown>) =>
    ["creator-payouts", "list", params] as const,
  payout: (id: string) => ["creator-payouts", "detail", id] as const,
  account: ["creator-payouts", "account"] as const,
  adminList: (params: Record<string, unknown>) =>
    ["admin-payouts", "list", params] as const,
  adminDetail: (id: string) => ["admin-payouts", "detail", id] as const,
};

export function useCreatorEarningsSummary() {
  return useQuery({
    queryKey: earningsKeys.summary,
    queryFn: fetchEarningsSummary,
  });
}

export function useCreatorEarnings(params: {
  page?: number;
  pageSize?: number;
  status?: string;
  productId?: string;
  from?: string;
  to?: string;
}) {
  return useQuery({
    queryKey: earningsKeys.list(params),
    queryFn: () => fetchEarnings(params),
  });
}

export function useCreatorPayouts(params: {
  page?: number;
  pageSize?: number;
  status?: string;
}) {
  return useQuery({
    queryKey: earningsKeys.payouts(params),
    queryFn: () => fetchPayouts(params),
  });
}

export function useCreatorPayout(payoutId: string) {
  return useQuery({
    queryKey: earningsKeys.payout(payoutId),
    queryFn: () => fetchPayout(payoutId),
    enabled: Boolean(payoutId),
  });
}

export function usePayoutAccount() {
  return useQuery({
    queryKey: earningsKeys.account,
    queryFn: fetchPayoutAccount,
  });
}

export function useRequestPayout() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: requestPayout,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["creator-earnings"] }),
        client.invalidateQueries({ queryKey: ["creator-payouts"] }),
      ]);
    },
  });
}

export function useUpdatePayoutAccount() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: updatePayoutAccount,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: earningsKeys.account });
    },
  });
}

export function useAdminPayouts(params: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: earningsKeys.adminList(params),
    queryFn: () => fetchAdminPayouts(params),
  });
}

export function useAdminPayout(payoutId: string) {
  return useQuery({
    queryKey: earningsKeys.adminDetail(payoutId),
    queryFn: () => fetchAdminPayout(payoutId),
    enabled: Boolean(payoutId),
  });
}

export function useAdminUpdatePayoutStatus() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      payoutId,
      ...body
    }: {
      payoutId: string;
      status: "PROCESSING" | "PAID" | "FAILED" | "CANCELLED";
      failureMessage?: string;
      providerPayoutId?: string;
    }) => updateAdminPayoutStatus(payoutId, body),
    onSuccess: async (_data, vars) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["admin-payouts"] }),
        client.invalidateQueries({
          queryKey: earningsKeys.adminDetail(vars.payoutId),
        }),
      ]);
    },
  });
}
