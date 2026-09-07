export function formatPrice(
  amountCents: number,
  currency: "USD" | "INR" = "USD",
): string {
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: amountCents % 100 === 0 ? 0 : 2,
  }).format(amountCents / 100);
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatRelativeDate(iso: string): string {
  const then = new Date(iso).getTime();
  const delta = Date.now() - then;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (delta < hour) {
    const minutes = Math.max(1, Math.round(delta / minute));
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }
  if (delta < day) {
    const hours = Math.round(delta / hour);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  if (delta < 30 * day) {
    const days = Math.round(delta / day);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }
  return formatDate(iso);
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
