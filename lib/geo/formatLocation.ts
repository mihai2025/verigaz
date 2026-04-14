/**
 * Format firm locations for display in cards.
 * If a firm has multiple localities in the same county → enumerate them all.
 * e.g. "Cluj-Napoca, Turda, Câmpia Turzii — Cluj"
 * Single locality: "Cluj-Napoca, Cluj" (unchanged)
 * Multiple counties: "Loc1, Loc2, ..."
 */
export function formatFirmLocations(firm: {
  judete?: { nume?: string | null } | null
  localitati?: { nume?: string | null } | null
  firm_locations?: {
    is_primary?: boolean | null
    judete?: { nume?: string | null } | null
    localitati?: { nume?: string | null } | null
  }[] | null
}): string {
  const allLocs = firm.firm_locations ?? []

  // Collect unique localities (preserve insertion order — primary first)
  const localities: string[] = []
  const counties = new Set<string>()

  // Sort so primary comes first
  const sorted = [...allLocs].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))

  for (const loc of sorted) {
    const l = loc.localitati?.nume?.trim()
    const c = loc.judete?.nume?.trim()
    if (l && !localities.includes(l)) localities.push(l)
    if (c) counties.add(c)
  }

  // Fallback to direct firm fields if no locations
  if (localities.length === 0 && firm.localitati?.nume) {
    localities.push(firm.localitati.nume.trim())
  }
  if (counties.size === 0 && firm.judete?.nume) {
    counties.add(firm.judete.nume.trim())
  }

  const countiesArr = Array.from(counties)

  if (localities.length === 0 && countiesArr.length === 0) return "—"

  // Single county
  if (countiesArr.length <= 1) {
    const county = countiesArr[0] ?? ""
    if (localities.length === 0) return county || "—"
    if (localities.length === 1) return [localities[0], county].filter(Boolean).join(", ")
    // Multiple localities, same county → enumerate
    return county ? `${localities.join(", ")} — ${county}` : localities.join(", ")
  }

  // Multiple counties — list all localities or fall back to counties
  return localities.length > 0 ? localities.join(", ") : countiesArr.join(", ")
}
