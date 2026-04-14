// lib/servicii-gaze/links.ts
// Static registry of public pages used by searchAll + site navigation.
// Mirroring pattern from ghidulfunerar/lib/servicii-funerare/links.ts but
// trimmed for the gas domain — we only expose canonical landing pages
// plus FAQ/resource stubs. Add entries here when new public pages ship.

export type SgLink = {
  slug: string
  href: string
  label: string
  description?: string
  tag?: "hub" | "categorie" | "faq" | "resursa" | "calculator"
}

// ── Hub principal ──────────────────────────────────────────────
export const HUB: SgLink = {
  slug: "servicii-gaze",
  href: "/servicii-gaze",
  label: "Servicii gaze în România",
  description: "Firme autorizate ANRE pentru verificări, revizii, montaj detectoare, reparații.",
  tag: "hub",
}

// ── Categorii de servicii (canonical landing pentru fiecare) ───
export const CATEGORY_PAGES: SgLink[] = [
  {
    slug: "verificare-instalatie",
    href: "/servicii/verificare-instalatie",
    label: "Verificare instalație gaze",
    description: "Obligatorie la maxim 2 ani conform ANRE Ord. 179/2015.",
    tag: "categorie",
  },
  {
    slug: "revizie-instalatie",
    href: "/servicii/revizie-instalatie",
    label: "Revizie instalație gaze",
    description: "Obligatorie la maxim 10 ani conform ANRE Ord. 179/2015.",
    tag: "categorie",
  },
  {
    slug: "montaj-detector",
    href: "/servicii/montaj-detector",
    label: "Montaj detector gaze",
    description: "Detector automat cu electrovalvă pentru apartament sau casă.",
    tag: "categorie",
  },
  {
    slug: "service-detector",
    href: "/servicii/service-detector",
    label: "Service detector gaze",
    description: "Calibrare și verificare anuală a detectorului.",
    tag: "categorie",
  },
  {
    slug: "reparatii-instalatie",
    href: "/servicii/reparatii-instalatie",
    label: "Reparații instalație gaze",
    description: "Remedieri după opriri, scurgeri sau defecțiuni.",
    tag: "categorie",
  },
  {
    slug: "verificare-centrala",
    href: "/verificari-centrala",
    label: "Verificare centrală termică (VTP)",
    description: "Verificare tehnică periodică ISCIR.",
    tag: "categorie",
  },
  {
    slug: "revizie-centrala",
    href: "/revizii-centrala",
    label: "Revizie centrală termică",
    description: "Revizie completă a centralei, conform manual producător.",
    tag: "categorie",
  },
]

// ── FAQ / conținut informativ (de populat când se scrie copy-ul) ─
export const FAQ_PAGES: SgLink[] = []

// ── Resurse / calculatoare ─────────────────────────────────────
export const RESOURCE_PAGES: SgLink[] = []

export const ALL_SG_PAGES: SgLink[] = [HUB, ...CATEGORY_PAGES, ...FAQ_PAGES, ...RESOURCE_PAGES]
