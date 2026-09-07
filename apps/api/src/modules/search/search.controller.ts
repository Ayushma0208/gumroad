import type { Request, Response } from "express";
import { success } from "../../utils/response";
import type { SearchQuery, SuggestQuery } from "./search.schema";
import { searchMarketplace, suggestSearch } from "./search.service";

export async function search(req: Request, res: Response) {
  const data = await searchMarketplace(req.query as unknown as SearchQuery);
  res.json(success(data));
}

export async function suggest(req: Request, res: Response) {
  const data = await suggestSearch(req.query as unknown as SuggestQuery);
  res.json(success(data));
}
