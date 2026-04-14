// app/sitemap.ts
// Sitemap programatic pentru toate paginile SEO verigaz.
// Combinăm hub-urile, categoriile, județele × 3 familii de rute, localitățile
// cu semnal (tier T1-T3 sau firme înregistrate), firmele aprobate, produsele.
//
// Target: 5k-20k URLs, sub limita de 50k/sitemap.
// ISR cadence: revalidat la 24h (schimbările firmă/produse apar cu lag acceptabil).
import type { MetadataRoute } from "next"
import {
  staticEntries,
  categoryEntries,
  judetEntries,
  localitateEntries,
  firmEntries,
  productEntries,
  utileEntries,
} from "@/lib/seo/sitemapGenerators"

export const revalidate = 86400 // 24h

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [judet, localitate, firms, products, utile] = await Promise.all([
    judetEntries(),
    localitateEntries(2000),
    firmEntries(),
    productEntries(),
    utileEntries(),
  ])

  return [
    ...staticEntries(),
    ...categoryEntries(),
    ...utile,
    ...judet,
    ...localitate,
    ...firms,
    ...products,
  ]
}
