import type { Request, Response } from "express";
import { unauthorized } from "../../utils/app-error";
import { success } from "../../utils/response";
import {
  archiveProduct,
  createProduct,
  deleteProduct,
  getProductByIdForViewer,
  getPublishedProductBySlug,
  listFeaturedProducts,
  listMyProducts,
  listPublishedProducts,
  listRelatedProducts,
  listTrendingProducts,
  publishProduct,
  updateProduct,
} from "./product.service";
import type {
  CreateProductInput,
  ListProductsQuery,
  UpdateProductInput,
} from "./product.validation";

function actor(req: Request) {
  if (!req.user) throw unauthorized();
  return req.user;
}

export async function list(req: Request, res: Response) {
  const result = await listPublishedProducts(req.query as ListProductsQuery);
  res.json(success(result));
}

export async function featured(req: Request, res: Response) {
  const result = await listFeaturedProducts(
    Number(req.query.page) || undefined,
    Number(req.query.limit) || undefined,
  );
  res.json(success(result));
}

export async function trending(req: Request, res: Response) {
  const result = await listTrendingProducts(
    Number(req.query.page) || undefined,
    Number(req.query.limit) || undefined,
  );
  res.json(success(result));
}

export async function mine(req: Request, res: Response) {
  const user = actor(req);
  const result = await listMyProducts(user.id, user.role, {
    status:
      typeof req.query.status === "string"
        ? (req.query.status as "DRAFT" | "PUBLISHED" | "ARCHIVED")
        : undefined,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });
  res.json(success(result));
}

export async function getBySlug(req: Request, res: Response) {
  const product = await getPublishedProductBySlug(String(req.params.slug));
  res.json(success({ product }));
}

export async function getById(req: Request, res: Response) {
  const product = await getProductByIdForViewer(String(req.params.id), req.user);
  res.json(success({ product }));
}

export async function related(req: Request, res: Response) {
  const items = await listRelatedProducts(String(req.params.id));
  res.json(success({ items }));
}

export async function create(req: Request, res: Response) {
  const user = actor(req);
  const product = await createProduct(user.id, user.role, req.body as CreateProductInput);
  res.status(201).json(success({ product }));
}

export async function update(req: Request, res: Response) {
  const user = actor(req);
  const product = await updateProduct(
    user.id,
    user.role,
    String(req.params.id),
    req.body as UpdateProductInput,
  );
  res.json(success({ product }));
}

export async function publish(req: Request, res: Response) {
  const user = actor(req);
  const product = await publishProduct(user.id, user.role, String(req.params.id));
  res.json(success({ product }));
}

export async function archive(req: Request, res: Response) {
  const user = actor(req);
  const product = await archiveProduct(user.id, user.role, String(req.params.id));
  res.json(success({ product }));
}

export async function remove(req: Request, res: Response) {
  const user = actor(req);
  const result = await deleteProduct(user.id, user.role, String(req.params.id));
  res.json(success(result));
}
