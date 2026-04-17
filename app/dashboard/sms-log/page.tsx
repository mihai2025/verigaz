// app/dashboard/sms-log/page.tsx
// Admin — listă completă sms_logs cu filtre + totaluri.
export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import DateInput from "@/components/ui/DateInput"

type SP = {
  firm?: string
  status?: string
  from?: string
  to?: string
  page?: string
}

const PAGE_SIZE = 50

function maskPhone(p: string | null): string {
  if (!p) return "—"
  const s = String(p)
  if (s.length <= 4) return s
  return s.slice(0, 4) + "••••" + s.slice(-2)
}

export default async function SmsLogPage({
  searchParams,
}: {
  searchParams: Promise<SP>
}) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect("/login?redirect=/dashboard/sms-log")
  const { role } = await getUserRole(auth.user.id)
  if (role !== "admin") redirect("/dashboard")

  const page = Math.max(1, Number(sp.page ?? 1) || 1)
  const admin = getServiceRoleSupabase()

  const firms = await admin
    .from("gas_firms")
    .select("id, legal_name, brand_name")
    .order("legal_name")
    .limit(1000)
  const firmMap = new Map<string, string>(
    ((firms.data as Array<{ id: string; legal_name: string; brand_name: string | null }> | null) ?? [])
      .map((f) => [f.id, f.brand_name || f.legal_name]),
  )

  let query = admin
    .from("sms_logs")
    .select(
      "id, phone, template_key, provider, status, booking_id, reminder_id, firm_id, customer_id, lead_id, cost_cents, segments, direction, created_at, error_message",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (sp.firm) query = query.eq("firm_id", sp.firm)
  if (sp.status) query = query.eq("status", sp.status)
  if (sp.from) query = query.gte("created_at", sp.from)
  if (sp.to) query = query.lte("created_at", sp.to)

  const { data, count } = await query
  const rows = (data as Array<{
    id: string
    phone: string | null
    template_key: string | null
    provider: string | null
    status: string | null
    firm_id: string | null
    cost_cents: number | null
    segments: number | null
    direction: string | null
    created_at: string
    error_message: string | null
  }> | null) ?? []

  // Totals (pe filtrul curent, toate paginile)
  let totalsQuery = admin
    .from("sms_logs")
    .select("cost_cents, segments, status")
  if (sp.firm) totalsQuery = totalsQuery.eq("firm_id", sp.firm)
  if (sp.status) totalsQuery = totalsQuery.eq("status", sp.status)
  if (sp.from) totalsQuery = totalsQuery.gte("created_at", sp.from)
  if (sp.to) totalsQuery = totalsQuery.lte("created_at", sp.to)
  const totalsRes = await totalsQuery
  const totalsRows = (totalsRes.data as Array<{ cost_cents: number | null; segments: number | null; status: string | null }> | null) ?? []
  const totalCostCents = totalsRows.reduce((s, r) => s + (r.cost_cents ?? 0), 0)
  const totalSegments = totalsRows.reduce((s, r) => s + (r.segments ?? 0), 0)
  const totalSent = totalsRows.filter((r) => r.status === "sent" || r.status === "delivered").length

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))

  const qs = (p: Partial<SP>) => {
    const merged = { ...sp, ...p }
    const out = new URLSearchParams()
    for (const [k, v] of Object.entries(merged)) if (v) out.set(k, String(v))
    return out.toString()
  }

  return (
    <div className="dash-page">
      <h1 className="dash-title">SMS log</h1>
      <p className="dash-lead">
        Toate SMS-urile trimise prin platformă. Totalurile de mai jos aplică filtrul curent.
      </p>

      <form method="get" className="dash-form" style={{ marginBottom: 16 }}>
        <div className="booking-row">
          <label className="dash-field">
            <span>Firmă</span>
            <select name="firm" defaultValue={sp.firm ?? ""}>
              <option value="">— toate —</option>
              {Array.from(firmMap.entries()).map(([id, nume]) => (
                <option key={id} value={id}>{nume}</option>
              ))}
            </select>
          </label>
          <label className="dash-field">
            <span>Status</span>
            <select name="status" defaultValue={sp.status ?? ""}>
              <option value="">— toate —</option>
              <option value="sent">sent</option>
              <option value="delivered">delivered</option>
              <option value="failed">failed</option>
              <option value="pending">pending</option>
            </select>
          </label>
        </div>
        <div className="booking-row">
          <label className="dash-field">
            <span>De la</span>
            <DateInput name="from" defaultValue={sp.from ?? ""} />
          </label>
          <label className="dash-field">
            <span>Până la</span>
            <DateInput name="to" defaultValue={sp.to ?? ""} />
          </label>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="dash-btn dash-btn--primary" type="submit">Filtrează</button>
          <Link className="dash-btn dash-btn--ghost" href="/dashboard/sms-log">Reset</Link>
        </div>
      </form>

      <div className="dash-kpis" style={{ marginBottom: 20 }}>
        <div className="dash-kpi">
          <div className="dash-kpi__label">Total înregistrări</div>
          <div className="dash-kpi__value">{count ?? 0}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi__label">Livrate / trimise</div>
          <div className="dash-kpi__value">{totalSent}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi__label">Segmente totale</div>
          <div className="dash-kpi__value">{totalSegments}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi__label">Cost total</div>
          <div className="dash-kpi__value">{(totalCostCents / 100).toFixed(2)} lei</div>
        </div>
      </div>

      <div className="dash-table-wrap">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Dată</th>
              <th>Firmă</th>
              <th>Template</th>
              <th>Telefon</th>
              <th>Segmente</th>
              <th>Cost</th>
              <th>Status</th>
              <th>Provider</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: 24, color: "var(--text-500)" }}>Nu există înregistrări.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{new Date(r.created_at).toLocaleString("ro-RO")}</td>
                <td>{r.firm_id ? firmMap.get(r.firm_id) ?? "—" : "—"}</td>
                <td>{r.template_key ?? "—"}</td>
                <td>{maskPhone(r.phone)}</td>
                <td>{r.segments ?? 0}</td>
                <td>{((r.cost_cents ?? 0) / 100).toFixed(2)} lei</td>
                <td>
                  <span className={`dash-status dash-status--${r.status === "failed" ? "rejected" : r.status === "pending" ? "pending" : "approved"}`}>
                    {r.status ?? "—"}
                  </span>
                </td>
                <td>{r.provider ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", gap: 8, marginTop: 16, alignItems: "center" }}>
          {page > 1 && <Link className="dash-btn dash-btn--ghost" href={`/dashboard/sms-log?${qs({ page: String(page - 1) })}`}>← Anterior</Link>}
          <span style={{ color: "var(--text-500)" }}>Pagina {page} / {totalPages}</span>
          {page < totalPages && <Link className="dash-btn dash-btn--ghost" href={`/dashboard/sms-log?${qs({ page: String(page + 1) })}`}>Următor →</Link>}
        </div>
      )}
    </div>
  )
}
