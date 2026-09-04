export type PaginationQuery = {
  page: number;
  limit: number;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export function parsePagination(
  page: number | undefined,
  limit: number | undefined,
): PaginationQuery {
  const safePage = Number.isFinite(page) && (page ?? 0) > 0 ? Math.floor(page ?? 1) : 1;
  const safeLimit = Number.isFinite(limit) && (limit ?? 0) > 0 ? Math.min(48, Math.floor(limit ?? 20)) : 20;
  return { page: safePage, limit: safeLimit };
}

export function skipTake({ page, limit }: PaginationQuery) {
  return { skip: (page - 1) * limit, take: limit };
}

export function paginationMeta(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1 && totalPages > 0,
  };
}
