// lib/geo/orase.ts
// Orașe T1/T2 cu pagini editoriale dedicate.
// judetId trebuie să corespundă cu id-ul din tabela "judete" din DB.

export type Oras = {
  slug: string       // URL slug ASCII
  name: string       // Nume cu diacritice
  judetSlug: string  // slug județ (slugifyRO(judet.name))
  judetName: string  // Nume județ cu diacritice
  judetId: number    // id din DB (judete.id) — verificat față de producție
  tier: "t1" | "t2"
}

export const ORASE_EDITORIALE: Oras[] = [
  // ── T1 — peste 200.000 locuitori ──────────────────────────────
  { slug: "bucuresti",      name: "București",      judetSlug: "bucuresti",      judetName: "București",      judetId: 40, tier: "t1" },
  { slug: "cluj-napoca",    name: "Cluj-Napoca",    judetSlug: "cluj",           judetName: "Cluj",           judetId: 12, tier: "t1" },
  { slug: "iasi",           name: "Iași",           judetSlug: "iasi",           judetName: "Iași",           judetId: 22, tier: "t1" },
  { slug: "timisoara",      name: "Timișoara",      judetSlug: "timis",          judetName: "Timiș",          judetId: 35, tier: "t1" },
  { slug: "constanta",      name: "Constanța",      judetSlug: "constanta",      judetName: "Constanța",      judetId: 13, tier: "t1" },
  { slug: "craiova",        name: "Craiova",        judetSlug: "dolj",           judetName: "Dolj",           judetId: 16, tier: "t1" },
  { slug: "galati",         name: "Galați",         judetSlug: "galati",         judetName: "Galați",         judetId: 17, tier: "t1" },
  { slug: "brasov",         name: "Brașov",         judetSlug: "brasov",         judetName: "Brașov",         judetId: 8,  tier: "t1" },
  // ── T2 — 100.000–200.000 locuitori ────────────────────────────
  { slug: "ploiesti",       name: "Ploiești",       judetSlug: "prahova",        judetName: "Prahova",        judetId: 29, tier: "t2" },
  { slug: "oradea",         name: "Oradea",         judetSlug: "bihor",          judetName: "Bihor",          judetId: 5,  tier: "t2" },
  { slug: "sibiu",          name: "Sibiu",          judetSlug: "sibiu",          judetName: "Sibiu",          judetId: 32, tier: "t2" },
  { slug: "bacau",          name: "Bacău",          judetSlug: "bacau",          judetName: "Bacău",          judetId: 4,  tier: "t2" },
  { slug: "pitesti",        name: "Pitești",        judetSlug: "arges",          judetName: "Argeș",          judetId: 3,  tier: "t2" },
  { slug: "arad",           name: "Arad",           judetSlug: "arad",           judetName: "Arad",           judetId: 2,  tier: "t2" },
  { slug: "baia-mare",      name: "Baia Mare",      judetSlug: "maramures",      judetName: "Maramureș",      judetId: 24, tier: "t2" },
  { slug: "buzau",          name: "Buzău",          judetSlug: "buzau",          judetName: "Buzău",          judetId: 10, tier: "t2" },
  { slug: "suceava",        name: "Suceava",        judetSlug: "suceava",        judetName: "Suceava",        judetId: 33, tier: "t2" },
  { slug: "targu-mures",    name: "Târgu Mureș",    judetSlug: "mures",          judetName: "Mureș",          judetId: 26, tier: "t2" },
  { slug: "ramnicu-valcea", name: "Râmnicu Vâlcea", judetSlug: "valcea",         judetName: "Vâlcea",         judetId: 38, tier: "t2" },
  { slug: "piatra-neamt",   name: "Piatra Neamț",   judetSlug: "neamt",          judetName: "Neamț",          judetId: 27, tier: "t2" },
  { slug: "botosani",       name: "Botoșani",       judetSlug: "botosani",       judetName: "Botoșani",       judetId: 7,  tier: "t2" },
]

export function findOrasBySlug(slug: string): Oras | undefined {
  return ORASE_EDITORIALE.find((o) => o.slug === slug)
}

export function oraseByJudet(judetSlug: string): Oras[] {
  return ORASE_EDITORIALE.filter((o) => o.judetSlug === judetSlug)
}
