import crypto from "node:crypto";
import Razorpay from "razorpay";
import { env } from "../../config/env";
import { serviceUnavailable } from "../../utils/app-error";

export type RazorpayOrderResult = {
  id: string;
  amount: number;
  currency: string;
};

function credentials() {
  const keyId = env.RAZORPAY_KEY_ID?.trim();
  const keySecret = env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) {
    throw serviceUnavailable("Payments are not configured.");
  }
  return { keyId, keySecret };
}

export function getRazorpayKeyId() {
  return credentials().keyId;
}

function client() {
  const { keyId, keySecret } = credentials();
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export async function createRazorpayOrder(input: {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrderResult> {
  const order = await client().orders.create({
    amount: input.amount,
    currency: input.currency,
    receipt: input.receipt.slice(0, 40),
    notes: input.notes,
  });
  return {
    id: String(order.id),
    amount: Number(order.amount),
    currency: String(order.currency),
  };
}

export function verifyCheckoutSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const { keySecret } = credentials();
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(input.signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw serviceUnavailable("Payment webhooks are not configured.");
  }
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
