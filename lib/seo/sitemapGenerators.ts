// lib/seo/sitemapGenerators.ts
// Generatoare reutilizabile pentru sitemap-urile segmentate.
// Fiecare fn() returnează o listă de entry-uri pentru un slice al sitemap-ului.
import { getPublicServerSupabase } from "@/lib/supabase/server"
import { slugifyRO } from "@/lib/utils/slugify"
import { DOMAIN } from "@/lib/config/domain"
import { CATEGORY_PAGES } from "@/lib/servicii-gaze/links"

export type SitemapEntry = {
  url: string
  lastModified: Date
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never"
  priority?: number
}

const BASE = DOMAIN.baseUrl.replace(/\/+$/, "")

/**
 * Pagini statice + hub-uri. Setăm prioritate maximă pe home + hub-uri.
 */
export function staticEntries(): SitemapEntry[] {
  const now = new Date()
  return [
    { url: `${BASE}/`,                   lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/servicii-gaze`,      lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${BASE}/servicii`,           lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/verificari-centrala`,lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/revizii-centrala`,   lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/magazin`,            lastModified: now, changeFrequency: "daily",   priority: 0.8 },
    { url: `${BASE}/utile`,              lastModified: now, changeFrequency: "weekly",  priority: 0.85 },
    { url: `${BASE}/abonamente`,         lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/cauta`,              lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/despre`,             lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/cum-functioneaza`,   lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/pentru-firme`,       lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/contact`,            lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/termeni`,            lastModified: now, changeFrequency: "yearly",  priority: 0.2 },
    { url: `${BASE}/confidentialitate`,  lastModified: now, changeFrequency: "yearly",  priority: 0.2 },
    { url: `${BASE}/cookies`,            lastModified: now, changeFrequency: "yearly",  priority: 0.2 },
  ]
}

/**
 * Cele 20 ghiduri SEO din /utile/[slug].
 */
export async function utileEntries(): Promise<SitemapEntry[]> {
  const { ARTICLES } = await import("@/lib/utile/articles")
  return ARTICLES.map((a) => ({
    url: `${BASE}/utile/${a.slug}`,
    lastModified: new Date(a.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }))
}

/**
 * Landing pe categorie (7 intrări — fiecare 1x /servicii/{cat}).
 */
export function categoryEntries(): SitemapEntry[] {
  const now = new Date()
  return CATEGORY_PAGES.map((c) => ({
    url: `${BASE}/servicii/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))
}

/**
 * Toate județele × 3 familii de rute (3 × 42 = 126) + servicii/{cat}/{judet}
 * (7 × 42 = 294). Total: ~420 entries.
 */
export async function judetEntries(): Promise<SitemapEntry[]> {
  const supabase = getPublicServerSupabase()
  const { data } = await supabase.from("judete").select("nume").order("nume")
  const judete = (data ?? []) as { nume: string }[]

  const now = new Date()
  const entries: SitemapEntry[] = []
  for (const j of judete) {
    const slug = slugifyRO(j.nume)
    entries.push(
      { url: `${BASE}/servicii-gaze/${slug}`,       lastModified: now, changeFrequency: "weekly", priority: 0.75 },
      { url: `${BASE}/verificari-centrala/${slug}`, lastModified: now, changeFrequency: "weekly", priority: 0.65 },
      { url: `${BASE}/revizii-centrala/${slug}`,    lastModified: now, changeFrequency: "weekly", priority: 0.65 },
    )
    for (const cat of CATEGORY_PAGES) {
      entries.push({
        url: `${BASE}/servicii/${cat.slug}/${slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })
    }
  }
  return entries
}

/**
 * Localități cu semnal comercial: tier T1/T2/T3 (populatie > ~20k) sau orice
 * localitate care are firme înregistrate (nr_firme > 0).
 * Estimare: ~500 T1-T3 + extras cu firme → 500-1500 localități.
 *
 * Pentru fiecare localitate emit:
 *   - /servicii-gaze/{judet}/{localitate}
 *   - /verificari-centrala/{judet}/{localitate}
 *   - /revizii-centrala/{judet}/{localitate}
 *   - /servicii/{cat}/{judet}/{localitate} pentru fiecare din 7 categorii
 *
 * Cu 1000 localități × 10 = 10000 entries — încă sub limita de 50k/sitemap.
 */
export async function localitateEntries(maxLocalitati = 2000): Promise<SitemapEntry[]> {
  const supabase = getPublicServerSupabase()
  const { data } = await supabase
    .from("localitati")
    .select("slug, nume, nr_firme, tier, judete(nume)")
    .or("tier.in.(T1,T2,T3),nr_firme.gt.0")
    .order("nr_firme", { ascending: false })
    .order("tier", { ascending: true })
    .limit(maxLocalitati)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[]
  const now = new Date()
  const entries: SitemapEntry[] = []

  for (const l of rows) {
    const judetNume = Array.isArray(l.judete) ? l.judete[0]?.nume : l.judete?.nume
    if (!judetNume) continue
    const judetSlug = slugifyRO(judetNume)
    const citySlug = l.slug as string
    const hasFirms = (l.nr_firme ?? 0) > 0
    const tier = l.tier as string | null

    // Priority: mai mare pentru localități cu firme și tier înalt
    const basePriority = hasFirms ? 0.65 : tier === "T1" ? 0.55 : tier === "T2" ? 0.5 : 0.45

    entries.push(
      {
        url: `${BASE}/servicii-gaze/${judetSlug}/${citySlug}`,
        lastModified: now,
        changeFrequency: hasFirms ? "weekly" : "monthly",
        priority: basePriority,
      },
      {
        url: `${BASE}/verificari-centrala/${judetSlug}/${citySlug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: basePriority - 0.1,
      },
      {
        url: `${BASE}/revizii-centrala/${judetSlug}/${citySlug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: basePriority - 0.1,
      },
    )
    for (const cat of CATEGORY_PAGES) {
      entries.push({
        url: `${BASE}/servicii/${cat.slug}/${judetSlug}/${citySlug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: basePriority - 0.15,
      })
    }
  }
  return entries
}

/**
 * Firme aprobate + active. O entry / firmă la /firme/{slug}.
 */
export async function firmEntries(): Promise<SitemapEntry[]> {
  const supabase = getPublicServerSupabase()
  const { data } = await supabase
    .from("gas_firms")
    .select("slug, updated_at")
    .eq("is_active", true)
    .eq("verification_status", "approved")
    .limit(10000)

  return (data ?? []).map((f) => ({
    url: `${BASE}/firme/${f.slug as string}`,
    lastModified: f.updated_at ? new Date(f.updated_at as string) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }))
}

/**
 * Produse magazin active.
 */
export async function productEntries(): Promise<SitemapEntry[]> {
  const supabase = getPublicServerSupabase()
  const { data } = await supabase
    .from("shop_products")
    .select("slug, updated_at")
    .eq("is_active", true)
    .limit(10000)

  return (data ?? []).map((p) => ({
    url: `${BASE}/magazin/${p.slug as string}`,
    lastModified: p.updated_at ? new Date(p.updated_at as string) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.55,
  }))
}
