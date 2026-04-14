// app/dashboard/salariati/[id]/page.tsx
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import EmployeeFormClient from "../EmployeeFormClient"

type Params = { id: string }

export default async function Page({ params }: { params: Promise<Params> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: u } = await supabase.auth.getUser()
  if (!u.user) redirect(`/login?redirect=/dashboard/salariati/${id}`)
  const { role, firmId } = await getUserRole(u.user.id)
  if (role !== "firm_owner" || !firmId) redirect("/dashboard")

  const admin = getServiceRoleSupabase()
  const { data: emp } = await admin
    .from("firm_employees")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (!emp) notFound()
  if (emp.firm_id !== firmId) redirect("/dashboard/salariati")

  return (
    <div className="dash-page">
      <nav className="sv-breadcrumb" aria-label="Navigare">
        <Link href="/dashboard/salariati">Salariați</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{emp.full_name as string}</span>
      </nav>
      <h1 className="dash-title">Editează angajat</h1>
      <EmployeeFormClient
        mode="edit"
        employeeId={id}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initial={emp as any}
      />
    </div>
  )
}
