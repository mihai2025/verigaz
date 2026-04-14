// lib/geo/helpers.ts
import { cache } from "react"
import { getAllCounties, getLocalitiesByCounty } from "./queries"
import { slugifyRO } from "@/lib/utils/slugify"

/** Get county slug by its numeric id (e.g. 12 → "cluj") */
export const getCountySlugById = cache(async (id: number): Promise<string | null> => {
  const counties = await getAllCounties()
  const county = counties.find((c) => c.id === id)
  return county ? slugifyRO(county.nume) : null
})

/** Get locality slug by its numeric id and judet_id (e.g. "cluj-napoca--cluj") */
export const getLocalitySlugById = cache(async (localityId: number, judetId: number): Promise<string | null> => {
  const counties = await getAllCounties()
  const county = counties.find((c) => c.id === judetId)
  const countySlug = county ? slugifyRO(county.nume) : String(judetId)
  const localities = await getLocalitiesByCounty(judetId)
  const loc = localities.find((l) => l.id === localityId)
  return loc ? `${slugifyRO(loc.nume)}--${countySlug}` : null
})
