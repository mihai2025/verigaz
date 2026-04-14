// app/dashboard/adauga-firma/page.tsx
// Onboarding firmă — creează rândul în gas_firms cu status="pending" și leagă
// owner_user_id la userul curent. Admin aprobă ulterior.
import { redirect } from "next/navigation"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import AdaugaFirmaClient from "./AdaugaFirmaClient"

export default async function Page() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect("/login?redirect=/dashboard/adauga-firma")

  const { role, firmId } = await getUserRole(data.user.id)
  if (role === "firm_owner" && firmId) redirect("/dashboard/firma-mea")

  const admin = getServiceRoleSupabase()
  const { data: judete } = await admin
    .from("judete")
    .select("id, nume")
    .order("nume")

  return (
    <div className="dash-page">
      <h1 className="dash-title">Adaugă firmă</h1>
      <p className="dash-lead">
        Completează datele firmei pentru a apărea în directorul verigaz.
        După trimitere, echipa noastră validează autorizația ANRE (în 1–2 zile).
      </p>
      <AdaugaFirmaClient judete={(judete ?? []) as { id: number; nume: string }[]} />
    </div>
  )
}
