/**
 * Integer minor-unit money helpers (cents / paise).
 *
 * Currency: USD | INR — both use 2 decimal places in this marketplace.
 * Precision: all ledger amounts are Int minor units; never JS floats for math.
 * Rounding: floor toward zero for fee/discount proportional splits
 * (`Math.floor`). Remainder pennies go to the last deterministic line.
 */

export function majorFromMinor(minor: number) {
  assertMinorInt(minor);
  return Number((minor / 100).toFixed(2));
}

export function razorpayAmountFromCatalog(minorUnits: number) {
  assertMinorInt(minorUnits);
  return minorUnits;
}

export function assertMinorInt(value: number, label = "amount") {
  if (!Number.isInteger(value)) {
    throw new Error(`${label} must be an integer minor-unit amount`);
  }
}

export const Money = {
  add(...amounts: number[]) {
    return amounts.reduce((sum, amount) => {
      assertMinorInt(amount);
      return sum + amount;
    }, 0);
  },

  subtract(left: number, right: number) {
    assertMinorInt(left);
    assertMinorInt(right);
    return left - right;
  },

  /**
   * Floor division multiply: floor(amount * numerator / denominator).
   * Used for percentage discounts and fee BPS.
   */
  multiplyFloor(amount: number, numerator: number, denominator: number) {
    assertMinorInt(amount);
    if (!Number.isInteger(numerator) || !Number.isInteger(denominator)) {
      throw new Error("numerator/denominator must be integers");
    }
    if (denominator <= 0) throw new Error("denominator must be positive");
    return Math.floor((amount * numerator) / denominator);
  },

  /**
   * Platform fee in minor units from net sales and basis points (1% = 100 bps).
   */
  feeFromBps(netSalesCents: number, feeBps: number) {
    assertMinorInt(netSalesCents);
    if (!Number.isInteger(feeBps) || feeBps < 0 || feeBps > 10_000) {
      throw new Error("feeBps must be an integer between 0 and 10000");
    }
    return Money.multiplyFloor(netSalesCents, feeBps, 10_000);
  },

  compare(left: number, right: number) {
    assertMinorInt(left);
    assertMinorInt(right);
    if (left < right) return -1;
    if (left > right) return 1;
    return 0;
  },

  max(left: number, right: number) {
    return Money.compare(left, right) >= 0 ? left : right;
  },

  min(left: number, right: number) {
    return Money.compare(left, right) <= 0 ? left : right;
  },

  assertNonNegative(value: number, label = "amount") {
    assertMinorInt(value, label);
    if (value < 0) throw new Error(`${label} must be >= 0`);
  },
};

/**
 * Allocate an order-level discount across eligible lines proportionally
 * by line gross. Sorted by line id for determinism; remainder to last line.
 */
export function allocateDiscountCents(input: {
  lines: Array<{ id: string; grossCents: number }>;
  discountCents: number;
}): Map<string, number> {
  const { lines, discountCents } = input;
  Money.assertNonNegative(discountCents, "discountCents");
  const result = new Map<string, number>();
  for (const line of lines) {
    Money.assertNonNegative(line.grossCents, "grossCents");
    result.set(line.id, 0);
  }
  if (discountCents === 0 || lines.length === 0) return result;

  const totalGross = lines.reduce((sum, line) => Money.add(sum, line.grossCents), 0);
  if (totalGross <= 0) return result;

  const sorted = [...lines].sort((a, b) => a.id.localeCompare(b.id));
  let remaining = Money.min(discountCents, totalGross);

  for (let i = 0; i < sorted.length; i += 1) {
    const line = sorted[i]!;
    const isLast = i === sorted.length - 1;
    const share = isLast
      ? remaining
      : Money.min(
          remaining,
          Money.min(
            line.grossCents,
            Money.multiplyFloor(discountCents, line.grossCents, totalGross),
          ),
        );
    result.set(line.id, share);
    remaining = Money.subtract(remaining, share);
  }

  return result;
}
