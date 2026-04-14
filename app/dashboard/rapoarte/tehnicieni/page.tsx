// app/dashboard/rapoarte/tehnicieni/page.tsx
// Raport programări per tehnician + perioada + export PDF foaie de teren.
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import { fetchBookingsForTechnician } from "@/lib/reports/tehnicieni"
import TehnicieniReport from "./TehnicieniReport"

type Props = {
  searchParams: Promise<{ tech?: string; from?: string; to?: string }>
}

export default async function Page({ searchParams }: Props) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect("/login?redirect=/dashboard/rapoarte/tehnicieni")
  const { role, firmId } = await getUserRole(data.user.id)
  if (role !== "firm_owner" || !firmId) {
    return (
      <div className="dash-page">
        <h1 className="dash-title">Raport tehnicieni</h1>
        <p className="dash-note">
          Doar firmele pot accesa rapoartele.{" "}
          <Link href="/dashboard/adauga-firma">Adaugă firmă →</Link>
        </p>
      </div>
    )
  }

  const sp = await searchParams
  const technicianId =
    sp.tech === "unassigned" ? null
    : sp.tech || undefined

  const admin = getServiceRoleSupabase()
  const empRes = await admin
    .from("firm_employees")
    .select("id, full_name, role")
    .eq("firm_id", firmId)
    .eq("is_active", true)
    .order("full_name")

  const bookings = await fetchBookingsForTechnician(firmId, {
    technicianId,
    dateFrom: sp.from,
    dateTo: sp.to,
  })

  return (
    <TehnicieniReport
      bookings={bookings}
      employees={(empRes.data ?? []) as unknown as { id: string; full_name: string; role: string | null }[]}
      initialFilters={{
        tech: sp.tech ?? "",
        dateFrom: sp.from ?? "",
        dateTo: sp.to ?? "",
      }}
    />
  )
}
