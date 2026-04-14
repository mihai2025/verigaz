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

// NOTE: judetId corespunde cu id-ul din tabela `judete` seeded din
// `supabase/seeds/0001_geo_seed.sql` (snapshot ghidulfunerar).
export const ORASE_EDITORIALE: Oras[] = [
  // ── T1 — peste 200.000 locuitori ──────────────────────────────
  { slug: "bucuresti",      name: "București",      judetSlug: "bucuresti",      judetName: "București",      judetId: 42, tier: "t1" },
  { slug: "cluj-napoca",    name: "Cluj-Napoca",    judetSlug: "cluj",           judetName: "Cluj",           judetId: 22, tier: "t1" },
  { slug: "iasi",           name: "Iași",           judetSlug: "iasi",           judetName: "Iași",           judetId: 34, tier: "t1" },
  { slug: "timisoara",      name: "Timișoara",      judetSlug: "timis",          judetName: "Timiș",          judetId: 40, tier: "t1" },
  { slug: "constanta",      name: "Constanța",      judetSlug: "constanta",      judetName: "Constanța",      judetId: 25, tier: "t1" },
  { slug: "craiova",        name: "Craiova",        judetSlug: "dolj",           judetName: "Dolj",           judetId: 6,  tier: "t1" },
  { slug: "galati",         name: "Galați",         judetSlug: "galati",         judetName: "Galați",         judetId: 41, tier: "t1" },
  { slug: "brasov",         name: "Brașov",         judetSlug: "brasov",         judetName: "Brașov",         judetId: 36, tier: "t1" },
  // ── T2 — 100.000–200.000 locuitori ────────────────────────────
  { slug: "ploiesti",       name: "Ploiești",       judetSlug: "prahova",        judetName: "Prahova",        judetId: 9,  tier: "t2" },
  { slug: "oradea",         name: "Oradea",         judetSlug: "bihor",          judetName: "Bihor",          judetId: 8,  tier: "t2" },
  { slug: "sibiu",          name: "Sibiu",          judetSlug: "sibiu",          judetName: "Sibiu",          judetId: 17, tier: "t2" },
  { slug: "bacau",          name: "Bacău",          judetSlug: "bacau",          judetName: "Bacău",          judetId: 19, tier: "t2" },
  { slug: "pitesti",        name: "Pitești",        judetSlug: "arges",          judetName: "Argeș",          judetId: 21, tier: "t2" },
  { slug: "arad",           name: "Arad",           judetSlug: "arad",           judetName: "Arad",           judetId: 20, tier: "t2" },
  { slug: "baia-mare",      name: "Baia Mare",      judetSlug: "maramures",      judetName: "Maramureș",      judetId: 35, tier: "t2" },
  { slug: "buzau",          name: "Buzău",          judetSlug: "buzau",          judetName: "Buzău",          judetId: 16, tier: "t2" },
  { slug: "suceava",        name: "Suceava",        judetSlug: "suceava",        judetName: "Suceava",        judetId: 11, tier: "t2" },
  { slug: "targu-mures",    name: "Târgu Mureș",    judetSlug: "mures",          judetName: "Mureș",          judetId: 13, tier: "t2" },
  { slug: "ramnicu-valcea", name: "Râmnicu Vâlcea", judetSlug: "valcea",         judetName: "Vâlcea",         judetId: 24, tier: "t2" },
  { slug: "piatra-neamt",   name: "Piatra Neamț",   judetSlug: "neamt",          judetName: "Neamț",          judetId: 23, tier: "t2" },
  { slug: "botosani",       name: "Botoșani",       judetSlug: "botosani",       judetName: "Botoșani",       judetId: 15, tier: "t2" },
]

export function findOrasBySlug(slug: string): Oras | undefined {
  return ORASE_EDITORIALE.find((o) => o.slug === slug)
}

export function oraseByJudet(judetSlug: string): Oras[] {
  return ORASE_EDITORIALE.filter((o) => o.judetSlug === judetSlug)
}
