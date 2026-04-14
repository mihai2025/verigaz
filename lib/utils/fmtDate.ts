/**
 * Format ISO date string (YYYY-MM-DD or full ISO) as dd.mm.yyyy
 * For display in lists, reports, tables.
 */
export function fmtDateDot(iso: string | null | undefined): string {
  if (!iso) return "—"
  const s = String(iso).slice(0, 10) // take YYYY-MM-DD part
  const parts = s.split("-")
  if (parts.length !== 3) return "—"
  const [y, m, d] = parts
  if (!y || !m || !d) return "—"
  return `${d}.${m}.${y}`
}

/**
 * Format ISO datetime string as dd.mm.yyyy HH:MM
 * For display in lists, reports, tables that include time.
 */
export function fmtDateTimeDot(iso: string | null | undefined): string {
  if (!iso) return "—"
  const s = String(iso).replace("T", " ").replace("Z", "")
  const [datePart, timePart] = s.split(" ")
  if (!datePart) return "—"
  const date = fmtDateDot(datePart)
  if (date === "—") return "—"
  if (!timePart) return date
  const [h, min] = timePart.split(":")
  if (!h || !min) return date
  return `${date} ${h}:${min}`
}
