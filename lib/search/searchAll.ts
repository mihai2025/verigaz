// lib/search/searchAll.ts
import { getPublicServerSupabase } from "@/lib/supabase/server"
import { stripDiacritics } from "@/lib/utils/slugify"
import {
  HUB,
  SUB_HUB_GHID,
  RITUAL_PAGES,
  FAQ_PAGES,
  EVENT_PAGES,
  RESOURCE_PAGES,
  TRADITION_PAGES,
  GHID_COMPLET_PARASTAS,
  GHID_COMPLET_TRADITII,
  GHID_COMPLET_DOLIU,
  CALCULATOR_PARASTASE,
  REMINDER_PARASTASE,
  type SfLink,
} from "@/lib/servicii-funerare/links"

const ALL_PAGES: SfLink[] = [
  HUB,
  SUB_HUB_GHID,
  ...RITUAL_PAGES,
  ...FAQ_PAGES,
  ...EVENT_PAGES,
  ...RESOURCE_PAGES,
  ...TRADITION_PAGES,
  GHID_COMPLET_PARASTAS,
  GHID_COMPLET_TRADITII,
  GHID_COMPLET_DOLIU,
  CALCULATOR_PARASTASE,
  REMINDER_PARASTASE,
]

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
  tiktok_url: string | null
  website: string | null
  judet_id: number | null
  localitate_id: number | null
  judet_nome: string | null
  localitate_nome: string | null
}

export type SearchArticle = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  tag: string | null
  cover_url: string | null
  published_at: string | null
}

export type SearchPage = SfLink

export type SearchLocality = {
  id: number
  nume: string
  judet_id: number
  judet_nume: string
}

export type SearchResults = {
  q: string
  firms: SearchFirm[]
  articles: SearchArticle[]
  pages: SearchPage[]
  localities: SearchLocality[]
}

const PLAN_ORDER: Record<string, number> = { premium: 1, plus: 2, start: 3 }

/** Escape chars special for PostgREST .or() filter strings */
function safeLike(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\*/g, "\\*").replace(/,/g, "\\,")
}

/**
 * Generate diacritic variants for a Romanian search token so that
 * "brasov" also matches "Brașov" in the DB without false positives.
 * We replace each ASCII char that has a Romanian diacritic twin with
 * both the ASCII and diacritic form, running through a small set of
 * explicit substitutions — much safer than the wildcard (_) approach
 * which creates patterns like "p_r_____" that match unrelated words.
 *
 * Returns an array of ILIKE-safe strings to OR together for geo lookups.
 * Kept small: only the four substitutions that matter for city names.
 */
function geoVariants(raw: string): string[] {
  const base = safeLike(raw)
  const variants = new Set<string>([base])

  // Build a version where ASCII ↔ diacritic equivalents are tried.
  // We only swap the most city-name-relevant pairs.
  const subs: [RegExp, string][] = [
    [/s/gi, "ș"],  // s → ș (comma below, standard modern)
    [/s/gi, "ş"],  // s → ş (cedilla, legacy DBs)
    [/t/gi, "ț"],  // t → ț (comma below, standard modern)
    [/t/gi, "ţ"],  // t → ţ (cedilla, legacy DBs)
    [/a/gi, "ă"],
    [/i/gi, "î"],
  ]
  // Try each substitution individually (not combined, to limit explosion)
  for (const [pat, rep] of subs) {
    const v = safeLike(raw.replace(pat, rep))
    if (v !== base) variants.add(v)
  }
  return [...variants]
}

export async function searchAll(q: string): Promise<SearchResults> {
  const clean = q.trim()

  if (clean.length < 1) {
    return { q: clean, firms: [], articles: [], pages: [], localities: [] }
  }

  const supabase = getPublicServerSupabase()

  const s     = safeLike(clean)
  const sNorm = safeLike(stripDiacritics(clean))

  // ── Geo variants: safe diacritic substitution for city/county names ─
  // geoVariants("brasov") → ["brasov", "brașov", "bratsov", ...]
  // Much safer than the old _ wildcard approach which matched unrelated
  // words (e.g. "parastas" → "p_r_____" matching "Perşunari", etc.)
  const geoOrParts = geoVariants(clean)
    .flatMap((v) => [`nume.ilike.*${v}*`])
    .join(",")

  // ── Article OR filter: full phrase + per-token (≥4 chars) ──────
  // "parastas 7 ani" → also tries "parastas" alone so it finds
  // "Parastas la 7 ani" even though the exact phrase doesn't match.
  const articleOrParts: string[] = [
    `title.ilike.*${s}*`,
    `excerpt.ilike.*${s}*`,
  ]
  if (sNorm !== s) {
    articleOrParts.push(`title.ilike.*${sNorm}*`, `excerpt.ilike.*${sNorm}*`)
  }
  for (const token of clean.split(/\s+/).filter((t) => t.length >= 2)) {
    const st = safeLike(token)
    const stNorm = safeLike(stripDiacritics(token))
    articleOrParts.push(`title.ilike.*${st}*`, `excerpt.ilike.*${st}*`)
    if (stNorm !== st) articleOrParts.push(`title.ilike.*${stNorm}*`, `excerpt.ilike.*${stNorm}*`)
  }
  const articleOrFilter = [...new Set(articleOrParts)].join(",")

  // ── Step 1: geo lookup + articles in parallel ─────────────────
  const [judetRes, localitateRes, articlesRes] = await Promise.all([
    supabase
      .from("judete")
      .select("id, nume")
      .or(geoOrParts)
      .limit(50),
    supabase
      .from("localitati")
      .select("id, nume, judet_id, judete(nume)")
      .or(geoOrParts)
      .limit(200),
    supabase
      .from("articles")
      .select("id, title, slug, excerpt, tag, cover_url, published_at")
      .eq("is_published", true)
      .or(articleOrFilter)
      .order("published_at", { ascending: false })
      .limit(5),
  ])

  if (judetRes.error)    console.error("[searchAll] judete:", judetRes.error)
  if (localitateRes.error) console.error("[searchAll] localitati:", localitateRes.error)
  if (articlesRes.error) console.error("[searchAll] articles:", articlesRes.error)

  const judetRows     = (judetRes.data ?? []) as { id: number; nume: string }[]
  const judetIds      = judetRows.map((r) => r.id)
  const judetMap      = new Map(judetRows.map((r) => [r.id, r.nume]))
  const localitateRows = (localitateRes.data ?? []) as { id: number; nume: string; judet_id: number; judete: { nume: string } | { nume: string }[] | null }[]
  const localitateIds = localitateRows.map((r) => r.id)

  // ── Step 2: firm_locations geo lookup ─────────────────────────
  // Critical: many firms store location only in firm_locations, not in funeral_firms.judet_id
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
      (locData ?? []).map((l) => String(l.firm_id)).filter(Boolean)
    )]
  }

  // ── Step 3: firm text + geo OR filter ─────────────────────────
  // dWild NOT used for name/description — same false-positive risk as articles.
  // Geo-based firm discovery (firm_locations) handles the city/county matching.
  const firmOrParts: string[] = [
    `name.ilike.*${s}*`,
    `short_description.ilike.*${s}*`,
  ]

  // sNorm: user types with diacritics, DB stores without (or vice versa)
  if (sNorm !== s) {
    firmOrParts.push(`name.ilike.*${sNorm}*`, `short_description.ilike.*${sNorm}*`)
  }

  // direct geo on funeral_firms columns
  if (judetIds.length)      firmOrParts.push(`judet_id.in.(${judetIds.join(",")})`)
  if (localitateIds.length) firmOrParts.push(`localitate_id.in.(${localitateIds.join(",")})`)

  // indirect geo via firm_locations
  if (locFirmIds.length) firmOrParts.push(`id.in.(${locFirmIds.join(",")})`)

  const { data: rawFirmsData, error: firmsError } = await supabase
    .from("funeral_firms")
    .select(
      "id, name, slug, plan, logo_url, cover_url, short_description, phone, whatsapp, " +
      "facebook_url, instagram_url, tiktok_url, website, judet_id, localitate_id, " +
      "judete(nume), localitati(nume), firm_categories(service_categories(slug))"
    )
    .or(firmOrParts.join(","))
    .limit(40)

  if (firmsError) console.error("[searchAll] firms:", firmsError)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawFirms = (rawFirmsData ?? []) as any[]

  // Sets for geo-priority scoring
  const localitateIdSet = new Set(localitateIds)
  const judetIdSet      = new Set(judetIds)
  const locFirmIdSet    = new Set(locFirmIds)

  // 0 = locality match, 1 = county match, 2 = text-only
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawGeoScore = (f: any): number => {
    if (f.localitate_id != null && localitateIdSet.has(f.localitate_id)) return 0
    if (locFirmIdSet.has(String(f.id))) return 0
    if (f.judet_id != null && judetIdSet.has(f.judet_id)) return 1
    return 2
  }

  // Extract service category slugs from a raw firm row
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawCatSlugs = (f: any): string[] => {
    const fc = Array.isArray(f.firm_categories) ? f.firm_categories : []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return fc.flatMap((c: any) => {
      const sc = Array.isArray(c.service_categories) ? c.service_categories[0] : c.service_categories
      return sc?.slug ? [sc.slug as string] : []
    })
  }

  // Premium exclusivity: categories "owned" by premium firms in the searched geo area.
  // A premium geo firm "owns" its categories → competing firms from the same geo are hidden.
  const premiumGeoCats = new Set<string>()
  for (const f of rawFirms) {
    if (rawGeoScore(f) === 0 && String(f.plan) === "premium") {
      for (const slug of rawCatSlugs(f)) premiumGeoCats.add(slug)
    }
  }

  // Keep a firm if:
  //   a) it is a premium geo firm (always shown), OR
  //   b) it has no geo match (text-only — unaffected by local exclusivity), OR
  //   c) it has no categories recorded (can't determine conflict), OR
  //   d) none of its categories are owned by a premium geo firm
  const eligibleRaw = premiumGeoCats.size === 0 ? rawFirms : rawFirms.filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (f: any) => {
      const score = rawGeoScore(f)
      if (score === 0 && String(f.plan) === "premium") return true
      if (score === 2) return true
      const cats = rawCatSlugs(f)
      if (cats.length === 0) return true
      return !cats.some((slug) => premiumGeoCats.has(slug))
    }
  )

  const firms: SearchFirm[] = eligibleRaw
    .map((f) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const j = (Array.isArray(f.judete) ? f.judete[0] : f.judete) as any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const l = (Array.isArray(f.localitati) ? f.localitati[0] : f.localitati) as any
      return {
        id:                String(f.id),
        name:              String(f.name),
        slug:              String(f.slug),
        plan:              String(f.plan ?? ""),
        logo_url:          (f.logo_url as string | null) ?? null,
        cover_url:         (f.cover_url as string | null) ?? null,
        short_description: (f.short_description as string | null) ?? null,
        phone:             (f.phone as string | null) ?? null,
        whatsapp:          (f.whatsapp as string | null) ?? null,
        facebook_url:      (f.facebook_url as string | null) ?? null,
        instagram_url:     (f.instagram_url as string | null) ?? null,
        tiktok_url:        (f.tiktok_url as string | null) ?? null,
        website:           (f.website as string | null) ?? null,
        judet_id:          (f.judet_id as number | null) ?? null,
        localitate_id:     (f.localitate_id as number | null) ?? null,
        judet_nome:        j?.nume ?? null,
        localitate_nome:   l?.nume ?? null,
      }
    })
    .sort((a, b) => {
      const qLow = clean.toLowerCase()
      const qTokens = qLow.split(/\s+/).filter(Boolean)

      // Name relevance score:
      // 0 = name starts with full query ("Aba Funerare" for "aba")
      // 1 = name contains full query ("Casa Aba" for "aba")
      // 2 = name contains any token ("Gabi" doesn't contain "aba")
      // 3 = no name match at all (found via geo/description only)
      function nameScore(name: string): number {
        const low = name.toLowerCase()
        if (low.startsWith(qLow)) return 0
        if (low.includes(qLow)) return 1
        if (qTokens.some((t) => low.includes(t))) return 2
        return 3
      }

      const nA = nameScore(a.name)
      const nB = nameScore(b.name)
      if (nA !== nB) return nA - nB

      // Within same name relevance: plan priority
      const pa = PLAN_ORDER[a.plan] ?? 4
      const pb = PLAN_ORDER[b.plan] ?? 4
      if (pa !== pb) return pa - pb

      // Within same plan: geo priority
      const geoA = a.localitate_id != null && localitateIdSet.has(a.localitate_id) ? 0
                 : locFirmIdSet.has(a.id) ? 0
                 : a.judet_id != null && judetIdSet.has(a.judet_id) ? 1
                 : 2
      const geoB = b.localitate_id != null && localitateIdSet.has(b.localitate_id) ? 0
                 : locFirmIdSet.has(b.id) ? 0
                 : b.judet_id != null && judetIdSet.has(b.judet_id) ? 1
                 : 2
      if (geoA !== geoB) return geoA - geoB

      return a.name.localeCompare(b.name, "ro")
    })
    .slice(0, 6)

  const articles: SearchArticle[] = (articlesRes.data ?? []) as SearchArticle[]

  // ── Pages: in-memory, diacritic-insensitive ───────────────────
  const qNorm = stripDiacritics(clean).toLowerCase()
  const pages: SearchPage[] = ALL_PAGES.filter((p) => {
    const text = stripDiacritics(p.label + " " + (p.description ?? "")).toLowerCase()
    return qNorm.split(/\s+/).some((token) => token.length >= 2 && text.includes(token))
  }).slice(0, 12)

  // ── Localities: build from geo results ─────────────────────────
  const localities: SearchLocality[] = localitateRows
    .map((r) => {
      const j = Array.isArray(r.judete) ? r.judete[0] : r.judete
      return {
        id: r.id,
        nume: r.nume,
        judet_id: r.judet_id,
        judet_nume: j?.nume ?? judetMap.get(r.judet_id) ?? "",
      }
    })
    .slice(0, 10)

  return { q: clean, firms, articles, pages, localities }
}
