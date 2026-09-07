import { describe, expect, it } from "vitest";
import {
  enumerateBuckets,
  exclusiveEndOfUtcDay,
  resolveDateWindow,
  startOfUtcDay,
  toDateKey,
} from "../src/modules/analytics/analytics.dates";
import {
  finalizePeriodTotals,
  percentageChange,
  safeAverage,
  safeRate,
} from "../src/modules/analytics/analytics.metrics";

describe("analytics date windows", () => {
  const now = new Date("2026-09-07T15:30:00.000Z");

  it("resolves 30d as exclusive tomorrow UTC", () => {
    const window = resolveDateWindow({ range: "30d", now });
    expect(window.from.toISOString()).toBe("2026-08-09T00:00:00.000Z");
    expect(window.to.toISOString()).toBe("2026-09-08T00:00:00.000Z");
    expect(window.previousTo.toISOString()).toBe(window.from.toISOString());
  });

  it("includes full custom end day", () => {
    const window = resolveDateWindow({
      range: "custom",
      from: "2026-08-01",
      to: "2026-08-31",
      now,
    });
    expect(window.from.toISOString()).toBe("2026-08-01T00:00:00.000Z");
    expect(window.to.toISOString()).toBe("2026-09-01T00:00:00.000Z");
  });

  it("rejects inverted custom ranges", () => {
    expect(() =>
      resolveDateWindow({ from: "2026-09-01", to: "2026-08-01", now }),
    ).toThrow(/from must be/i);
  });

  it("buckets short ranges by day", () => {
    const window = resolveDateWindow({ range: "7d", now });
    expect(window.bucket).toBe("day");
    const keys = enumerateBuckets(window.from, window.to, "day");
    expect(keys[0]).toBe("2026-09-01");
    expect(keys.at(-1)).toBe("2026-09-07");
  });

  it("aligns week keys to Monday UTC", () => {
    expect(toDateKey(new Date("2026-09-07T12:00:00.000Z"), "week")).toBe(
      "2026-09-07",
    );
    expect(toDateKey(new Date("2026-09-09T12:00:00.000Z"), "week")).toBe(
      "2026-09-07",
    );
  });

  it("start/end helpers are UTC-safe around midnight", () => {
    const late = new Date("2026-09-07T23:59:59.999Z");
    expect(startOfUtcDay(late).toISOString()).toBe("2026-09-07T00:00:00.000Z");
    expect(exclusiveEndOfUtcDay(late).toISOString()).toBe(
      "2026-09-08T00:00:00.000Z",
    );
  });
});

describe("analytics metrics helpers", () => {
  it("computes percentage change safely", () => {
    expect(percentageChange(118, 100)).toBeCloseTo(0.18);
    expect(percentageChange(0, 0)).toBe(0);
    expect(percentageChange(50, 0)).toBeNull();
    expect(percentageChange(0, 10)).toBe(-1);
  });

  it("never returns NaN for AOV / rates", () => {
    expect(safeAverage(1000, 0)).toBe(0);
    expect(safeRate(2, 0)).toBeNull();
    expect(safeRate(1, 4)).toBe(0.25);
  });

  it("finalizes net revenue without going negative", () => {
    const totals = finalizePeriodTotals({
      grossRevenueCents: 1000,
      discountCents: 1500,
      orders: 2,
      unitsSold: 3,
      customers: 2,
      newCustomers: 1,
      returningCustomers: 1,
    });
    expect(totals.revenueCents).toBe(0);
    expect(totals.averageOrderValueCents).toBe(0);
  });
});
