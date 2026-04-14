// lib/geo/localitati-queries.ts
import { cache } from "react"
import { getPublicServerSupabase } from "@/lib/supabase/server"
import { getCountyBySlug } from "@/lib/geo/queries"
import { slugifyRO } from "@/lib/utils/slugify"

export type LocalitateLite = {
  id: number
  slug: string
  nume: string
  judet_id?: number | null
  nr_firme_funerare?: number | null
  populatie?: number | null
  tip_localitate?: string | null
}

export const getLocalitateBySlugs = cache(async (
  judetSlug: string,
  localitateSlug: string
): Promise<LocalitateLite | null> => {
  try {
    // 1) Rezolvă județul din slug
    const county = await getCountyBySlug(judetSlug)
    if (!county) {
      console.warn("[getLocalitateBySlugs] county not found for slug:", judetSlug)
      return null
    }

    // 2) Ia localitățile din județ — selectăm doar coloane care sigur există
    const supabase = getPublicServerSupabase()
    const { data, error } = await supabase
      .from("localitati")
      .select("id, nume, judet_id")
      .eq("judet_id", county.id)

    if (error) {
      console.error("[getLocalitateBySlugs] query error:", error.message)
      return null
    }

    if (!data || data.length === 0) return null

    // 3) Match pe slugifyRO(nume)
    const match = data.find((l) => slugifyRO(l.nume) === localitateSlug)
    if (!match) return null

    // 4) Încearcă un al doilea query pentru câmpurile extra (populatie, tip_localitate, nr_firme_funerare)
    //    Dacă eșuează, returnăm doar datele de bază
    let populatie: number | null = null
    let tip_localitate: string | null = null
    let nr_firme_funerare = 0

    try {
      const { data: extra } = await supabase
        .from("localitati")
        .select("nr_firme_funerare, populatie, tip_localitate")
        .eq("id", match.id)
        .maybeSingle()

      if (extra) {
        nr_firme_funerare = (extra as any).nr_firme_funerare ?? 0
        populatie = (extra as any).populatie ?? null
        tip_localitate = (extra as any).tip_localitate ?? null
      }
    } catch {
      // câmpurile extra nu sunt critice
    }

    return {
      id: match.id,
      slug: localitateSlug,
      nume: match.nume,
      judet_id: match.judet_id ?? null,
      nr_firme_funerare,
      populatie,
      tip_localitate,
    }
  } catch (e) {
    console.error("[getLocalitateBySlugs] unexpected error:", e)
    return null
  }
})
