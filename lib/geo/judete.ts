// lib/geo/judete.ts
// Static county data for SSG pages. Slugs match slugifyRO(name).

export type Judet = {
  slug: string
  name: string
}

export const JUDETE: Judet[] = [
  { slug: "alba", name: "Alba" },
  { slug: "arad", name: "Arad" },
  { slug: "arges", name: "Argeș" },
  { slug: "bacau", name: "Bacău" },
  { slug: "bihor", name: "Bihor" },
  { slug: "bistrita-nasaud", name: "Bistrița-Năsăud" },
  { slug: "botosani", name: "Botoșani" },
  { slug: "brasov", name: "Brașov" },
  { slug: "braila", name: "Brăila" },
  { slug: "bucuresti", name: "București" },
  { slug: "buzau", name: "Buzău" },
  { slug: "caras-severin", name: "Caraș-Severin" },
  { slug: "calarasi", name: "Călărași" },
  { slug: "cluj", name: "Cluj" },
  { slug: "constanta", name: "Constanța" },
  { slug: "covasna", name: "Covasna" },
  { slug: "dambovita", name: "Dâmbovița" },
  { slug: "dolj", name: "Dolj" },
  { slug: "galati", name: "Galați" },
  { slug: "giurgiu", name: "Giurgiu" },
  { slug: "gorj", name: "Gorj" },
  { slug: "harghita", name: "Harghita" },
  { slug: "hunedoara", name: "Hunedoara" },
  { slug: "ialomita", name: "Ialomița" },
  { slug: "iasi", name: "Iași" },
  { slug: "ilfov", name: "Ilfov" },
  { slug: "maramures", name: "Maramureș" },
  { slug: "mehedinti", name: "Mehedinți" },
  { slug: "mures", name: "Mureș" },
  { slug: "neamt", name: "Neamț" },
  { slug: "olt", name: "Olt" },
  { slug: "prahova", name: "Prahova" },
  { slug: "satu-mare", name: "Satu Mare" },
  { slug: "salaj", name: "Sălaj" },
  { slug: "sibiu", name: "Sibiu" },
  { slug: "suceava", name: "Suceava" },
  { slug: "teleorman", name: "Teleorman" },
  { slug: "timis", name: "Timiș" },
  { slug: "tulcea", name: "Tulcea" },
  { slug: "vaslui", name: "Vaslui" },
  { slug: "valcea", name: "Vâlcea" },
  { slug: "vrancea", name: "Vrancea" },
]

export function findJudetBySlug(slug: string): Judet | undefined {
  return JUDETE.find((j) => j.slug === slug)
}
