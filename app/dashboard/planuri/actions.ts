"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import { setPlanPrices, setSmsTariffCents, type PlanPrices } from "@/lib/settings/appSettings"

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

  if (startP == null || plusP == null || premiumP == null) {
    return { ok: false, error: "Prețurile planurilor trebuie să fie numere pozitive." }
  }
  if (tariff == null) {
    return { ok: false, error: "Tariful SMS trebuie să fie un număr pozitiv (bani/segment)." }
  }

  const prices: PlanPrices = { start: startP, plus: plusP, premium: premiumP }
  await setPlanPrices(prices, data.user.id)
  await setSmsTariffCents(tariff, data.user.id)

  revalidatePath("/dashboard/planuri")
  revalidatePath("/abonamente")
  return { ok: true }
}
