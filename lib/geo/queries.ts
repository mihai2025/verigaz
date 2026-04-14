// lib/geo/queries.ts
import { cache } from "react"
import { getPublicServerSupabase } from "@/lib/supabase/server"
import { slugifyRO } from "@/lib/utils/slugify"

/* =========================
   Types
   ========================= */

export type CountyRow = {
  id: number
  nume: string
}

export type LocalityRow = {
  id: number
  nume: string
  judet_id: number
  judete?: { nume: string } | null
}

/* =========================
   County queries
   ========================= */

/** All counties ordered alphabetically */
export const getAllCounties = cache(async (): Promise<CountyRow[]> => {
  const supabase = getPublicServerSupabase()
  const { data, error } = await supabase
    .from("judete")
    .select("id, nume")
    .order("nume", { ascending: true })

  if (error) {
    console.error("[geo] getAllCounties error:", error.message)
    return []
  }
  return (data ?? []) as CountyRow[]
})

/** Resolve a slug to a county by comparing slugifyRO(nume) */
export const getCountyBySlug = cache(async (slug: string): Promise<CountyRow | null> => {
  const counties = await getAllCounties()
  const matches = counties.filter((c) => slugifyRO(c.nume) === slug)

  if (matches.length === 0) return null
  if (matches.length > 1) {
    console.warn(`[geo] County slug collision for "${slug}": ${matches.map((c) => c.id).join(", ")}. Using first by id.`)
  }
  return matches.sort((a, b) => a.id - b.id)[0]
})

/* =========================
   Locality queries
   ========================= */

/** Top localities by firm count (for /localitati listing) */
export const getTopLocalities = cache(async (limit = 300): Promise<(LocalityRow & { firm_count?: number })[]> => {
  const supabase = getPublicServerSupabase()

  // Try to get localities with firm counts using a subquery approach
  // We count firms that reference this locality via firm_locations (primary) or funeral_firms.localitate_id
  const { data, error } = await supabase
    .from("localitati")
    .select("id, nume, judet_id, judete(nume)")
    .order("nume", { ascending: true })
    .limit(limit)

  if (error) {
    console.error("[geo] getTopLocalities error:", error.message)
    return []
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    nume: row.nume,
    judet_id: row.judet_id,
    judete: Array.isArray(row.judete) ? row.judete[0] : row.judete,
  }))
})

/** All localities for a given county */
export const getLocalitiesByCounty = cache(async (countyId: number): Promise<LocalityRow[]> => {
  const supabase = getPublicServerSupabase()
  const { data, error } = await supabase
    .from("localitati")
    .select("id, nume, judet_id, judete(nume)")
    .eq("judet_id", countyId)
    .order("nume", { ascending: true })

  if (error) {
    console.error("[geo] getLocalitiesByCounty error:", error.message)
    return []
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    nume: row.nume,
    judet_id: row.judet_id,
    judete: Array.isArray(row.judete) ? row.judete[0] : row.judete,
  }))
})

/** Resolve a locality slug.
 *  New format: "<name-slug>--<county-slug>"  (e.g. "sacele--brasov")
 *  Old format: "<name-slug>--<judet_id>"     (e.g. "sacele--36")  — backward compat
 */
export const getLocalityBySlug = cache(async (slug: string): Promise<(LocalityRow & { county_name: string }) | null> => {
  const parts = slug.split("--")
  if (parts.length < 2) return null

  const countyPart = parts[parts.length - 1]
  const nameSlug = parts.slice(0, -1).join("--")
  if (!nameSlug || !countyPart) return null

  // Try new format first: county slug (non-numeric)
  if (!/^\d+$/.test(countyPart)) {
    const county = await getCountyBySlug(countyPart)
    if (county) {
      const localities = await getLocalitiesByCounty(county.id)
      const match = localities.find((row: LocalityRow) => slugifyRO(row.nume) === nameSlug)
      if (match) {
        return { id: match.id, nume: match.nume, judet_id: match.judet_id, judete: match.judete, county_name: county.nume }
      }
    }
    return null
  }

  // Old format fallback: numeric judet_id
  const judetId = Number(countyPart)
  if (!Number.isFinite(judetId) || judetId <= 0) return null

  const localities = await getLocalitiesByCounty(judetId)
  const match = localities.find((row: LocalityRow) => slugifyRO(row.nume) === nameSlug)
  if (!match) return null

  return {
    id: match.id,
    nume: match.nume,
    judet_id: match.judet_id,
    judete: match.judete,
    county_name: match.judete?.nume ?? "",
  }
})

/* =========================
   Firm queries for /firme routes
   ========================= */

// lib/geo/queries.ts

export type FirmListItem = {
  id: string
  name: string
  slug: string
  plan: string

  short_description: string | null
  description?: string | null

  logo_url: string | null
  cover_url?: string | null

  phone: string | null
  whatsapp?: string | null
  website?: string | null

  facebook_url?: string | null
  instagram_url?: string | null
  tiktok_url?: string | null

  judet_id: number | null
  localitate_id: number | null

  judete: { nume: string } | null
  localitati: { nume: string } | null

  firm_locations: {
    id: string
    is_primary: boolean
    judet_id: number | null
    localitate_id: number | null
    judete: { nume: string } | null
    localitati: { nume: string } | null
  }[] | null
}

const FIRM_LIST_SELECT = `
  id, name, slug, plan,
  short_description, description,
  logo_url, cover_url,
  phone, whatsapp, email, website,
  facebook_url, instagram_url, tiktok_url,
  judet_id, localitate_id,
  judete(nume), localitati(nume),
  firm_locations(id, is_primary, judet_id, localitate_id, judete(nume), localitati(nume))
`

const FIRM_LIST_SELECT_INNER = `
  id, name, slug, plan,
  short_description, description,
  logo_url, cover_url,
  phone, whatsapp, email, website,
  facebook_url, instagram_url, tiktok_url,
  judet_id, localitate_id,
  judete(nume), localitati(nume),
  firm_locations!inner(id, is_primary, judet_id, localitate_id, judete(nume), localitati(nume))
`

const PLAN_ORDER: Record<string, number> = { premium: 0, plus: 1, free: 2 }

/** Deduplicate by firm.id, sort by plan priority (case-insensitive), normalize rows */
function dedupeAndSort(rows: any[]): FirmListItem[] {
  const seen = new Set<string>()
  const merged: any[] = []
  for (const f of rows) {
    if (seen.has(f.id)) continue
    seen.add(f.id)
    merged.push(f)
  }
  merged.sort((a, b) => {
    const pa = PLAN_ORDER[(a.plan ?? "").toLowerCase()] ?? 2
    const pb = PLAN_ORDER[(b.plan ?? "").toLowerCase()] ?? 2
    return pa - pb
  })
  return normalizeFirmRows(merged)
}

/** Firms in a county (via firm_locations primary or funeral_firms.judet_id) */
export const getFirmsByCounty = cache(async (countyId: number): Promise<FirmListItem[]> => {
  const supabase = getPublicServerSupabase()

  // Query 1: firms whose own judet_id matches
  const { data: directFirms, error: err1 } = await supabase
    .from("funeral_firms")
    .select(FIRM_LIST_SELECT)
    .eq("judet_id", countyId)
    .eq("status", "active")
    .limit(500)

  if (err1) console.error("[geo] getFirmsByCounty direct error:", err1.message)

  // Query 2: firms that have a primary location in this county (!inner join)
  const { data: locationFirms, error: err2 } = await supabase
    .from("funeral_firms")
    .select(FIRM_LIST_SELECT_INNER)
    .eq("firm_locations.judet_id", countyId)
    .eq("firm_locations.is_primary", true)
    .eq("status", "active")
    .limit(500)

  if (err2) console.error("[geo] getFirmsByCounty location error:", err2.message)

  return dedupeAndSort([...(directFirms ?? []), ...(locationFirms ?? [])])
})

/** Firms in a specific locality */
export const getFirmsByLocality = cache(async (localityId: number, countyId: number): Promise<FirmListItem[]> => {
  const supabase = getPublicServerSupabase()

  // Query 1: firms whose own localitate_id matches
  const { data: directFirms, error: err1 } = await supabase
    .from("funeral_firms")
    .select(FIRM_LIST_SELECT)
    .eq("localitate_id", localityId)
    .eq("status", "active")
    .limit(500)

  if (err1) console.error("[geo] getFirmsByLocality direct error:", err1.message)

  // Query 2: firms that have a primary location in this locality (!inner join)
  const { data: locationFirms, error: err2 } = await supabase
    .from("funeral_firms")
    .select(FIRM_LIST_SELECT_INNER)
    .eq("firm_locations.localitate_id", localityId)
    .eq("firm_locations.is_primary", true)
    .eq("status", "active")
    .limit(500)

  if (err2) console.error("[geo] getFirmsByLocality location error:", err2.message)

  return dedupeAndSort([...(directFirms ?? []), ...(locationFirms ?? [])])
})

function normalizeFirmRows(rows: any[]): FirmListItem[] {
  return rows.map((f) => ({
    ...f,
    judete: Array.isArray(f.judete) ? f.judete[0] : f.judete,
    localitati: Array.isArray(f.localitati) ? f.localitati[0] : f.localitati,
    firm_locations: Array.isArray(f.firm_locations)
      ? f.firm_locations.map((l: any) => ({
          ...l,
          judete: Array.isArray(l.judete) ? l.judete[0] : l.judete,
          localitati: Array.isArray(l.localitati) ? l.localitati[0] : l.localitati,
        }))
      : null,
  }))
}

export type LocalityActiveRow = {
  localitate_id: number
  localitate_nume: string
  judet_id: number
  judet_nume: string
  firm_count: number
}

export const getIndexableLocalities = cache(async (limit = 20000): Promise<LocalityActiveRow[]> => {
  const supabase = getPublicServerSupabase()
  const { data, error } = await supabase
    .from("mv_localitati_active")
    .select("localitate_id, localitate_nume, judet_id, judet_nume, firm_count")
    .gte("firm_count", 1)
    .order("firm_count", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("[geo] getIndexableLocalities error:", error.message)
    return []
  }
  return (data ?? []) as LocalityActiveRow[]
})


/** Resolve a locality by name slug + county slug — for /servicii/{cat}/{county}/{loc} routes
 *  where the county is already in the path (no --county suffix needed on loc slug).
 */
export const getLocalityByNameAndCounty = cache(async (nameSlug: string, countySlug: string): Promise<(LocalityRow & { county_name: string }) | null> => {
  const county = await getCountyBySlug(countySlug)
  if (!county) return null
  const localities = await getLocalitiesByCounty(county.id)
  const match = localities.find((row: LocalityRow) => slugifyRO(row.nume) === nameSlug)
  if (!match) return null
  return { ...match, county_name: county.nume }
})

/** Top localities for a county by firm count (from mv_localitati_active), with at least 1 firm */
export const getActiveLocalitiesByCounty = cache(async (countyId: number, limit = 10): Promise<LocalityActiveRow[]> => {
  const supabase = getPublicServerSupabase()
  const { data, error } = await supabase
    .from("mv_localitati_active")
    .select("localitate_id, localitate_nume, judet_id, judet_nume, firm_count")
    .eq("judet_id", countyId)
    .gte("firm_count", 1)
    .order("firm_count", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("[geo] getActiveLocalitiesByCounty error:", error.message)
    return []
  }
  return (data ?? []) as LocalityActiveRow[]
})

/** Nearby localities in the same county (with firms), excluding the current one */
export const getNearbyLocalities = cache(async (countyId: number, excludeLocalityId: number, limit = 8): Promise<LocalityActiveRow[]> => {
  const supabase = getPublicServerSupabase()
  const { data, error } = await supabase
    .from("mv_localitati_active")
    .select("localitate_id, localitate_nume, judet_id, judet_nume, firm_count")
    .eq("judet_id", countyId)
    .neq("localitate_id", excludeLocalityId)
    .gte("firm_count", 1)
    .order("firm_count", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("[geo] getNearbyLocalities error:", error.message)
    return []
  }
  return (data ?? []) as LocalityActiveRow[]
})

/** Firm count for a single locality (from the view). Returns 0 if not found. */
export const getLocalityFirmCount = cache(async (localityId: number): Promise<number> => {
  const supabase = getPublicServerSupabase()
  const { data, error } = await supabase
    .from("v_localitati_active")
    .select("firm_count")
    .eq("localitate_id", localityId)
    .maybeSingle()

  if (error) {
    console.error("[geo] getLocalityFirmCount error:", error.message)
    return 0
  }

  return data?.firm_count ?? 0
})
