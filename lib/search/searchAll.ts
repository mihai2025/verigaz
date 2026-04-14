// lib/search/searchAll.ts
//
// Search cross-entity pentru verigaz:
//   - firme de gaze (gas_firms) cu geo-priority + premium-exclusivity
//   - localități (judete/localitati) cu diacritic-insensitive
//   - pagini publice statice (ALL_SG_PAGES)
//
// Pattern portat din ghidulfunerar (searchAll.ts) dar simplificat:
// fără articles (verigaz nu are blog la MVP) și adaptat la schema gas_firms
// (brand_name, sediu_judet_id, sediu_localitate_id, firm_services).
import { getPublicServerSupabase } from "@/lib/supabase/server"
import { stripDiacritics } from "@/lib/utils/slugify"
import { ALL_SG_PAGES, type SgLink } from "@/lib/servicii-gaze/links"

export type SearchFirm = {
  id: string
  name: string
  slug: string
  plan: string
  logo_url: string | null
  cover_url: string | null
  short_description: string | null
  phone: string | null
  whatsapp: string | null
  facebook_url: string | null
  instagram_url: string | null
  website: string | null
  sediu_judet_id: number | null
  sediu_localitate_id: number | null
  judet_nume: string | null
  localitate_nume: string | null
}

export type SearchPage = SgLink

export type SearchLocality = {
  id: number
  nume: string
  judet_id: number
  judet_nume: string
}

export type SearchResults = {
  q: string
  firms: SearchFirm[]
  pages: SearchPage[]
  localities: SearchLocality[]
}

const PLAN_ORDER: Record<string, number> = { premium: 1, plus: 2, start: 3, free: 4 }

/** Escape chars special pentru filtrul PostgREST `.or()` */
function safeLike(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\*/g, "\\*").replace(/,/g, "\\,")
}

/**
 * Variante de diacritice pentru căutări geo: "brasov" ↔ "brașov", "iasi" ↔ "iași".
 * Substituim individual (nu combinat) ca să nu explodăm numărul de pattern-uri.
 */
function geoVariants(raw: string): string[] {
  const base = safeLike(raw)
  const variants = new Set<string>([base])
  const subs: [RegExp, string][] = [
    [/s/gi, "ș"], [/s/gi, "ş"],
    [/t/gi, "ț"], [/t/gi, "ţ"],
    [/a/gi, "ă"], [/i/gi, "î"],
  ]
  for (const [pat, rep] of subs) {
    const v = safeLike(raw.replace(pat, rep))
    if (v !== base) variants.add(v)
  }
  return [...variants]
}

export async function searchAll(q: string): Promise<SearchResults> {
  const clean = q.trim()
  if (clean.length < 1) {
    return { q: clean, firms: [], pages: [], localities: [] }
  }

  const supabase = getPublicServerSupabase()

  const s     = safeLike(clean)
  const sNorm = safeLike(stripDiacritics(clean))

  const geoOrParts = geoVariants(clean)
    .flatMap((v) => [`nume.ilike.*${v}*`])
    .join(",")

  // ── Step 1: geo lookup (judete + localitati în paralel) ─────────
  const [judetRes, localitateRes] = await Promise.all([
    supabase.from("judete").select("id, nume").or(geoOrParts).limit(50),
    supabase
      .from("localitati")
      .select("id, nume, judet_id, judete(nume)")
      .or(geoOrParts)
      .limit(200),
  ])

  if (judetRes.error)      console.error("[searchAll] judete:", judetRes.error)
  if (localitateRes.error) console.error("[searchAll] localitati:", localitateRes.error)

  const judetRows     = (judetRes.data ?? []) as { id: number; nume: string }[]
  const judetIds      = judetRows.map((r) => r.id)
  const judetMap      = new Map(judetRows.map((r) => [r.id, r.nume]))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const localitateRows = (localitateRes.data ?? []) as any[]
  const localitateIds = localitateRows.map((r: { id: number }) => r.id)

  // ── Step 2: firm_locations geo lookup ──────────────────────────
  // Multe firme operează prin firm_locations, nu doar la sediu.
  let locFirmIds: string[] = []
  if (judetIds.length > 0 || localitateIds.length > 0) {
    const geoParts: string[] = []
    if (judetIds.length)      geoParts.push(`judet_id.in.(${judetIds.join(",")})`)
    if (localitateIds.length) geoParts.push(`localitate_id.in.(${localitateIds.join(",")})`)

    const { data: locData } = await supabase
      .from("firm_locations")
      .select("firm_id")
      .or(geoParts.join(","))
      .limit(500)

    locFirmIds = [...new Set(
      (locData ?? []).map((l) => String(l.firm_id)).filter(Boolean),
    )]
  }

  // ── Step 3: firm text + geo OR filter ──────────────────────────
  const firmOrParts: string[] = [
    `brand_name.ilike.*${s}*`,
    `legal_name.ilike.*${s}*`,
    `short_description.ilike.*${s}*`,
  ]
  if (sNorm !== s) {
    firmOrParts.push(
      `brand_name.ilike.*${sNorm}*`,
      `legal_name.ilike.*${sNorm}*`,
      `short_description.ilike.*${sNorm}*`,
    )
  }
  if (judetIds.length)      firmOrParts.push(`sediu_judet_id.in.(${judetIds.join(",")})`)
  if (localitateIds.length) firmOrParts.push(`sediu_localitate_id.in.(${localitateIds.join(",")})`)
  if (locFirmIds.length)    firmOrParts.push(`id.in.(${locFirmIds.join(",")})`)

  const { data: rawFirmsData, error: firmsError } = await supabase
    .from("gas_firms")
    .select(
      "id, slug, brand_name, legal_name, plan, logo_url, cover_url, short_description, " +
      "phone, whatsapp, facebook_url, instagram_url, website, " +
      "sediu_judet_id, sediu_localitate_id, verification_status, is_active, " +
      "judete:sediu_judet_id(nume), localitati:sediu_localitate_id(nume), " +
      "firm_services(service_categories(slug))",
    )
    .eq("is_active", true)
    .eq("verification_status", "approved")
    .or(firmOrParts.join(","))
    .limit(40)

  if (firmsError) console.error("[searchAll] firms:", firmsError)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawFirms = (rawFirmsData ?? []) as any[]

  const localitateIdSet = new Set(localitateIds)
  const judetIdSet      = new Set(judetIds)
  const locFirmIdSet    = new Set(locFirmIds)

  // 0 = locality match, 1 = county match, 2 = text-only
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawGeoScore = (f: any): number => {
    if (f.sediu_localitate_id != null && localitateIdSet.has(f.sediu_localitate_id)) return 0
    if (locFirmIdSet.has(String(f.id))) return 0
    if (f.sediu_judet_id != null && judetIdSet.has(f.sediu_judet_id)) return 1
    return 2
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawCatSlugs = (f: any): string[] => {
    const fs = Array.isArray(f.firm_services) ? f.firm_services : []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return fs.flatMap((c: any) => {
      const sc = Array.isArray(c.service_categories) ? c.service_categories[0] : c.service_categories
      return sc?.slug ? [sc.slug as string] : []
    })
  }

  // Premium exclusivity: firme premium în aria geografică "dețin" categoriile.
  const premiumGeoCats = new Set<string>()
  for (const f of rawFirms) {
    if (rawGeoScore(f) === 0 && String(f.plan) === "premium") {
      for (const slug of rawCatSlugs(f)) premiumGeoCats.add(slug)
    }
  }

  const eligibleRaw = premiumGeoCats.size === 0 ? rawFirms : rawFirms.filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (f: any) => {
      const score = rawGeoScore(f)
      if (score === 0 && String(f.plan) === "premium") return true
      if (score === 2) return true
      const cats = rawCatSlugs(f)
      if (cats.length === 0) return true
      return !cats.some((slug) => premiumGeoCats.has(slug))
    },
  )

  const firms: SearchFirm[] = eligibleRaw
    .map((f) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const j = (Array.isArray(f.judete) ? f.judete[0] : f.judete) as any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const l = (Array.isArray(f.localitati) ? f.localitati[0] : f.localitati) as any
      return {
        id:                  String(f.id),
        name:                String(f.brand_name ?? f.legal_name ?? ""),
        slug:                String(f.slug),
        plan:                String(f.plan ?? "free"),
        logo_url:            (f.logo_url as string | null) ?? null,
        cover_url:           (f.cover_url as string | null) ?? null,
        short_description:   (f.short_description as string | null) ?? null,
        phone:               (f.phone as string | null) ?? null,
        whatsapp:            (f.whatsapp as string | null) ?? null,
        facebook_url:        (f.facebook_url as string | null) ?? null,
        instagram_url:       (f.instagram_url as string | null) ?? null,
        website:             (f.website as string | null) ?? null,
        sediu_judet_id:      (f.sediu_judet_id as number | null) ?? null,
        sediu_localitate_id: (f.sediu_localitate_id as number | null) ?? null,
        judet_nume:          j?.nume ?? null,
        localitate_nume:     l?.nume ?? null,
      }
    })
    .sort((a, b) => {
      const qLow = clean.toLowerCase()
      const qTokens = qLow.split(/\s+/).filter(Boolean)

      function nameScore(name: string): number {
        const low = name.toLowerCase()
        if (low.startsWith(qLow)) return 0
        if (low.includes(qLow)) return 1
        if (qTokens.some((t) => low.includes(t))) return 2
        return 3
      }
      const nA = nameScore(a.name); const nB = nameScore(b.name)
      if (nA !== nB) return nA - nB

      const pa = PLAN_ORDER[a.plan] ?? 5
      const pb = PLAN_ORDER[b.plan] ?? 5
      if (pa !== pb) return pa - pb

      const geoA = a.sediu_localitate_id != null && localitateIdSet.has(a.sediu_localitate_id) ? 0
                 : locFirmIdSet.has(a.id) ? 0
                 : a.sediu_judet_id != null && judetIdSet.has(a.sediu_judet_id) ? 1
                 : 2
      const geoB = b.sediu_localitate_id != null && localitateIdSet.has(b.sediu_localitate_id) ? 0
                 : locFirmIdSet.has(b.id) ? 0
                 : b.sediu_judet_id != null && judetIdSet.has(b.sediu_judet_id) ? 1
                 : 2
      if (geoA !== geoB) return geoA - geoB

      return a.name.localeCompare(b.name, "ro")
    })
    .slice(0, 6)

  // ── Pagini publice: in-memory, diacritic-insensitive ──────────
  const qNorm = stripDiacritics(clean).toLowerCase()
  const pages: SearchPage[] = ALL_SG_PAGES.filter((p) => {
    const text = stripDiacritics(p.label + " " + (p.description ?? "")).toLowerCase()
    return qNorm.split(/\s+/).some((token) => token.length >= 2 && text.includes(token))
  }).slice(0, 12)

  // ── Localități ─────────────────────────────────────────────────
  const localities: SearchLocality[] = localitateRows
    .map((r: { id: number; nume: string; judet_id: number; judete: { nume: string } | { nume: string }[] | null }) => {
      const j = Array.isArray(r.judete) ? r.judete[0] : r.judete
      return {
        id:         r.id,
        nume:       r.nume,
        judet_id:   r.judet_id,
        judet_nume: j?.nume ?? judetMap.get(r.judet_id) ?? "",
      }
    })
    .slice(0, 10)

  return { q: clean, firms, pages, localities }
}
