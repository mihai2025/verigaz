// lib/settings/appSettings.ts
// Citire/scriere setări globale admin (tarif SMS, prețuri planuri etc.)
import { getServiceRoleSupabase } from "@/lib/supabase/server"
import { PLANS, type PlanKey } from "@/lib/plans/plans"

export type PlanPrices = { start: number; plus: number; premium: number }

const DEFAULT_SMS_TARIFF_CENTS = 15

export async function getSmsTariffCents(): Promise<number> {
  const admin = getServiceRoleSupabase()
  const { data } = await admin
    .from("app_settings")
    .select("value")
    .eq("key", "sms_tariff_cents_per_segment")
    .maybeSingle()
  const v = (data as { value?: unknown } | null)?.value
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_SMS_TARIFF_CENTS
}

export async function setSmsTariffCents(cents: number, userId: string | null): Promise<void> {
  const admin = getServiceRoleSupabase()
  await admin
    .from("app_settings")
    .upsert({
      key: "sms_tariff_cents_per_segment",
      value: cents,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    })
}

export async function getPlanPrices(): Promise<PlanPrices> {
  const admin = getServiceRoleSupabase()
  const { data } = await admin
    .from("app_settings")
    .select("value")
    .eq("key", "plan_prices")
    .maybeSingle()
  const v = (data as { value?: Record<string, number> } | null)?.value ?? {}
  return {
    start: Number.isFinite(v.start) ? Number(v.start) : PLANS.start.priceYearly,
    plus: Number.isFinite(v.plus) ? Number(v.plus) : PLANS.plus.priceYearly,
    premium: Number.isFinite(v.premium) ? Number(v.premium) : PLANS.premium.priceYearly,
  }
}

export async function setPlanPrices(prices: PlanPrices, userId: string | null): Promise<void> {
  const admin = getServiceRoleSupabase()
  await admin
    .from("app_settings")
    .upsert({
      key: "plan_prices",
      value: prices,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    })
}

export function getPlanPriceFromMap(prices: PlanPrices, key: PlanKey): number {
  if (key === "free") return 0
  return prices[key] ?? PLANS[key].priceYearly
}
