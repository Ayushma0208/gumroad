import type { Request, Response } from "express";
import { unauthorized } from "../../utils/app-error";
import { success } from "../../utils/response";
import {
  handleRazorpayWebhook,
  verifyRazorpayCheckout,
} from "./payment.service";
import type { VerifyRazorpayInput } from "./payment.validation";

export async function verify(req: Request, res: Response) {
  if (!req.user) throw unauthorized();
  const order = await verifyRazorpayCheckout(
    req.user.id,
    req.body as VerifyRazorpayInput,
  );
  res.json(success({ order }));
}

export async function webhook(req: Request, res: Response) {
  const raw =
    Buffer.isBuffer(req.body)
      ? req.body.toString("utf8")
      : typeof req.body === "string"
        ? req.body
        : JSON.stringify(req.body ?? {});
  const signature = req.header("x-razorpay-signature") ?? undefined;
  const result = await handleRazorpayWebhook(raw, signature);
  res.json(success(result));
}
