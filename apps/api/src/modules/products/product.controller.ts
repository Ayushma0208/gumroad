import type { Request, Response } from "express";
import { unauthorized } from "../../utils/app-error";
import { success } from "../../utils/response";
import {
  createProduct,
  getPublishedProductBySlug,
  listPublishedProducts,
  updateProduct,
} from "./product.service";
import type { CreateProductInput, UpdateProductInput } from "./product.schema";

export async function list(req: Request, res: Response) {
  const products = await listPublishedProducts({
    category: typeof req.query.category === "string" ? req.query.category : undefined,
    q: typeof req.query.q === "string" ? req.query.q : undefined,
    featured: req.query.featured === "true",
  });
  res.json(success({ products }));
}

export async function getBySlug(req: Request, res: Response) {
  const product = await getPublishedProductBySlug(String(req.params.slug));
  res.json(success({ product }));
}

export async function create(req: Request, res: Response) {
  if (!req.user) throw unauthorized();
  const product = await createProduct(req.user.id, req.body as CreateProductInput);
  res.status(201).json(success({ product }));
}

export async function update(req: Request, res: Response) {
  if (!req.user) throw unauthorized();
  const product = await updateProduct(
    req.user.id,
    String(req.params.id),
    req.body as UpdateProductInput,
  );
  res.json(success({ product }));
}
