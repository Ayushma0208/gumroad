import type { ChangeValue, PeriodTotals } from "./analytics.types";

/** Fractional change. Null means “New” (previous was 0, current > 0). Never NaN/Infinity. */
export function percentageChange(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  if (previous === 0) {
    if (current === 0) return 0;
    return null;
  }
  return (current - previous) / previous;
}

export function changePair(current: number, previous: number): ChangeValue {
  return {
    current,
    previous,
    change: percentageChange(current, previous),
  };
}

export function safeAverage(numerator: number, denominator: number): number {
  if (!denominator || !Number.isFinite(numerator) || !Number.isFinite(denominator)) {
    return 0;
  }
  return Math.round(numerator / denominator);
}

export function safeRate(numerator: number, denominator: number): number | null {
  if (!denominator || !Number.isFinite(numerator) || !Number.isFinite(denominator)) {
    return null;
  }
  return numerator / denominator;
}

export function emptyPeriodTotals(): PeriodTotals {
  return {
    grossRevenueCents: 0,
    discountCents: 0,
    revenueCents: 0,
    orders: 0,
    unitsSold: 0,
    customers: 0,
    newCustomers: 0,
    returningCustomers: 0,
    averageOrderValueCents: 0,
  };
}

export function finalizePeriodTotals(input: {
  grossRevenueCents: number;
  discountCents: number;
  orders: number;
  unitsSold: number;
  customers: number;
  newCustomers: number;
  returningCustomers: number;
}): PeriodTotals {
  const gross = Math.max(0, Math.trunc(input.grossRevenueCents));
  const discount = Math.max(0, Math.trunc(input.discountCents));
  const revenueCents = Math.max(0, gross - discount);
  return {
    grossRevenueCents: gross,
    discountCents: discount,
    revenueCents,
    orders: Math.max(0, Math.trunc(input.orders)),
    unitsSold: Math.max(0, Math.trunc(input.unitsSold)),
    customers: Math.max(0, Math.trunc(input.customers)),
    newCustomers: Math.max(0, Math.trunc(input.newCustomers)),
    returningCustomers: Math.max(0, Math.trunc(input.returningCustomers)),
    averageOrderValueCents: safeAverage(revenueCents, input.orders),
  };
}
