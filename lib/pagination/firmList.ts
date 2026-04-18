// lib/pagination/firmList.ts
// Helper pentru paginația SEO a listingurilor de firme.
// Pagina 1 nu include query param în URL canonical (evită duplicate content);
// paginile >1 includ `?page=N`.

export const PAGE_SIZE = 50

export type PaginationMeta = {
  currentPage: number
  totalPages: number
  basePath: string
}

/**
 * Parsează parametrul `page` din searchParams (string | string[] | undefined)
 * și-l clampuiește la [1, +∞). Valori invalide → 1.
 */
export function parsePageParam(raw: string | string[] | undefined): number {
  const v = Array.isArray(raw) ? raw[0] : raw
  if (!v) return 1
  const n = Number.parseInt(v, 10)
  if (!Number.isFinite(n) || n < 1) return 1
  return n
}

/**
 * Felie-ează `items` pentru pagina cerută. Dacă `page` > totalPages, clampează
 * la ultima pagină (pentru a evita 404 accidental). Pentru listă goală
 * totalPages = 1, currentPage = 1.
 */
export function paginate<T>(
  items: T[],
  page: number,
  pageSize: number = PAGE_SIZE,
): { items: T[]; totalPages: number; currentPage: number } {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const currentPage = Math.min(Math.max(1, page), totalPages)
  const start = (currentPage - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    totalPages,
    currentPage,
  }
}

/**
 * Construiește URL-ul pentru o pagină dată. Pagina 1 → basePath fără query.
 * Altfel → basePath?page=N.
 */
export function buildPageUrl(basePath: string, page: number): string {
  if (page <= 1) return basePath
  return `${basePath}?page=${page}`
}
