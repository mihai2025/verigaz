// components/ui/Paginator.tsx
// Paginator SEO-friendly cu link-uri relative (`?page=N`).
// Pagina 1 → URL fără query; celelalte → `?page=N`.
// Pagina curentă e redată ca <span aria-current="page"> (nu link).
import Link from "next/link"
import { buildPageUrl } from "@/lib/pagination/firmList"

type Props = {
  basePath: string
  currentPage: number
  totalPages: number
  /** Câte pagini să arate în jurul celei curente înainte să apară elipsa. */
  siblingCount?: number
}

function range(start: number, end: number): number[] {
  const out: number[] = []
  for (let i = start; i <= end; i++) out.push(i)
  return out
}

/**
 * Construiește lista de "elemente" afișate: numere + marker-e de elipsă.
 * Ex: totalPages=10, current=5 → [1, '…', 3,4,5,6,7, '…', 10].
 */
function buildPages(
  currentPage: number,
  totalPages: number,
  siblingCount: number,
): Array<number | "ellipsis-left" | "ellipsis-right"> {
  if (totalPages <= 1) return [1]
  const first = 1
  const last = totalPages
  const leftSibling = Math.max(currentPage - siblingCount, first + 1)
  const rightSibling = Math.min(currentPage + siblingCount, last - 1)

  const showLeftEllipsis = leftSibling > first + 1
  const showRightEllipsis = rightSibling < last - 1

  const items: Array<number | "ellipsis-left" | "ellipsis-right"> = [first]
  if (showLeftEllipsis) items.push("ellipsis-left")
  else if (first + 1 <= leftSibling - 1) {
    // fallback: adaugă paginile dintre first și leftSibling
    for (const n of range(first + 1, leftSibling - 1)) items.push(n)
  }
  for (const n of range(leftSibling, rightSibling)) items.push(n)
  if (showRightEllipsis) items.push("ellipsis-right")
  else if (rightSibling + 1 <= last - 1) {
    for (const n of range(rightSibling + 1, last - 1)) items.push(n)
  }
  if (last > first) items.push(last)
  return items
}

export function Paginator({
  basePath,
  currentPage,
  totalPages,
  siblingCount = 2,
}: Props) {
  if (totalPages <= 1) return null
  const items = buildPages(currentPage, totalPages, siblingCount)
  const prevPage = currentPage > 1 ? currentPage - 1 : null
  const nextPage = currentPage < totalPages ? currentPage + 1 : null

  return (
    <nav className="sv-paginator" aria-label="Paginație">
      {prevPage ? (
        <Link
          className="sv-paginator__prev"
          href={buildPageUrl(basePath, prevPage)}
          rel="prev"
        >
          « Anterior
        </Link>
      ) : (
        <span className="sv-paginator__prev sv-paginator__disabled" aria-hidden="true">
          « Anterior
        </span>
      )}

      <ul className="sv-paginator__pages">
        {items.map((it, idx) => {
          if (it === "ellipsis-left" || it === "ellipsis-right") {
            return (
              <li key={`${it}-${idx}`} className="sv-paginator__ellipsis" aria-hidden="true">
                …
              </li>
            )
          }
          const isCurrent = it === currentPage
          return (
            <li key={it} className={isCurrent ? "sv-paginator__current" : undefined}>
              {isCurrent ? (
                <span aria-current="page">{it}</span>
              ) : (
                <Link href={buildPageUrl(basePath, it)}>{it}</Link>
              )}
            </li>
          )
        })}
      </ul>

      {nextPage ? (
        <Link
          className="sv-paginator__next"
          href={buildPageUrl(basePath, nextPage)}
          rel="next"
        >
          Următor »
        </Link>
      ) : (
        <span className="sv-paginator__next sv-paginator__disabled" aria-hidden="true">
          Următor »
        </span>
      )}
    </nav>
  )
}
