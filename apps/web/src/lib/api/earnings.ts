import { requestJson } from "@/lib/api/http";

export type MoneyAmount = {
  cents: number;
  amount: number;
};

export type EarningsSummary = {
  currency: "USD" | "INR";
  platformFeeBps: number;
  holdingPeriodHours: number;
  minPayoutCents: number;
  grossSales: MoneyAmount;
  discounts: MoneyAmount;
  netSales: MoneyAmount;
  platformFees: MoneyAmount;
  processingFees: MoneyAmount;
  creatorEarnings: MoneyAmount;
  pendingBalance: MoneyAmount;
  availableBalance: MoneyAmount;
  reservedBalance: MoneyAmount;
  paidOut: MoneyAmount;
};

export type EarningRow = {
  id: string;
  orderId: string;
  orderItemId: string;
  product: {
    id: string;
    title: string;
    slug: string;
    coverImage: string;
  };
  currency: "USD" | "INR";
  gross: MoneyAmount;
  discount: MoneyAmount;
  netSales: MoneyAmount;
  platformFee: MoneyAmount;
  platformFeeBps: number;
  processingFee: MoneyAmount;
  creatorEarning: MoneyAmount;
  status: "PENDING" | "AVAILABLE" | "RESERVED" | "PAID" | "REVERSED";
  availableAt: string;
  createdAt: string;
};

export type PayoutAccount = {
  status: "NOT_CONFIGURED" | "PENDING_REVIEW" | "VERIFIED" | "DISABLED";
  provider: string;
  accountHolderName: string | null;
  accountHint: string | null;
  hasProviderAccount: boolean;
  verifiedAt: string | null;
  updatedAt: string | null;
  canRequestPayout: boolean;
};

export type PayoutRow = {
  id: string;
  amount: MoneyAmount;
  currency: "USD" | "INR";
  status: "REQUESTED" | "PROCESSING" | "PAID" | "FAILED" | "CANCELLED";
  provider: string;
  reference: string;
  failureCode: string | null;
  failureMessage: string | null;
  requestedAt: string;
  processedAt: string | null;
  createdAt: string;
  items?: Array<{
    id: string;
    amount: MoneyAmount;
    earningId: string;
    orderId: string;
    product: { title: string; slug: string };
  }>;
};

export type ListMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export async function fetchEarningsSummary() {
  return requestJson<EarningsSummary>("/api/v1/creators/me/earnings/summary");
}

export async function fetchEarnings(params: {
  page?: number;
  pageSize?: number;
  status?: string;
  productId?: string;
  from?: string;
  to?: string;
}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "all") {
      search.set(key, String(value));
    }
  });
  return requestJson<{ items: EarningRow[]; meta: ListMeta }>(
    `/api/v1/creators/me/earnings?${search.toString()}`,
  );
}

export async function fetchPayoutAccount() {
  return requestJson<PayoutAccount>("/api/v1/creators/me/payouts/account");
}

export async function updatePayoutAccount(input: {
  accountHolderName: string;
  accountHint?: string | null;
}) {
  return requestJson<PayoutAccount>("/api/v1/creators/me/payouts/account", {
    method: "PUT",
    body: input,
  });
}

export async function fetchPayouts(params: {
  page?: number;
  pageSize?: number;
  status?: string;
}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "all") {
      search.set(key, String(value));
    }
  });
  return requestJson<{ items: PayoutRow[]; meta: ListMeta }>(
    `/api/v1/creators/me/payouts?${search.toString()}`,
  );
}

export async function fetchPayout(payoutId: string) {
  return requestJson<PayoutRow>(
    `/api/v1/creators/me/payouts/${encodeURIComponent(payoutId)}`,
  );
}

export async function requestPayout(input: {
  amountCents: number;
  idempotencyKey?: string;
}) {
  return requestJson<PayoutRow>("/api/v1/creators/me/payouts", {
    method: "POST",
    body: input,
  });
}

export async function fetchAdminPayouts(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "all") {
      search.set(key, String(value));
    }
  });
  return requestJson<{ items: (PayoutRow & { creator?: { id: string; storeName: string; slug: string } })[]; meta: ListMeta }>(
    `/api/v1/admin/payouts?${search.toString()}`,
  );
}

export async function fetchAdminPayout(payoutId: string) {
  return requestJson<PayoutRow & { creator?: { id: string; storeName: string; slug: string } }>(
    `/api/v1/admin/payouts/${encodeURIComponent(payoutId)}`,
  );
}

export async function updateAdminPayoutStatus(
  payoutId: string,
  body: {
    status: "PROCESSING" | "PAID" | "FAILED" | "CANCELLED";
    failureMessage?: string;
    providerPayoutId?: string;
  },
) {
  return requestJson<PayoutRow>(
    `/api/v1/admin/payouts/${encodeURIComponent(payoutId)}/status`,
    { method: "PATCH", body },
  );
}
