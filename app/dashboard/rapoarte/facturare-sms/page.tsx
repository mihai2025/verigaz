// app/dashboard/rapoarte/facturare-sms/page.tsx
// Admin — raport lunar facturare SMS per firmă.
// Coloane: firmă, plan, nr. clienți, nr. locații, nr. echipamente, SMS, segmente, cost.
export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import { getSmsTariffCents } from "@/lib/settings/appSettings"

type SP = { month?: string }

function monthRange(ym: string): { from: string; to: string; label: string } {
  const [yStr, mStr] = ym.split("-")
  const y = Number(yStr)
  const m = Number(mStr)
  const from = new Date(Date.UTC(y, m - 1, 1))
  const to = new Date(Date.UTC(y, m, 1))
  const label = from.toLocaleDateString("ro-RO", { month: "long", year: "numeric" })
  return { from: from.toISOString(), to: to.toISOString(), label }
}

function currentMonthStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export default async function FacturareSmsPage({
  searchParams,
}: {
  searchParams: Promise<SP>
}) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect("/login?redirect=/dashboard/rapoarte/facturare-sms")
  const { role } = await getUserRole(auth.user.id)
  if (role !== "admin") redirect("/dashboard")

  const ym = /^\d{4}-\d{2}$/.test(sp.month ?? "") ? (sp.month as string) : currentMonthStr()
  const { from, to, label } = monthRange(ym)
  const tariffCents = await getSmsTariffCents()

  const admin = getServiceRoleSupabase()

  const firmsRes = await admin
    .from("gas_firms")
    .select("id, legal_name, brand_name, plan, is_active, verification_status")
    .order("legal_name")
  const firms = (firmsRes.data as Array<{
    id: string
    legal_name: string
    brand_name: string | null
    plan: string | null
    is_active: boolean
    verification_status: string | null
  }> | null) ?? []

  const firmIds = firms.map((f) => f.id)

  const [customersRes, propsRes, eqRes, smsRes] = await Promise.all([
    // clienți per firmă (dacă există firm_id pe customers) — altfel 0
    // customers nu are firm_id direct; clienți vin prin bookings.firm_id
    admin.from("bookings").select("firm_id, customer_id"),
    admin.from("properties").select("id, customer_id"),
    admin.from("property_equipments").select("id, property_id").eq("is_active", true),
    admin
      .from("sms_logs")
      .select("firm_id, segments, status")
      .gte("created_at", from)
      .lt("created_at", to),
  ])

  const bookings = (customersRes.data as Array<{ firm_id: string | null; customer_id: string | null }> | null) ?? []
  const properties = (propsRes.data as Array<{ id: string; customer_id: string | null }> | null) ?? []
  const equipments = (eqRes.data as Array<{ id: string; property_id: string | null }> | null) ?? []
  const smsRows = (smsRes.data as Array<{ firm_id: string | null; segments: number | null; status: string | null }> | null) ?? []

  // firm → set of customer_ids (din bookings)
  const firmCustomers = new Map<string, Set<string>>()
  for (const b of bookings) {
    if (!b.firm_id || !b.customer_id) continue
    if (!firmCustomers.has(b.firm_id)) firmCustomers.set(b.firm_id, new Set())
    firmCustomers.get(b.firm_id)!.add(b.customer_id)
  }

  // customer → properties[]
  const custProps = new Map<string, string[]>()
  for (const p of properties) {
    if (!p.customer_id) continue
    if (!custProps.has(p.customer_id)) custProps.set(p.customer_id, [])
    custProps.get(p.customer_id)!.push(p.id)
  }

  // property → equipment count
  const propEqCount = new Map<string, number>()
  for (const e of equipments) {
    if (!e.property_id) continue
    propEqCount.set(e.property_id, (propEqCount.get(e.property_id) ?? 0) + 1)
  }

  // firm → sms totals (only sent/delivered count as billable)
  const firmSms = new Map<string, { count: number; segments: number }>()
  for (const s of smsRows) {
    if (!s.firm_id) continue
    const billable = s.status === "sent" || s.status === "delivered"
    if (!billable) continue
    const cur = firmSms.get(s.firm_id) ?? { count: 0, segments: 0 }
    cur.count += 1
    cur.segments += s.segments ?? 1
    firmSms.set(s.firm_id, cur)
  }

  type Row = {
    firmId: string
    firmName: string
    plan: string
    clients: number
    locations: number
    equipments: number
    smsCount: number
    segments: number
    costCents: number
  }

  const rows: Row[] = firms
    .filter((f) => firmIds.includes(f.id))
    .map((f) => {
      const custSet = firmCustomers.get(f.id) ?? new Set<string>()
      let locations = 0
      let eq = 0
      for (const cid of custSet) {
        const props = custProps.get(cid) ?? []
        locations += props.length
        for (const pid of props) eq += propEqCount.get(pid) ?? 0
      }
      const sms = firmSms.get(f.id) ?? { count: 0, segments: 0 }
      return {
        firmId: f.id,
        firmName: f.brand_name || f.legal_name,
        plan: f.plan ?? "free",
        clients: custSet.size,
        locations,
        equipments: eq,
        smsCount: sms.count,
        segments: sms.segments,
        costCents: sms.segments * tariffCents,
      }
    })
    .sort((a, b) => b.costCents - a.costCents || a.firmName.localeCompare(b.firmName, "ro"))

  const totals = rows.reduce(
    (acc, r) => ({
      clients: acc.clients + r.clients,
      locations: acc.locations + r.locations,
      equipments: acc.equipments + r.equipments,
      smsCount: acc.smsCount + r.smsCount,
      segments: acc.segments + r.segments,
      costCents: acc.costCents + r.costCents,
    }),
    { clients: 0, locations: 0, equipments: 0, smsCount: 0, segments: 0, costCents: 0 },
  )

  return (
    <div className="dash-page">
      <h1 className="dash-title">Facturare SMS — raport lunar</h1>
      <p className="dash-lead">
        Perioada: <strong>{label}</strong> · Tarif: <strong>{(tariffCents / 100).toFixed(2)} lei / segment</strong>.
        Doar SMS-urile <em>sent / delivered</em> se facturează.
      </p>

      <form method="get" className="dash-form" style={{ marginBottom: 16 }}>
        <label className="dash-field">
          <span>Lună (YYYY-MM)</span>
          <input type="month" name="month" defaultValue={ym} />
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="dash-btn dash-btn--primary" type="submit">Schimbă luna</button>
          <Link className="dash-btn dash-btn--ghost" href="/dashboard/planuri">Modifică tarif →</Link>
        </div>
      </form>

      <div className="dash-kpis" style={{ marginBottom: 20 }}>
        <div className="dash-kpi">
          <div className="dash-kpi__label">Firme în raport</div>
          <div className="dash-kpi__value">{rows.length}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi__label">SMS facturabile</div>
          <div className="dash-kpi__value">{totals.smsCount}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi__label">Segmente</div>
          <div className="dash-kpi__value">{totals.segments}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi__label">Total facturat</div>
          <div className="dash-kpi__value">{(totals.costCents / 100).toFixed(2)} lei</div>
        </div>
      </div>

      <div className="dash-table-wrap">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Firmă</th>
              <th>Plan</th>
              <th>Clienți</th>
              <th>Locații</th>
              <th>Echipamente</th>
              <th>SMS</th>
              <th>Segmente</th>
              <th>De facturat</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: 24, color: "var(--text-500)" }}>Nu există firme.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.firmId}>
                <td>
                  <Link href={`/dashboard/firme/${r.firmId}`}>{r.firmName}</Link>
                </td>
                <td><span className="dash-status dash-status--approved">{r.plan}</span></td>
                <td>{r.clients}</td>
                <td>{r.locations}</td>
                <td>{r.equipments}</td>
                <td>{r.smsCount}</td>
                <td>{r.segments}</td>
                <td><strong>{(r.costCents / 100).toFixed(2)} lei</strong></td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr style={{ fontWeight: 700, background: "var(--surface-2)" }}>
                <td colSpan={2}>TOTAL</td>
                <td>{totals.clients}</td>
                <td>{totals.locations}</td>
                <td>{totals.equipments}</td>
                <td>{totals.smsCount}</td>
                <td>{totals.segments}</td>
                <td>{(totals.costCents / 100).toFixed(2)} lei</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
