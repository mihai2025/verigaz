// app/dashboard/rapoarte/revizii/page.tsx
// Raport revizii (cadenţă 10 ani) pentru firma curentă.
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import { fetchReviziiForFirm } from "@/lib/reports/revizii"
import ReviziiReport from "./ReviziiReport"

type Props = {
  searchParams: Promise<{
    q?: string
    from?: string
    to?: string
    mode?: string
    active?: string
  }>
}

export default async function Page({ searchParams }: Props) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect("/login?redirect=/dashboard/rapoarte/revizii")
  const { role, firmId } = await getUserRole(data.user.id)
  if (role !== "firm_owner" || !firmId) {
    return (
      <div className="dash-page">
        <h1 className="dash-title">Raport revizii</h1>
        <p className="dash-note">
          Doar firmele pot accesa rapoartele.{" "}
          <Link href="/dashboard/adauga-firma">Adaugă firmă →</Link>
        </p>
      </div>
    )
  }

  const sp = await searchParams
  const rows = await fetchReviziiForFirm(firmId, {
    search: sp.q,
    dateFrom: sp.from,
    dateTo: sp.to,
    dateMode: sp.mode === "expires" ? "expires" : "issued",
    activeOnly: sp.active === "1",
  })

  const admin = getServiceRoleSupabase()
  const [empRes, judeteRes] = await Promise.all([
    admin
      .from("firm_employees")
      .select("id, full_name")
      .eq("firm_id", firmId)
      .eq("is_active", true)
      .order("full_name"),
    admin.from("judete").select("id, nume").order("nume"),
  ])

  return (
    <ReviziiReport
      rows={rows}
      initialFilters={{
        search: sp.q ?? "",
        dateFrom: sp.from ?? "",
        dateTo: sp.to ?? "",
        dateMode: sp.mode === "expires" ? "expires" : "issued",
        activeOnly: sp.active === "1",
      }}
      employees={(empRes.data ?? []) as { id: string; full_name: string }[]}
      judete={(judeteRes.data ?? []) as { id: number; nume: string }[]}
    />
  )
}
