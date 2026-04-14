// app/dashboard/rapoarte/verificari/page.tsx
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import { fetchVerificariForFirm } from "@/lib/reports/verificari"
import { getFirmEquipmentCatalog } from "@/lib/equipment/catalog"
import VerificariReport from "./VerificariReport"

type Props = {
  searchParams: Promise<{
    q?: string
    from?: string
    to?: string
    mode?: string
    active?: string
    type?: string
  }>
}

export default async function Page({ searchParams }: Props) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect("/login?redirect=/dashboard/rapoarte/verificari")
  const { role, firmId } = await getUserRole(data.user.id)
  if (role !== "firm_owner" || !firmId) {
    return (
      <div className="dash-page">
        <h1 className="dash-title">Raport verificări</h1>
        <p className="dash-note">
          Doar firmele pot accesa rapoartele.{" "}
          <Link href="/dashboard/adauga-firma">Adaugă firmă →</Link>
        </p>
      </div>
    )
  }

  const sp = await searchParams
  const rows = await fetchVerificariForFirm(firmId, {
    search: sp.q,
    dateFrom: sp.from,
    dateTo: sp.to,
    dateMode: sp.mode === "expires" ? "expires" : "issued",
    activeOnly: sp.active === "1",
    docType: (["all", "gaz", "centrala"].includes(sp.type ?? "") ? sp.type : "all") as "all" | "gaz" | "centrala",
  })

  const admin = getServiceRoleSupabase()
  const [empRes, judeteRes, catalog] = await Promise.all([
    admin.from("firm_employees").select("id, full_name").eq("firm_id", firmId).eq("is_active", true).order("full_name"),
    admin.from("judete").select("id, nume").order("nume"),
    getFirmEquipmentCatalog(firmId),
  ])

  return (
    <VerificariReport
      rows={rows}
      initialFilters={{
        search: sp.q ?? "",
        dateFrom: sp.from ?? "",
        dateTo: sp.to ?? "",
        dateMode: sp.mode === "expires" ? "expires" : "issued",
        activeOnly: sp.active === "1",
        docType: (["all", "gaz", "centrala"].includes(sp.type ?? "") ? sp.type : "all") as "all" | "gaz" | "centrala",
      }}
      employees={(empRes.data ?? []) as { id: string; full_name: string }[]}
      judete={(judeteRes.data ?? []) as { id: number; nume: string }[]}
      catalog={catalog}
    />
  )
}
