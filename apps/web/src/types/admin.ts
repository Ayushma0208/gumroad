export type AdminRangeParams = {
  range: "today" | "7d" | "30d" | "90d" | "this_month" | "last_month" | "this_year" | "custom";
  from?: string;
  to?: string;
};

export type AdminOverview = {
  range: {
    key: string;
    from: string;
    to: string;
    bucket: string;
  };
  currency: "USD" | "INR";
  metrics: {
    totalUsers: number;
    totalCreators: number;
    publishedProducts: number;
    totalOrders: number;
    grossRevenueCents: number;
    successfulPurchases: number;
    pendingModeration: number;
    openReports: number;
    revenueChange: number | null;
    ordersChange: number | null;
    usersChange: number | null;
    newUsers: number;
    failedPayments: number;
    successfulPayments: number;
    pendingPayments: number;
  };
  series: Array<{
    date: string;
    label: string;
    revenueCents: number;
    orders: number;
  }>;
  moderationQueue: {
    openReports: number;
    hiddenReviews: number;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    targetType: string;
    targetId: string;
    createdAt: string;
    admin: { id: string; name: string; email: string };
  }>;
};

export type AdminListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};
