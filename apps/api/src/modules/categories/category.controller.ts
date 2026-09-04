import type { Request, Response } from "express";
import { success } from "../../utils/response";
import {
  createCategory,
  deleteCategory,
  getCategoryBySlug,
  listCategories,
  updateCategory,
} from "./category.service";
import type { CreateCategoryInput, UpdateCategoryInput } from "./category.validation";

export async function list(_req: Request, res: Response) {
  const categories = await listCategories();
  res.json(success({ categories }));
}

export async function getBySlug(req: Request, res: Response) {
  const category = await getCategoryBySlug(String(req.params.slug));
  res.json(success({ category }));
}

export async function create(req: Request, res: Response) {
  const category = await createCategory(req.body as CreateCategoryInput);
  res.status(201).json(success({ category }));
}

export async function update(req: Request, res: Response) {
  const category = await updateCategory(
    String(req.params.id),
    req.body as UpdateCategoryInput,
  );
  res.json(success({ category }));
}

export async function remove(req: Request, res: Response) {
  const result = await deleteCategory(String(req.params.id));
  res.json(success(result));
}
