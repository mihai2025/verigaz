// lib/config/siteSettings.ts
// Config runtime-mutable (load din DB dacă e nevoie). Deocamdată valori default.

export type PlanTier = "free" | "start" | "plus" | "premium"

export const PLAN_LABELS: Record<PlanTier, string> = {
  free: "Free",
  start: "Start",
  plus: "Plus",
  premium: "Premium",
}

export const PLAN_RANK: Record<PlanTier, number> = {
  free: 0,
  start: 1,
  plus: 2,
  premium: 3,
}

export const SITE_SETTINGS = {
  defaultServiceRadiusKm: 15,
  maxFirmsPerSearch: 6,
  bookingsPublicRefPrefix: "VG",
  ordersPublicRefPrefix: "VG-ORD",
  siteLocale: "ro-RO",
  siteCurrency: "RON",
  // Intervalele scadențelor (ANRE Ord. 179/2015)
  verificareIntervalMonths: 24,
  revizieIntervalMonths: 120,
  detectorServiceIntervalMonths: 12,
  // Cu cât se trimite reminder-ul înainte de scadență
  reminderAdvanceDays: [60, 30, 7],
} as const
