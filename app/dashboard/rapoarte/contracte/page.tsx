// app/dashboard/rapoarte/contracte/page.tsx
// Raport contracte firmă: status + tarife + echipamente acoperite.
// Scadențele efective sunt pe echipamente (vezi /dashboard/rapoarte/scadente).
export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"

function custName(c: Record<string, unknown> | undefined): string {
  if (!c) return "—"
  if (c.customer_type === "individual") {
    return [c.first_name, c.last_name].filter(Boolean).join(" ") || (c.full_name as string) || "—"
  }
  return (c.company_name as string) || (c.full_name as string) || "—"
}

export default async function Page() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect("/login?redirect=/dashboard/rapoarte/contracte")
  const { role, firmId } = await getUserRole(data.user.id)
  if (role !== "firm_owner" || !firmId) {
    return (
      <div className="dash-page">
        <h1 className="dash-title">Raport contracte</h1>
        <p className="dash-note">
          Doar firmele pot accesa rapoartele.{" "}
          <Link href="/dashboard/adauga-firma">Adaugă firmă →</Link>
        </p>
      </div>
    )
  }

  const admin = getServiceRoleSupabase()
  const [contractsRes, contractEquipRes] = await Promise.all([
    admin
      .from("contracts")
      .select("id, contract_number, customer_id, property_id, start_date, monthly_fee, total_amount, status, notes")
      .eq("firm_id", firmId)
      .order("start_date", { ascending: false }),
    admin
      .from("contract_equipments")
      .select("contract_id, equipment_id"),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contracts = (contractsRes.data ?? []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contractEquip = (contractEquipRes.data ?? []) as any[]

  const equipCountByContract = new Map<string, number>()
  for (const ce of contractEquip) {
    equipCountByContract.set(ce.contract_id, (equipCountByContract.get(ce.contract_id) ?? 0) + 1)
  }

  const customerIds = [...new Set(contracts.map((c) => c.customer_id as string))]
  const { data: customersRaw } = customerIds.length
    ? await admin
        .from("customers")
        .select("id, full_name, first_name, last_name, company_name, customer_type, phone")
        .in("id", customerIds)
    : { data: [] }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customers = (customersRaw ?? []) as any[]
  const custById = new Map<string, Record<string, unknown>>()
  for (const c of customers) custById.set(c.id, c)

  const active = contracts.filter((c) => c.status === "activ")
  const suspended = contracts.filter((c) => c.status === "suspendat")
  const terminated = contracts.filter((c) => c.status === "reziliat")
  const totalMonthly = active.reduce((sum, c) => sum + Number(c.monthly_fee ?? 0), 0)
  const totalAmount = active.reduce((sum, c) => sum + Number(c.total_amount ?? 0), 0)
  const withEquipments = active.filter((c) => (equipCountByContract.get(c.id) ?? 0) > 0).length

  return (
    <div className="dash-page">
      <h1 className="dash-title">Raport contracte</h1>
      <p className="dash-subtle">
        Situația contractelor firmei. Scadențele echipamentelor se văd în{" "}
        <Link href="/dashboard/rapoarte/scadente">raportul de scadențe</Link> — un contract
        acoperă N echipamente, fiecare cu scadența lui.
      </p>

      <div className="dash-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
        <div className="dash-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#1e6b34" }}>{active.length}</div>
          <div style={{ fontSize: 13, color: "#555" }}>Contracte active</div>
        </div>
        <div className="dash-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#555" }}>{suspended.length}</div>
          <div style={{ fontSize: 13, color: "#555" }}>Suspendate</div>
        </div>
        <div className="dash-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#a01818" }}>{terminated.length}</div>
          <div style={{ fontSize: 13, color: "#555" }}>Reziliate</div>
        </div>
        <div className="dash-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#14849b" }}>{withEquipments}</div>
          <div style={{ fontSize: 13, color: "#555" }}>Cu echipamente asignate</div>
        </div>
        <div className="dash-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#14849b" }}>{totalMonthly.toFixed(2)} lei</div>
          <div style={{ fontSize: 13, color: "#555" }}>Total lunar active</div>
        </div>
        <div className="dash-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#14849b" }}>{totalAmount.toFixed(2)} lei</div>
          <div style={{ fontSize: 13, color: "#555" }}>Sumă contracte active</div>
        </div>
      </div>

      <section>
        <h2>Contracte active ({active.length})</h2>
        {active.length === 0 ? (
          <p className="dash-note">Niciun contract activ.</p>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Nr. contract</th>
                <th>Client</th>
                <th>Început</th>
                <th>Echipamente</th>
                <th>Tarif lunar</th>
                <th>Valoare totală</th>
              </tr>
            </thead>
            <tbody>
              {active.map((c) => {
                const cust = custById.get(c.customer_id as string)
                const equipCount = equipCountByContract.get(c.id) ?? 0
                return (
                  <tr key={c.id}>
                    <td><code>{c.contract_number || "—"}</code></td>
                    <td>{custName(cust)}</td>
                    <td>{c.start_date ? new Date(c.start_date).toLocaleDateString("ro-RO") : "—"}</td>
                    <td>
                      {equipCount > 0
                        ? `${equipCount} echipamente`
                        : <span style={{ color: "#888", fontStyle: "italic" }}>toate adresei</span>}
                    </td>
                    <td>{c.monthly_fee ? `${Number(c.monthly_fee).toFixed(2)} lei` : "—"}</td>
                    <td>{c.total_amount ? `${Number(c.total_amount).toFixed(2)} lei` : "—"}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
