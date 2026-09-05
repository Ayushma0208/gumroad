/** Catalog prices and Razorpay amounts use the same minor unit (cents / paise). */

export function majorFromMinor(minor: number) {
  return Number((minor / 100).toFixed(2));
}

export function razorpayAmountFromCatalog(minorUnits: number) {
  return minorUnits;
}
