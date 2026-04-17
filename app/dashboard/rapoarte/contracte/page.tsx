// app/dashboard/rapoarte/contracte/page.tsx
// Raport contracte firmă: active, expiră curând, expirate, reziliate.
export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"

const PERIOD_LABELS: Record<string, string> = {
  "2_ani": "Verificare 2 ani",
  "10_ani": "Revizie 10 ani",
  "anual": "Anual",
  "custom": "Personalizat",
}

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
  const { data: contractsRaw } = await admin
    .from("contracts")
    .select("id, contract_number, customer_id, period_type, start_date, expiry_date, " +
            "monthly_fee, total_amount, status")
    .eq("firm_id", firmId)
    .order("expiry_date", { ascending: true })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contracts = (contractsRaw ?? []) as any[]

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

  const now = Date.now()
  const in60Days = now + 60 * 24 * 60 * 60 * 1000

  const active = contracts.filter((c) => c.status === "activ")
  const expiringSoon = active.filter((c) => {
    const exp = new Date(c.expiry_date).getTime()
    return exp >= now && exp <= in60Days
  })
  const expired = active.filter((c) => new Date(c.expiry_date).getTime() < now)
  const terminated = contracts.filter((c) => c.status === "reziliat")

  const totalMonthly = active.reduce((sum, c) => sum + Number(c.monthly_fee ?? 0), 0)
  const totalContracts = active.reduce((sum, c) => sum + Number(c.total_amount ?? 0), 0)

  const byPeriod = new Map<string, number>()
  for (const c of active) {
    byPeriod.set(c.period_type, (byPeriod.get(c.period_type) ?? 0) + 1)
  }

  return (
    <div className="dash-page">
      <h1 className="dash-title">Raport contracte</h1>
      <p className="dash-subtle">
        Situația contractelor firmei tale. Contractele active, cele care expiră curând și cele deja expirate.
      </p>

      <div className="dash-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
        <div className="dash-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#1e6b34" }}>{active.length}</div>
          <div style={{ fontSize: 13, color: "#555" }}>Contracte active</div>
        </div>
        <div className="dash-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#a87400" }}>{expiringSoon.length}</div>
          <div style={{ fontSize: 13, color: "#555" }}>Expiră în următoarele 60 zile</div>
        </div>
        <div className="dash-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#a01818" }}>{expired.length}</div>
          <div style={{ fontSize: 13, color: "#555" }}>Deja expirate</div>
        </div>
        <div className="dash-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#555" }}>{terminated.length}</div>
          <div style={{ fontSize: 13, color: "#555" }}>Reziliate</div>
        </div>
        <div className="dash-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#14849b" }}>{totalMonthly.toFixed(2)} lei</div>
          <div style={{ fontSize: 13, color: "#555" }}>Total lunar active</div>
        </div>
        <div className="dash-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#14849b" }}>{totalContracts.toFixed(2)} lei</div>
          <div style={{ fontSize: 13, color: "#555" }}>Sumă contracte active</div>
        </div>
      </div>

      <section style={{ marginBottom: 32 }}>
        <h2>Distribuție pe tip de perioadă</h2>
        <table className="dash-table">
          <thead>
            <tr><th>Tip</th><th>Număr contracte active</th></tr>
          </thead>
          <tbody>
            {[...byPeriod.entries()].map(([type, count]) => (
              <tr key={type}>
                <td>{PERIOD_LABELS[type] ?? type}</td>
                <td>{count}</td>
              </tr>
            ))}
            {byPeriod.size === 0 && <tr><td colSpan={2}>—</td></tr>}
          </tbody>
        </table>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2>Expiră în următoarele 60 zile ({expiringSoon.length})</h2>
        {expiringSoon.length === 0 ? (
          <p className="dash-note">Niciun contract în această situație.</p>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Nr. contract</th>
                <th>Client</th>
                <th>Tip</th>
                <th>Scadență</th>
                <th>Zile rămase</th>
                <th>Tarif</th>
              </tr>
            </thead>
            <tbody>
              {expiringSoon.map((c) => {
                const cust = custById.get(c.customer_id as string)
                const days = Math.round((new Date(c.expiry_date).getTime() - now) / (1000 * 60 * 60 * 24))
                return (
                  <tr key={c.id}>
                    <td><code>{c.contract_number || "—"}</code></td>
                    <td>{custName(cust)}</td>
                    <td>{PERIOD_LABELS[c.period_type] ?? c.period_type}</td>
                    <td>{new Date(c.expiry_date).toLocaleDateString("ro-RO")}</td>
                    <td>{days} zile</td>
                    <td>{c.monthly_fee ? `${c.monthly_fee} lei/lună` : c.total_amount ? `${c.total_amount} lei` : "—"}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2>Deja expirate (status încă „activ", de revizuit)</h2>
        {expired.length === 0 ? (
          <p className="dash-note">Niciun contract expirat cu status activ.</p>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Nr. contract</th>
                <th>Client</th>
                <th>Tip</th>
                <th>Scadență</th>
                <th>Expirat de</th>
              </tr>
            </thead>
            <tbody>
              {expired.map((c) => {
                const cust = custById.get(c.customer_id as string)
                const daysLate = Math.round((now - new Date(c.expiry_date).getTime()) / (1000 * 60 * 60 * 24))
                return (
                  <tr key={c.id}>
                    <td><code>{c.contract_number || "—"}</code></td>
                    <td>{custName(cust)}</td>
                    <td>{PERIOD_LABELS[c.period_type] ?? c.period_type}</td>
                    <td>{new Date(c.expiry_date).toLocaleDateString("ro-RO")}</td>
                    <td style={{ color: "#a01818", fontWeight: 600 }}>{daysLate} zile</td>
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
