// app/dashboard/firme/page.tsx
// Admin — listă firme cu filtre (status, județ, localitate, plan) + search.
export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"

type SP = {
  status?: string
  judet?: string
  localitate?: string
  plan?: string
  q?: string
  page?: string
}

const STATUS_OPTIONS = ["pending", "approved", "rejected", "suspended"] as const
const PLAN_OPTIONS = ["free", "start", "plus", "premium"] as const
const PAGE_SIZE = 50

function normalizeForSearch(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

export default async function AdminFirmsPage({
  searchParams,
}: {
  searchParams: Promise<SP>
}) {
  const supabase = await createClient()
  const { data: u } = await supabase.auth.getUser()
  if (!u.user) redirect("/login?redirect=/dashboard/firme")
  const { role } = await getUserRole(u.user.id)
  if (role !== "admin") redirect("/dashboard")

  const sp = await searchParams
  const status = (STATUS_OPTIONS as readonly string[]).includes(sp.status ?? "")
    ? (sp.status as string)
    : ""
  const plan = (PLAN_OPTIONS as readonly string[]).includes(sp.plan ?? "")
    ? (sp.plan as string)
    : ""
  const judetId = sp.judet ? Number(sp.judet) : null
  const localitateId = sp.localitate ? Number(sp.localitate) : null
  const q = (sp.q ?? "").trim()
  const page = Math.max(1, Number(sp.page ?? 1) || 1)

  const admin = getServiceRoleSupabase()

  const [judeteRes, localitatiRes] = await Promise.all([
    admin.from("judete").select("id, nume").order("nume"),
    judetId
      ? admin.from("localitati").select("id, nume, tip_localitate").eq("judet_id", judetId).order("nume")
      : Promise.resolve({ data: [] as Array<{ id: number; nume: string; tip_localitate: string | null }> }),
  ])
  const judete = (judeteRes.data as Array<{ id: number; nume: string }> | null) ?? []
  const localitati = (localitatiRes.data as Array<{ id: number; nume: string; tip_localitate: string | null }> | null) ?? []

  let query = admin
    .from("gas_firms")
    .select(
      "id, slug, brand_name, legal_name, cui, anre_authorization_no, plan, phone, email, " +
      "verification_status, is_active, created_at, owner_user_id, " +
      "judete:sediu_judet_id(nume), localitati:sediu_localitate_id(nume)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (status) query = query.eq("verification_status", status)
  if (plan) query = query.eq("plan", plan)
  if (judetId) query = query.eq("sediu_judet_id", judetId)
  if (localitateId) query = query.eq("sediu_localitate_id", localitateId)

  if (q) {
    const like = `%${q}%`
    query = query.or(
      [
        `brand_name.ilike.${like}`,
        `legal_name.ilike.${like}`,
        `cui.ilike.${like}`,
        `phone.ilike.${like}`,
        `email.ilike.${like}`,
        `anre_authorization_no.ilike.${like}`,
      ].join(","),
    )
  }

  const { data: firms, count } = await query
  let rows = (firms ?? []) as unknown as Array<{
    id: string
    slug: string
    brand_name: string | null
    legal_name: string
    cui: string | null
    anre_authorization_no: string | null
    plan: string
    phone: string | null
    email: string | null
    verification_status: string
    is_active: boolean
    created_at: string
    owner_user_id: string | null
    judete: { nume: string } | { nume: string }[] | null
    localitati: { nume: string } | { nume: string }[] | null
  }>

  // Load owners (profile.full_name + email) for displayed rows
  const ownerIds = Array.from(new Set(rows.map((r) => r.owner_user_id).filter(Boolean))) as string[]
  let ownersMap = new Map<string, { full_name: string | null; email: string | null }>()
  if (ownerIds.length > 0) {
    const { data: owners } = await admin
      .from("profiles")
      .select("user_id, full_name, email")
      .in("user_id", ownerIds)
    for (const o of (owners ?? []) as Array<{ user_id: string; full_name: string | null; email: string | null }>) {
      ownersMap.set(o.user_id, { full_name: o.full_name, email: o.email })
    }
  }

  // Extra client-side search fallback: match judet / localitate / owner name+email
  if (q) {
    const needle = normalizeForSearch(q)
    rows = rows.filter((r) => {
      const j = Array.isArray(r.judete) ? r.judete[0] : r.judete
      const l = Array.isArray(r.localitati) ? r.localitati[0] : r.localitati
      const owner = r.owner_user_id ? ownersMap.get(r.owner_user_id) : null
      const hay = [
        r.brand_name,
        r.legal_name,
        r.cui,
        r.phone,
        r.email,
        r.anre_authorization_no,
        j?.nume ?? null,
        l?.nume ?? null,
        owner?.full_name ?? null,
        owner?.email ?? null,
      ]
        .map((v) => normalizeForSearch(String(v ?? "")))
        .join(" ")
      return hay.includes(needle)
    })
  }

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))
  const qs = (p: Partial<SP>) => {
    const merged = { ...sp, ...p }
    const out = new URLSearchParams()
    for (const [k, v] of Object.entries(merged)) if (v) out.set(k, String(v))
    return out.toString()
  }

  return (
    <div className="dash-page">
      <h1 className="dash-title">Firme — moderare & listare</h1>

      <form method="get" className="dash-form" style={{ marginBottom: 20 }}>
        <div className="booking-row">
          <label className="dash-field">
            <span>Search (nume, CUI, telefon, email, ANRE, județ, localitate, owner)</span>
            <input name="q" defaultValue={q} placeholder="ex: ad instal, 14568234, 0722…" />
          </label>
          <label className="dash-field">
            <span>Status</span>
            <select name="status" defaultValue={status}>
              <option value="">— toate —</option>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>
        <div className="booking-row">
          <label className="dash-field">
            <span>Plan</span>
            <select name="plan" defaultValue={plan}>
              <option value="">— toate —</option>
              {PLAN_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label className="dash-field">
            <span>Județ</span>
            <select name="judet" defaultValue={judetId ? String(judetId) : ""}>
              <option value="">— toate —</option>
              {judete.map((j) => <option key={j.id} value={j.id}>{j.nume}</option>)}
            </select>
          </label>
          <label className="dash-field">
            <span>Localitate</span>
            <select name="localitate" defaultValue={localitateId ? String(localitateId) : ""} disabled={!judetId}>
              <option value="">{judetId ? "— toate —" : "alege întâi județul"}</option>
              {localitati.map((l) => <option key={l.id} value={l.id}>{l.nume}{l.tip_localitate ? ` (${l.tip_localitate})` : ""}</option>)}
            </select>
          </label>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="dash-btn dash-btn--primary" type="submit">Aplică filtre</button>
          <Link className="dash-btn dash-btn--ghost" href="/dashboard/firme">Reset</Link>
        </div>
      </form>

      <div style={{ marginBottom: 14, color: "var(--text-600)", fontSize: 14 }}>
        <strong>{count ?? 0}</strong> firme (pagina {page} / {totalPages}){rows.length !== (firms?.length ?? 0) && <> · {rows.length} afișate după filtrul client</>}
      </div>

      {rows.length === 0 ? (
        <p className="dash-note">Nicio firmă cu filtrele curente.</p>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Firmă</th>
                <th>CUI</th>
                <th>Aut. ANRE</th>
                <th>Contact</th>
                <th>Locație</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Owner</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((f) => {
                const j = Array.isArray(f.judete) ? f.judete[0] : f.judete
                const l = Array.isArray(f.localitati) ? f.localitati[0] : f.localitati
                const loc = [l?.nume, j?.nume].filter(Boolean).join(", ") || "—"
                const owner = f.owner_user_id ? ownersMap.get(f.owner_user_id) : null
                return (
                  <tr key={f.id}>
                    <td>
                      <Link href={`/firme/${f.slug}`} target="_blank" rel="noreferrer">
                        {f.brand_name || f.legal_name}
                      </Link>
                      <div className="dash-subtle">{f.legal_name}</div>
                    </td>
                    <td>{f.cui ?? "—"}</td>
                    <td>{f.anre_authorization_no ?? "—"}</td>
                    <td>
                      {f.phone && <div>{f.phone}</div>}
                      {f.email && <div className="dash-subtle">{f.email}</div>}
                      {!f.phone && !f.email && "—"}
                    </td>
                    <td>{loc}</td>
                    <td><span className="dash-status dash-status--approved">{f.plan}</span></td>
                    <td><span className={`dash-status dash-status--${f.verification_status}`}>{f.verification_status}</span></td>
                    <td>
                      {owner
                        ? <>
                            <div>{owner.full_name ?? "—"}</div>
                            <div className="dash-subtle">{owner.email ?? "—"}</div>
                          </>
                        : <span style={{ color: "var(--text-500)" }}>— fără owner —</span>}
                    </td>
                    <td>
                      <Link href={`/dashboard/firme/${f.id}`} className="dash-btn dash-btn--ghost">
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

      {totalPages > 1 && (
        <div style={{ display: "flex", gap: 8, marginTop: 16, alignItems: "center" }}>
          {page > 1 && <Link className="dash-btn dash-btn--ghost" href={`/dashboard/firme?${qs({ page: String(page - 1) })}`}>← Anterior</Link>}
          <span style={{ color: "var(--text-500)" }}>Pagina {page} / {totalPages}</span>
          {page < totalPages && <Link className="dash-btn dash-btn--ghost" href={`/dashboard/firme?${qs({ page: String(page + 1) })}`}>Următor →</Link>}
        </div>
      )}
    </div>
  )
}
