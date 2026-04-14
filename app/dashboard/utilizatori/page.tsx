// app/dashboard/utilizatori/page.tsx
// Admin — listă utilizatori (profiles joined cu firma atribuită) + search.
export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"

type SP = { q?: string; role?: string }

const ROLE_OPTIONS = ["admin", "firm_owner", "firm", "user"] as const

function normalizeForSearch(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<SP>
}) {
  const supabase = await createClient()
  const { data: u } = await supabase.auth.getUser()
  if (!u.user) redirect("/login?redirect=/dashboard/utilizatori")
  const { role } = await getUserRole(u.user.id)
  if (role !== "admin") redirect("/dashboard")

  const sp = await searchParams
  const q = (sp.q ?? "").trim()
  const filterRole = (ROLE_OPTIONS as readonly string[]).includes(sp.role ?? "") ? (sp.role as string) : ""

  const admin = getServiceRoleSupabase()

  let profileQuery = admin
    .from("profiles")
    .select("user_id, email, full_name, phone, role, firm_id, created_at")
    .order("created_at", { ascending: false })
    .limit(500)
  if (filterRole) profileQuery = profileQuery.eq("role", filterRole)

  const { data: profiles } = await profileQuery
  let rows = ((profiles ?? []) as Array<{
    user_id: string
    email: string | null
    full_name: string | null
    phone: string | null
    role: string | null
    firm_id: string | null
    created_at: string
  }>)

  const firmIds = Array.from(new Set(rows.map((r) => r.firm_id).filter(Boolean))) as string[]
  const firmMap = new Map<string, { name: string; slug: string }>()
  if (firmIds.length > 0) {
    const { data: firms } = await admin
      .from("gas_firms")
      .select("id, slug, brand_name, legal_name")
      .in("id", firmIds)
    for (const f of (firms ?? []) as Array<{ id: string; slug: string; brand_name: string | null; legal_name: string }>) {
      firmMap.set(f.id, { name: f.brand_name || f.legal_name, slug: f.slug })
    }
  }

  if (q) {
    const needle = normalizeForSearch(q)
    rows = rows.filter((r) => {
      const firm = r.firm_id ? firmMap.get(r.firm_id) : null
      const hay = [r.email, r.full_name, r.phone, r.role, firm?.name ?? null]
        .map((v) => normalizeForSearch(String(v ?? "")))
        .join(" ")
      return hay.includes(needle)
    })
  }

  return (
    <div className="dash-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h1 className="dash-title" style={{ margin: 0 }}>Utilizatori</h1>
        <Link href="/dashboard/utilizatori/nou" className="dash-btn dash-btn--primary">
          + Creează utilizator
        </Link>
      </div>

      <form method="get" className="dash-form" style={{ margin: "20px 0" }}>
        <div className="booking-row">
          <label className="dash-field">
            <span>Search (email, nume, telefon, firmă)</span>
            <input name="q" defaultValue={q} placeholder="ex: mihai, 0722…, firma" />
          </label>
          <label className="dash-field">
            <span>Rol</span>
            <select name="role" defaultValue={filterRole}>
              <option value="">— toate —</option>
              {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="dash-btn dash-btn--primary" type="submit">Filtrează</button>
          <Link className="dash-btn dash-btn--ghost" href="/dashboard/utilizatori">Reset</Link>
        </div>
      </form>

      <div style={{ marginBottom: 14, color: "var(--text-600)", fontSize: 14 }}>
        <strong>{rows.length}</strong> utilizatori
      </div>

      {rows.length === 0 ? (
        <p className="dash-note">Niciun utilizator.</p>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Email / Nume</th>
                <th>Telefon</th>
                <th>Rol</th>
                <th>Firmă atribuită</th>
                <th>Creat</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const firm = r.firm_id ? firmMap.get(r.firm_id) : null
                return (
                  <tr key={r.user_id}>
                    <td>
                      <div>{r.email ?? "—"}</div>
                      <div className="dash-subtle">{r.full_name ?? "fără nume"}</div>
                    </td>
                    <td>{r.phone ?? "—"}</td>
                    <td><span className="dash-status dash-status--approved">{r.role ?? "user"}</span></td>
                    <td>
                      {firm
                        ? <Link href={`/dashboard/firme/${r.firm_id}`}>{firm.name}</Link>
                        : <span style={{ color: "var(--text-500)" }}>— neatribuit —</span>}
                    </td>
                    <td>{new Date(r.created_at).toLocaleDateString("ro-RO")}</td>
                    <td>
                      <Link href={`/dashboard/utilizatori/${r.user_id}`} className="dash-btn dash-btn--ghost">
                        Detalii →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
