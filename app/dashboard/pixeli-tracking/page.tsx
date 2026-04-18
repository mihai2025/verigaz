// app/dashboard/pixeli-tracking/page.tsx
// Admin — editare ID-uri pixel tracking (GA4, Meta, Google Ads, Snapchat, Pinterest).
export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import { getTrackingSettings } from "@/lib/settings/appSettings"
import PixeliTrackingClient from "./PixeliTrackingClient"

export default async function Page() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect("/login?redirect=/dashboard/pixeli-tracking")
  const { role } = await getUserRole(data.user.id)
  if (role !== "admin") redirect("/dashboard")

  const settings = await getTrackingSettings()

  return (
    <div className="dash-page">
      <h1 className="dash-title">Pixeli & Tracking</h1>
      <p className="dash-lead">
        ID-urile de tracking injectate global în site. Scripturile pleacă doar dacă
        câmpul e completat. După salvare, face hard refresh în browser ca să re-încarci scripturile.
      </p>
      <PixeliTrackingClient initial={settings} />
    </div>
  )
}
