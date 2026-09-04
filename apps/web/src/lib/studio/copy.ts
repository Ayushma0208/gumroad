import type {
  DateRangeKey,
  PaymentStatus,
  PricingModel,
  StudioProductKind,
  StudioProductStatus,
} from "@/types/studio";

export const productKindCopy: Record<
  StudioProductKind,
  { label: string; description: string }
> = {
  download: {
    label: "Digital download",
    description: "Files the buyer receives immediately — kits, fonts, PDFs.",
  },
  course: {
    label: "Course",
    description: "A sequenced set of lessons, videos, or a workshop archive.",
  },
  template: {
    label: "Template",
    description: "A starting file people customize — Notion, Figma, slides.",
  },
  bundle: {
    label: "Bundle",
    description: "Several products sold together at a single price.",
  },
};

export const statusCopy: Record<StudioProductStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export const pricingCopy: Record<
  PricingModel,
  { label: string; description: string }
> = {
  free: {
    label: "Free",
    description: "No charge. Still collects an email at checkout.",
  },
  fixed: {
    label: "Fixed price",
    description: "One price. Cleanest for kits and courses.",
  },
  pwyw: {
    label: "Pay what you want",
    description: "Set a floor and a suggestion. Buyers choose.",
  },
};

export const paymentStatusCopy: Record<PaymentStatus, string> = {
  paid: "Paid",
  refunded: "Refunded",
  failed: "Failed",
};

export const rangeCopy: Record<DateRangeKey, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

export const rangeHint: Record<DateRangeKey, string> = {
  daily: "Last 14 days",
  weekly: "Last 12 weeks",
  monthly: "Last 12 months",
  yearly: "Last 4 years",
};

export function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
