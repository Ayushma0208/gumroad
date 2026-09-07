import { badRequest } from "../../utils/app-error";
import type { AnalyticsBucket, AnalyticsRangeKey, DateWindow } from "./analytics.types";

const MS_DAY = 24 * 60 * 60 * 1000;
const MAX_CUSTOM_DAYS = 366 * 3;

/** Start of UTC calendar day. */
export function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** Exclusive end = start of next UTC day after `date`'s calendar day. */
export function exclusiveEndOfUtcDay(date: Date): Date {
  const start = startOfUtcDay(date);
  return new Date(start.getTime() + MS_DAY);
}

function startOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addUtcMonths(date: Date, months: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

function chooseBucket(from: Date, toExclusive: Date): AnalyticsBucket {
  const days = Math.max(1, Math.ceil((toExclusive.getTime() - from.getTime()) / MS_DAY));
  if (days <= 62) return "day";
  if (days <= 210) return "week";
  return "month";
}

function previousWindow(from: Date, toExclusive: Date): { previousFrom: Date; previousTo: Date } {
  const span = toExclusive.getTime() - from.getTime();
  return {
    previousFrom: new Date(from.getTime() - span),
    previousTo: from,
  };
}

export function resolveDateWindow(input: {
  range?: AnalyticsRangeKey;
  from?: string;
  to?: string;
  now?: Date;
}): DateWindow {
  const now = input.now ?? new Date();
  const todayStart = startOfUtcDay(now);
  const tomorrow = new Date(todayStart.getTime() + MS_DAY);

  let range: AnalyticsRangeKey = input.range ?? "30d";
  let from: Date;
  let to: Date;

  if (input.from || input.to || range === "custom") {
    if (!input.from || !input.to) {
      throw badRequest("Custom ranges require both from and to (YYYY-MM-DD).");
    }
    const fromParsed = parseUtcDateOnly(input.from);
    const toParsed = parseUtcDateOnly(input.to);
    if (fromParsed.getTime() > toParsed.getTime()) {
      throw badRequest("from must be on or before to.");
    }
    from = fromParsed;
    to = exclusiveEndOfUtcDay(toParsed);
    if (to.getTime() > tomorrow.getTime()) {
      to = tomorrow;
    }
    const days = (to.getTime() - from.getTime()) / MS_DAY;
    if (days > MAX_CUSTOM_DAYS) {
      throw badRequest(`Custom range cannot exceed ${MAX_CUSTOM_DAYS} days.`);
    }
    range = "custom";
  } else {
    switch (range) {
      case "today":
        from = todayStart;
        to = tomorrow;
        break;
      case "7d":
        from = new Date(tomorrow.getTime() - 7 * MS_DAY);
        to = tomorrow;
        break;
      case "30d":
        from = new Date(tomorrow.getTime() - 30 * MS_DAY);
        to = tomorrow;
        break;
      case "90d":
        from = new Date(tomorrow.getTime() - 90 * MS_DAY);
        to = tomorrow;
        break;
      case "this_month":
        from = startOfUtcMonth(todayStart);
        to = tomorrow;
        break;
      case "last_month": {
        const thisMonth = startOfUtcMonth(todayStart);
        from = addUtcMonths(thisMonth, -1);
        to = thisMonth;
        break;
      }
      case "this_year":
        from = new Date(Date.UTC(todayStart.getUTCFullYear(), 0, 1));
        to = tomorrow;
        break;
      default:
        from = new Date(tomorrow.getTime() - 30 * MS_DAY);
        to = tomorrow;
        range = "30d";
    }
  }

  const { previousFrom, previousTo } = previousWindow(from, to);
  return {
    from,
    to,
    previousFrom,
    previousTo,
    range,
    bucket: chooseBucket(from, to),
  };
}

export function parseUtcDateOnly(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw badRequest("Dates must use YYYY-MM-DD.");
  }
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    throw badRequest("Invalid calendar date.");
  }
  return date;
}

export function toDateKey(date: Date, bucket: AnalyticsBucket): string {
  if (bucket === "day") {
    return date.toISOString().slice(0, 10);
  }
  if (bucket === "week") {
    const start = startOfUtcDay(date);
    const day = start.getUTCDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(start.getTime() + mondayOffset * MS_DAY);
    return monday.toISOString().slice(0, 10);
  }
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function formatBucketLabel(key: string, bucket: AnalyticsBucket): string {
  if (bucket === "month") {
    const [y, m] = key.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  }
  const date = new Date(`${key}T00:00:00.000Z`);
  if (bucket === "week") {
    return `Week of ${date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    })}`;
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function enumerateBuckets(
  from: Date,
  toExclusive: Date,
  bucket: AnalyticsBucket,
): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  let cursor = startOfUtcDay(from);
  while (cursor.getTime() < toExclusive.getTime()) {
    const key = toDateKey(cursor, bucket);
    if (!seen.has(key)) {
      seen.add(key);
      keys.push(key);
    }
    if (bucket === "day") {
      cursor = new Date(cursor.getTime() + MS_DAY);
    } else if (bucket === "week") {
      cursor = new Date(cursor.getTime() + 7 * MS_DAY);
    } else {
      cursor = addUtcMonths(startOfUtcMonth(cursor), 1);
    }
  }
  return keys;
}
