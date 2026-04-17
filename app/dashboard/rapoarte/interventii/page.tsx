// app/dashboard/rapoarte/interventii/page.tsx
// Raport intervenții: count per tip lucrare × tehnician × lună.
export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"

const WORK_TYPE_LABELS: Record<string, string> = {
  verificare: "Verificare",
  revizie: "Revizie",
  reparatie: "Reparație",
  instalare: "Instalare",
  inspectie: "Inspecție",
  altul: "Altul",
}

function monthKey(d: string): string {
  return d.slice(0, 7) // YYYY-MM
}

type Props = {
  searchParams: Promise<{ from?: string; to?: string }>
}

export default async function Page({ searchParams }: Props) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect("/login?redirect=/dashboard/rapoarte/interventii")
  const { role, firmId } = await getUserRole(data.user.id)
  if (role !== "firm_owner" || !firmId) {
    return (
      <div className="dash-page">
        <h1 className="dash-title">Raport intervenții</h1>
        <p className="dash-note">
          Doar firmele pot accesa rapoartele.{" "}
          <Link href="/dashboard/adauga-firma">Adaugă firmă →</Link>
        </p>
      </div>
    )
  }

  const sp = await searchParams
  const today = new Date()
  const defaultFrom = new Date(today.getFullYear(), today.getMonth() - 5, 1).toISOString().slice(0, 10)
  const defaultTo = today.toISOString().slice(0, 10)
  const from = sp.from ?? defaultFrom
  const to = sp.to ?? defaultTo

  const admin = getServiceRoleSupabase()
  const [wsRes, techRes] = await Promise.all([
    admin
      .from("work_sheets")
      .select("id, technician_id, work_date, work_type, duration_minutes, status")
      .eq("firm_id", firmId)
      .gte("work_date", from)
      .lte("work_date", to),
    admin
      .from("firm_employees")
      .select("id, full_name")
      .eq("firm_id", firmId)
      .eq("is_active", true)
      .order("full_name"),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sheets = (wsRes.data ?? []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const technicians = (techRes.data ?? []) as any[]

  const techNameById = new Map<string, string>()
  for (const t of technicians) techNameById.set(t.id, t.full_name)

  // Matrix: tehnician × tip lucrare
  const matrix = new Map<string, Map<string, number>>()
  const byType: Record<string, number> = {}
  const byMonth = new Map<string, Map<string, number>>() // month -> type -> count
  let totalCount = 0
  let totalMinutes = 0

  for (const s of sheets) {
    totalCount++
    totalMinutes += Number(s.duration_minutes ?? 0)

    const techKey = s.technician_id ?? "—"
    if (!matrix.has(techKey)) matrix.set(techKey, new Map())
    const inner = matrix.get(techKey)!
    inner.set(s.work_type ?? "altul", (inner.get(s.work_type ?? "altul") ?? 0) + 1)

    byType[s.work_type ?? "altul"] = (byType[s.work_type ?? "altul"] ?? 0) + 1

    const m = monthKey(s.work_date)
    if (!byMonth.has(m)) byMonth.set(m, new Map())
    const mm = byMonth.get(m)!
    mm.set(s.work_type ?? "altul", (mm.get(s.work_type ?? "altul") ?? 0) + 1)
  }

  const workTypeKeys = Object.keys(WORK_TYPE_LABELS)
  const sortedMonths = [...byMonth.keys()].sort()
  const techIds = [...matrix.keys()].sort((a, b) => {
    const na = a === "—" ? "zz" : techNameById.get(a) ?? ""
    const nb = b === "—" ? "zz" : techNameById.get(b) ?? ""
    return na.localeCompare(nb)
  })

  return (
    <div className="dash-page">
      <h1 className="dash-title">Raport intervenții</h1>
      <p className="dash-subtle">
        Distribuția fișelor de lucru pe tip intervenție, tehnician și lună.
      </p>

      <form method="get" className="dash-search-bar no-print" style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span>De la:</span>
          <input type="date" name="from" defaultValue={from} />
        </label>
        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span>Până la:</span>
          <input type="date" name="to" defaultValue={to} />
        </label>
        <button type="submit" className="dash-btn dash-btn--primary">Aplică</button>
      </form>

      <div className="dash-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
        <div className="dash-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#14849b" }}>{totalCount}</div>
          <div style={{ fontSize: 13, color: "#555" }}>Total intervenții</div>
        </div>
        <div className="dash-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#14849b" }}>{Math.round(totalMinutes / 60)}</div>
          <div style={{ fontSize: 13, color: "#555" }}>Ore totale</div>
        </div>
        {workTypeKeys.slice(0, 4).map((t) => (
          <div key={t} className="dash-card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#1e6b34" }}>{byType[t] ?? 0}</div>
            <div style={{ fontSize: 13, color: "#555" }}>{WORK_TYPE_LABELS[t]}</div>
          </div>
        ))}
      </div>

      <section style={{ marginBottom: 32 }}>
        <h2>Intervenții per tehnician × tip</h2>
        {techIds.length === 0 ? (
          <p className="dash-note">Nicio intervenție în intervalul ales.</p>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Tehnician</th>
                {workTypeKeys.map((t) => <th key={t}>{WORK_TYPE_LABELS[t]}</th>)}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {techIds.map((tid) => {
                const row = matrix.get(tid)!
                const total = [...row.values()].reduce((a, b) => a + b, 0)
                return (
                  <tr key={tid}>
                    <td>{tid === "—" ? <em>(nesetat)</em> : techNameById.get(tid) ?? <code>{tid.slice(0, 8)}</code>}</td>
                    {workTypeKeys.map((t) => <td key={t}>{row.get(t) ?? 0}</td>)}
                    <td><strong>{total}</strong></td>
                  </tr>
                )
              })}
              <tr style={{ background: "#f1f5f9", fontWeight: 700 }}>
                <td>Total</td>
                {workTypeKeys.map((t) => <td key={t}>{byType[t] ?? 0}</td>)}
                <td>{totalCount}</td>
              </tr>
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2>Intervenții per lună × tip</h2>
        {sortedMonths.length === 0 ? (
          <p className="dash-note">Niciun date.</p>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Lună</th>
                {workTypeKeys.map((t) => <th key={t}>{WORK_TYPE_LABELS[t]}</th>)}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {sortedMonths.map((m) => {
                const row = byMonth.get(m)!
                const total = [...row.values()].reduce((a, b) => a + b, 0)
                return (
                  <tr key={m}>
                    <td>{m}</td>
                    {workTypeKeys.map((t) => <td key={t}>{row.get(t) ?? 0}</td>)}
                    <td><strong>{total}</strong></td>
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
