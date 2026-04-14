// lib/plans/plans.ts
// Single source of truth pentru cele 4 planuri Verigaz + entitlements.
// Prețurile sunt statice; Stripe price IDs vin din env (pot fi shared cu
// contul Stripe ghidulfunerar — produse noi create în dashboard Stripe).

export type PlanKey = "free" | "start" | "plus" | "premium"

export type PlanDefinition = {
  key: PlanKey
  nume: string
  tagline: string
  priceYearly: number         // lei/an (0 pentru free)
  currency: "RON"
  stripePriceIdEnv: string    // numele env var care conține price_* Stripe
  highlights: string[]        // bullet points principale
  limits: {
    maxFirmLocations: number | null        // null = unlimited
    maxServiceCategories: number | null
    maxShopProducts: number | null
    premiumExclusivity: boolean            // ascunde competitori pe localitate
    customSmsTemplates: boolean
    prioritySupport: boolean
    featuredPlacement: boolean             // badge + ranking boost
    analyticsDashboard: boolean
  }
}

export const PLANS: Record<PlanKey, PlanDefinition> = {
  free: {
    key: "free",
    nume: "Gratuit",
    tagline: "Apari în listing, primești programări, fără vizibilitate prioritară.",
    priceYearly: 0,
    currency: "RON",
    stripePriceIdEnv: "",
    highlights: [
      "Listare în directorul național",
      "Până la 2 locații operare",
      "Până la 3 categorii servicii",
      "Primire programări prin platformă",
    ],
    limits: {
      maxFirmLocations: 2,
      maxServiceCategories: 3,
      maxShopProducts: 0,
      premiumExclusivity: false,
      customSmsTemplates: false,
      prioritySupport: false,
      featuredPlacement: false,
      analyticsDashboard: false,
    },
  },
  start: {
    key: "start",
    nume: "Start",
    tagline: "Profil complet + primele rezultate de căutare pe localitățile tale.",
    priceYearly: 490,
    currency: "RON",
    stripePriceIdEnv: "STRIPE_PRICE_START_YEARLY",
    highlights: [
      "Profil complet cu galerie + descriere lungă",
      "Până la 5 locații operare",
      "Toate categoriile de servicii",
      "Logo + cover vizibile pe card",
      "Template SMS personalizat",
    ],
    limits: {
      maxFirmLocations: 5,
      maxServiceCategories: null,
      maxShopProducts: 20,
      premiumExclusivity: false,
      customSmsTemplates: true,
      prioritySupport: false,
      featuredPlacement: false,
      analyticsDashboard: true,
    },
  },
  plus: {
    key: "plus",
    nume: "Plus",
    tagline: "Featured placement + magazin nelimitat + dashboard analytics.",
    priceYearly: 890,
    currency: "RON",
    stripePriceIdEnv: "STRIPE_PRICE_PLUS_YEARLY",
    highlights: [
      "Tot ce e în Start +",
      'Badge „Recomandat" pe card',
      "Featured placement în rezultate (top 3)",
      "Magazin cu produse nelimitate",
      "Dashboard analytics complet",
    ],
    limits: {
      maxFirmLocations: 10,
      maxServiceCategories: null,
      maxShopProducts: null,
      premiumExclusivity: false,
      customSmsTemplates: true,
      prioritySupport: false,
      featuredPlacement: true,
      analyticsDashboard: true,
    },
  },
  premium: {
    key: "premium",
    nume: "Premium",
    tagline: "Exclusivitate locală — singura firmă afișată în localitatea ta.",
    priceYearly: 1490,
    currency: "RON",
    stripePriceIdEnv: "STRIPE_PRICE_PREMIUM_YEARLY",
    highlights: [
      "Tot ce e în Plus +",
      "Exclusivitate pe o localitate la alegere (nicio altă firmă în listing-ul ei)",
      "Locații operare nelimitate",
      "Support prioritar (răspuns 24h)",
      "Onboarding dedicat",
    ],
    limits: {
      maxFirmLocations: null,
      maxServiceCategories: null,
      maxShopProducts: null,
      premiumExclusivity: true,
      customSmsTemplates: true,
      prioritySupport: true,
      featuredPlacement: true,
      analyticsDashboard: true,
    },
  },
}

export const PLAN_ORDER: PlanKey[] = ["free", "start", "plus", "premium"]

export function planRank(plan: PlanKey): number {
  return PLAN_ORDER.indexOf(plan)
}

export function canUpgradeTo(current: PlanKey, target: PlanKey): boolean {
  return planRank(target) > planRank(current)
}

export function getStripePriceId(plan: PlanKey): string | null {
  const env = PLANS[plan].stripePriceIdEnv
  if (!env) return null
  return process.env[env] ?? null
}
