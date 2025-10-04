import { useState, useEffect } from 'react';

export function usePagination(totalItems: number, pageSize: number) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    if (page >= pageCount) setPage(Math.max(0, pageCount - 1));
  }, [pageCount, page]);

  const paginatedItems = <T>(items: T[]) => items.slice(page * pageSize, (page + 1) * pageSize);

  return {
    page,
    setPage,
    pageCount,
    paginatedItems,
  };
}