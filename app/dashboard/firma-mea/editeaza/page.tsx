// app/dashboard/firma-mea/editeaza/page.tsx
// Editare profil firmă — câmpuri de profil public + contact.
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import EditFirmaClient from "./EditFirmaClient"

export default async function Page() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect("/login?redirect=/dashboard/firma-mea/editeaza")

  const { role, firmId } = await getUserRole(data.user.id)
  if (role !== "firm_owner" || !firmId) redirect("/dashboard")

  const admin = getServiceRoleSupabase()
  const { data: firm } = await admin
    .from("gas_firms")
    .select(
      "brand_name, legal_name, short_description, description, phone, phone_secondary, email, " +
      "website, whatsapp, facebook_url, instagram_url, " +
      "contact_person_name, contact_person_role, contact_person_phone, contact_person_email, " +
      "sediu_adresa, reminder_advance_days",
    )
    .eq("id", firmId)
    .maybeSingle()

  if (!firm) redirect("/dashboard/firma-mea")

  return (
    <div className="dash-page">
      <nav className="sv-breadcrumb" aria-label="Navigare">
        <Link href="/dashboard/firma-mea">Firma mea</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">Editează profil</span>
      </nav>
      <h1 className="dash-title">Editează profil firmă</h1>
      <p className="dash-note">
        Denumirea legală, CUI-ul și autorizația ANRE sunt gestionate de admin — contactează
        suportul dacă trebuie modificate.
      </p>
      <EditFirmaClient initial={firm as unknown as Record<string, string | null>} />
    </div>
  )
}
