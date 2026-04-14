// app/dashboard/utilizatori/nou/page.tsx
// Admin — creare utilizator nou + opțional asignare la o firmă existentă.
export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import NewUserClient from "./NewUserClient"

export default async function NewUserPage() {
  const supabase = await createClient()
  const { data: u } = await supabase.auth.getUser()
  if (!u.user) redirect("/login?redirect=/dashboard/utilizatori/nou")
  const { role } = await getUserRole(u.user.id)
  if (role !== "admin") redirect("/dashboard")

  const admin = getServiceRoleSupabase()
  const { data: firms } = await admin
    .from("gas_firms")
    .select("id, brand_name, legal_name, owner_user_id")
    .order("legal_name")
    .limit(2000)

  const firmList = ((firms ?? []) as Array<{
    id: string
    brand_name: string | null
    legal_name: string
    owner_user_id: string | null
  }>).map((f) => ({
    id: f.id,
    name: f.brand_name || f.legal_name,
    hasOwner: !!f.owner_user_id,
  }))

  return (
    <div className="dash-page">
      <nav className="sv-breadcrumb" aria-label="Navigare">
        <Link href="/dashboard/utilizatori">Utilizatori</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">Creează</span>
      </nav>
      <h1 className="dash-title">Creează utilizator</h1>
      <p className="dash-lead">
        Userul va primi acces imediat (dacă activezi „Confirmare automată email").
        Îl poți atribui direct la o firmă existentă.
      </p>
      <NewUserClient firms={firmList} />
    </div>
  )
}
