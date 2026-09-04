import type { Request, Response } from "express";
import { success } from "../../utils/response";
import { createCategory, listCategories } from "./category.service";
import type { CreateCategoryInput } from "./category.schema";

export async function list(_req: Request, res: Response) {
  const categories = await listCategories();
  res.json(success({ categories }));
}

export async function create(req: Request, res: Response) {
  const category = await createCategory(req.body as CreateCategoryInput);
  res.status(201).json(success({ category }));
}
