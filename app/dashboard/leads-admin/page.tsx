// app/dashboard/leads-admin/page.tsx
// Admin — listă leads cu atribuire la firmă.
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import LeadsAdminClient from "./LeadsAdminClient"

type Props = { searchParams: Promise<{ status?: string }> }
const STATUS_TABS = ["new", "assigned", "contacted", "converted", "lost", "spam"] as const

export default async function Page({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: u } = await supabase.auth.getUser()
  if (!u.user) redirect("/login?redirect=/dashboard/leads-admin")

  const { role } = await getUserRole(u.user.id)
  if (role !== "admin") redirect("/dashboard")

  const sp = await searchParams
  const status = (STATUS_TABS as readonly string[]).includes(sp.status ?? "")
    ? (sp.status as string)
    : "new"

  const admin = getServiceRoleSupabase()
  const [leadsRes, firmsRes] = await Promise.all([
    admin
      .from("leads")
      .select(
        "id, full_name, phone, email, message, status, source, utm_source, " +
        "preferred_firm_id, assigned_firm_id, created_at, assigned_at, " +
        "judete:judet_id(nume), localitati:localitate_id(nume), " +
        "service_categories(slug, nume), " +
        "preferred_firm:gas_firms!preferred_firm_id(slug, brand_name, legal_name), " +
        "assigned_firm:gas_firms!assigned_firm_id(slug, brand_name, legal_name)",
      )
      .eq("status", status)
      .order("created_at", { ascending: false })
      .limit(200),
    admin
      .from("gas_firms")
      .select("id, brand_name, legal_name")
      .eq("verification_status", "approved")
      .eq("is_active", true)
      .order("legal_name")
      .limit(500),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leads = (leadsRes.data ?? []) as any[]
  const firms = (firmsRes.data ?? []) as unknown as Array<{ id: string; brand_name: string | null; legal_name: string }>

  return (
    <div className="dash-page">
      <h1 className="dash-title">Leads</h1>

      <nav className="dash-tabs">
        {STATUS_TABS.map((s) => (
          <Link
            key={s}
            href={`/dashboard/leads-admin?status=${s}`}
            className={`dash-tab ${status === s ? "dash-tab--active" : ""}`}
          >
            {s}
          </Link>
        ))}
      </nav>

      {leads.length === 0 ? (
        <p className="dash-note">Niciun lead cu status „{status}".</p>
      ) : (
        <LeadsAdminClient leads={leads} firms={firms} />
      )}
    </div>
  )
}
