"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import { setPlanPrices, setSmsTariffCents, setGestiuneSettings, type PlanPrices } from "@/lib/settings/appSettings"

type Result = { ok: true } | { ok: false; error: string }

export async function saveSettings(formData: FormData): Promise<Result> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return { ok: false, error: "Neautentificat." }
  const { role } = await getUserRole(data.user.id)
  if (role !== "admin") return { ok: false, error: "Doar adminii pot modifica setările." }

  const parsePrice = (name: string) => {
    const raw = String(formData.get(name) ?? "").trim()
    const n = Number(raw)
    if (!Number.isFinite(n) || n < 0) return null
    return Math.round(n)
  }

  const startP = parsePrice("price_start")
  const plusP = parsePrice("price_plus")
  const premiumP = parsePrice("price_premium")
  const tariff = parsePrice("sms_tariff_cents")
  const gestFee = parsePrice("gestiune_monthly_fee")
  const gestAnnual = parsePrice("gestiune_annual_fee")
  const gestSms = parsePrice("gestiune_sms_included")

  if (startP == null || plusP == null || premiumP == null) {
    return { ok: false, error: "Prețurile planurilor trebuie să fie numere pozitive." }
  }
  if (tariff == null) {
    return { ok: false, error: "Tariful SMS trebuie să fie un număr pozitiv (bani/segment)." }
  }
  if (gestFee == null || gestAnnual == null || gestSms == null) {
    return { ok: false, error: "Fee-ul lunar, anual și nr. SMS incluse trebuie completate." }
  }

  const prices: PlanPrices = { start: startP, plus: plusP, premium: premiumP }
  await Promise.all([
    setPlanPrices(prices, data.user.id),
    setSmsTariffCents(tariff, data.user.id),
    setGestiuneSettings({ monthlyFee: gestFee, annualFee: gestAnnual, smsIncluded: gestSms }, data.user.id),
  ])

  revalidatePath("/dashboard/planuri")
  revalidatePath("/abonamente")
  revalidatePath("/platforma")
  revalidatePath("/")
  return { ok: true }
}
