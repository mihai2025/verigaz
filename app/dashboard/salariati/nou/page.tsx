// app/dashboard/salariati/nou/page.tsx
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import EmployeeFormClient from "../EmployeeFormClient"

export default async function Page() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect("/login?redirect=/dashboard/salariati/nou")
  const { role, firmId } = await getUserRole(data.user.id)
  if (role !== "firm_owner" || !firmId) redirect("/dashboard")

  return (
    <div className="dash-page">
      <nav className="sv-breadcrumb" aria-label="Navigare">
        <Link href="/dashboard/salariati">Salariați</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">Adaugă</span>
      </nav>
      <h1 className="dash-title">Adaugă angajat</h1>
      <EmployeeFormClient mode="create" />
    </div>
  )
}
