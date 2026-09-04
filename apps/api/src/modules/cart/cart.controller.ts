import type { Request, Response } from "express";
import { unauthorized } from "../../utils/app-error";
import { success } from "../../utils/response";
import {
  addCartItem,
  clearCart,
  getCartForCustomer,
  removeCartItem,
  updateCartItem,
} from "./cart.service";
import type { AddCartItemInput, UpdateCartItemInput } from "./cart.validation";

function customerId(req: Request) {
  if (!req.user) throw unauthorized();
  return req.user.id;
}

export async function getCart(req: Request, res: Response) {
  const cart = await getCartForCustomer(customerId(req));
  res.json(success(cart));
}

export async function addItem(req: Request, res: Response) {
  const cart = await addCartItem(customerId(req), req.body as AddCartItemInput);
  res.status(201).json(success(cart));
}

export async function updateItem(req: Request, res: Response) {
  const cart = await updateCartItem(
    customerId(req),
    String(req.params.itemId),
    req.body as UpdateCartItemInput,
  );
  res.json(success(cart));
}

export async function removeItem(req: Request, res: Response) {
  const cart = await removeCartItem(customerId(req), String(req.params.itemId));
  res.json(success(cart));
}

export async function emptyCart(req: Request, res: Response) {
  const cart = await clearCart(customerId(req));
  res.json(success(cart));
}
