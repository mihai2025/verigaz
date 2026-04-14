// lib/firms/fetchByGeo.ts
//
// Fetch firme autorizate ANRE pentru pagini de listing.
// Folosit de:
//   /servicii-gaze/{judet}/[localitate]
//   /servicii/{cat}/[judet]/[localitate]
//   /verificari-centrala/[judet]/[localitate]
//   /revizii-centrala/[judet]/[localitate]
//
// Include firme care:
//   - au sediul în geo target, SAU
//   - operează în geo target prin firm_locations,
//   - sunt verification_status='approved' + is_active=true,
//   - (opțional) oferă categoria dată în firm_services.
import { getPublicServerSupabase } from "@/lib/supabase/server"

export type FirmListRow = {
  id: string
  slug: string
  brand_name: string | null
  legal_name: string
  plan: string
  short_description: string | null
  logo_url: string | null
  cover_url: string | null
  phone: string | null
  whatsapp: string | null
  facebook_url: string | null
  instagram_url: string | null
  website: string | null
  sediu_judet_id: number | null
  sediu_localitate_id: number | null
  anre_authorization_no: string | null
}

export type GeoTarget = {
  judetId: number
  localitateId?: number  // omis pentru listing la nivel de județ
}

export type FetchFirmsOptions = {
  categorySlug?: string  // filtrează doar firmele care oferă această categorie
  limit?: number
}

const PLAN_ORDER: Record<string, number> = { premium: 1, plus: 2, start: 3, free: 4 }

export async function fetchFirmsByGeo(
  target: GeoTarget,
  opts: FetchFirmsOptions = {},
): Promise<FirmListRow[]> {
  const { judetId, localitateId } = target
  const { categorySlug, limit = 100 } = opts
  const supabase = getPublicServerSupabase()

  // 1) firm_locations — firme care operează în aria geo
  const locOrParts: string[] = [`judet_id.eq.${judetId}`]
  if (localitateId != null) locOrParts.unshift(`localitate_id.eq.${localitateId}`)

  const { data: fl } = await supabase
    .from("firm_locations")
    .select("firm_id")
    .or(locOrParts.join(","))
    .limit(500)
  const locFirmIds = [...new Set((fl ?? []).map((r: { firm_id: string }) => r.firm_id))]

  // 2) firme cu sediul în geo
  const orParts: string[] = [`sediu_judet_id.eq.${judetId}`]
  if (localitateId != null) orParts.unshift(`sediu_localitate_id.eq.${localitateId}`)
  if (locFirmIds.length) orParts.push(`id.in.(${locFirmIds.join(",")})`)

  let query = supabase
    .from("gas_firms")
    .select(
      "id, slug, brand_name, legal_name, plan, short_description, logo_url, cover_url, " +
      "phone, whatsapp, facebook_url, instagram_url, website, " +
      "sediu_judet_id, sediu_localitate_id, anre_authorization_no, " +
      "firm_services(service_categories(slug))",
      { count: "exact" },
    )
    .eq("is_active", true)
    .eq("verification_status", "approved")
    .or(orParts.join(","))
    .limit(limit)

  const { data, error } = await query
  if (error) {
    console.error("[fetchFirmsByGeo]", error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rows = (data ?? []) as any[]

  // Filtru in-memory pe categorie (PostgREST nu permite join + filter compact)
  if (categorySlug) {
    rows = rows.filter((f) => {
      const fs = Array.isArray(f.firm_services) ? f.firm_services : []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return fs.some((c: any) => {
        const sc = Array.isArray(c.service_categories) ? c.service_categories[0] : c.service_categories
        return sc?.slug === categorySlug
      })
    })
  }

  // Sort: localitate match > județ match > plan > alphabetic
  rows.sort((a, b) => {
    const aLoc = localitateId != null && a.sediu_localitate_id === localitateId ? 0 : 1
    const bLoc = localitateId != null && b.sediu_localitate_id === localitateId ? 0 : 1
    if (aLoc !== bLoc) return aLoc - bLoc
    const pa = PLAN_ORDER[a.plan] ?? 5
    const pb = PLAN_ORDER[b.plan] ?? 5
    if (pa !== pb) return pa - pb
    const nameA = a.brand_name ?? a.legal_name ?? ""
    const nameB = b.brand_name ?? b.legal_name ?? ""
    return nameA.localeCompare(nameB, "ro")
  })

  return rows.map((f) => ({
    id:                   String(f.id),
    slug:                 String(f.slug),
    brand_name:           (f.brand_name as string | null) ?? null,
    legal_name:           String(f.legal_name),
    plan:                 String(f.plan ?? "free"),
    short_description:    (f.short_description as string | null) ?? null,
    logo_url:             (f.logo_url as string | null) ?? null,
    cover_url:            (f.cover_url as string | null) ?? null,
    phone:                (f.phone as string | null) ?? null,
    whatsapp:             (f.whatsapp as string | null) ?? null,
    facebook_url:         (f.facebook_url as string | null) ?? null,
    instagram_url:        (f.instagram_url as string | null) ?? null,
    website:              (f.website as string | null) ?? null,
    sediu_judet_id:       (f.sediu_judet_id as number | null) ?? null,
    sediu_localitate_id:  (f.sediu_localitate_id as number | null) ?? null,
    anre_authorization_no: (f.anre_authorization_no as string | null) ?? null,
  }))
}

// ── Geo resolvers reutilizate de paginile de listing ──
export async function resolveJudet(judetSlug: string) {
  const supabase = getPublicServerSupabase()
  const { data } = await supabase
    .from("judete")
    .select("id, nume, slug")
    .eq("slug", judetSlug)
    .maybeSingle()
  return data as { id: number; nume: string; slug: string } | null
}

export async function resolveJudetLocalitate(judetSlug: string, localitateSlug: string) {
  const judet = await resolveJudet(judetSlug)
  if (!judet) return null

  const supabase = getPublicServerSupabase()
  const { data } = await supabase
    .from("localitati")
    .select("id, nume, slug, judet_id")
    .eq("judet_id", judet.id)
    .eq("slug", localitateSlug)
    .maybeSingle()
  if (!data) return null

  return {
    judet,
    localitate: data as { id: number; nume: string; slug: string; judet_id: number },
  }
}

export async function resolveCategory(slug: string) {
  const supabase = getPublicServerSupabase()
  const { data } = await supabase
    .from("service_categories")
    .select("id, slug, nume, descriere")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle()
  return data as { id: number; slug: string; nume: string; descriere: string | null } | null
}
