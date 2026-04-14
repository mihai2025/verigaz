// app/dashboard/page.tsx
// Hub dashboard — redirect pe rol.
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"

export default async function DashboardHome() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect("/login?redirect=/dashboard")

  const { role, firmId } = await getUserRole(data.user.id)

  if (role === "firm_owner" && firmId) redirect("/dashboard/firma-mea")
  if (role === "user") redirect("/dashboard/cont")

  // Admin — overview minimal
  const admin = getServiceRoleSupabase()
  const [firmsPending, firmsApproved, ordersPending] = await Promise.all([
    admin.from("gas_firms").select("id", { count: "exact", head: true }).eq("verification_status", "pending"),
    admin.from("gas_firms").select("id", { count: "exact", head: true }).eq("verification_status", "approved"),
    admin.from("shop_orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ])

  return (
    <div className="dash-page">
      <h1 className="dash-title">Dashboard administrator</h1>
      <div className="dash-kpis">
        <div className="dash-kpi">
          <div className="dash-kpi__label">Firme în așteptare</div>
          <div className="dash-kpi__value">{firmsPending.count ?? 0}</div>
          <Link href="/dashboard/firme" className="dash-kpi__link">Moderează →</Link>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi__label">Firme aprobate</div>
          <div className="dash-kpi__value">{firmsApproved.count ?? 0}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi__label">Comenzi în așteptare</div>
          <div className="dash-kpi__value">{ordersPending.count ?? 0}</div>
          <Link href="/dashboard/magazin-comenzi" className="dash-kpi__link">Gestionează →</Link>
        </div>
      </div>
    </div>
  )
}
