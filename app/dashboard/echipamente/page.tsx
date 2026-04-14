// app/dashboard/echipamente/page.tsx
// Nomenclator echipamente al firmei — defaults de platformă + override + custom.
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import { getFirmEquipmentCatalog } from "@/lib/equipment/catalog"
import EchipamenteClient from "./EchipamenteClient"

export default async function Page() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect("/login?redirect=/dashboard/echipamente")

  const { role, firmId } = await getUserRole(data.user.id)
  if (role !== "firm_owner" || !firmId) {
    return (
      <div className="dash-page">
        <h1 className="dash-title">Echipamente</h1>
        <p className="dash-note">
          Doar firmele înregistrate pot gestiona nomenclatorul de echipamente.{" "}
          <Link href="/dashboard/adauga-firma">Adaugă firmă →</Link>
        </p>
      </div>
    )
  }

  const catalog = await getFirmEquipmentCatalog(firmId)

  return (
    <div className="dash-page">
      <h1 className="dash-title">Nomenclator echipamente</h1>
      <p className="dash-subtle">
        Default-urile de platformă (verificare gaz 2 ani, revizie 10 ani etc.) sunt
        moștenite automat. Poți <strong>suprascrie intervalele</strong> pentru firma ta
        sau <strong>adăuga tipuri custom</strong>.
      </p>

      <EchipamenteClient catalog={catalog} />
    </div>
  )
}
