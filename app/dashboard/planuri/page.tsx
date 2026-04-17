// app/dashboard/planuri/page.tsx
// Admin — editare prețuri planuri + tarif SMS per segment.
export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import { getPlanPrices, getSmsTariffCents, getGestiuneSettings } from "@/lib/settings/appSettings"
import { PLANS } from "@/lib/plans/plans"
import PlanuriClient from "./PlanuriClient"

export default async function PlanuriPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect("/login?redirect=/dashboard/planuri")
  const { role } = await getUserRole(data.user.id)
  if (role !== "admin") redirect("/dashboard")

  const [prices, tariff, gestiune] = await Promise.all([getPlanPrices(), getSmsTariffCents(), getGestiuneSettings()])

  return (
    <div className="dash-page">
      <h1 className="dash-title">Administrare planuri & tarife</h1>
      <p className="dash-lead">
        Editează prețul anual afișat pe <strong>/abonamente</strong> și tariful per segment SMS
        folosit în raportul de facturare.
      </p>
      <PlanuriClient
        initialPrices={prices}
        initialTariffCents={tariff}
        initialGestiune={gestiune}
        plans={{
          free: { nume: PLANS.free.nume, tagline: PLANS.free.tagline },
          start: { nume: PLANS.start.nume, tagline: PLANS.start.tagline },
          plus: { nume: PLANS.plus.nume, tagline: PLANS.plus.tagline },
          premium: { nume: PLANS.premium.nume, tagline: PLANS.premium.tagline },
        }}
      />
    </div>
  )
}
