// app/dashboard/firme/page.tsx
// Admin — listă firme cu filtrare pe verification_status.
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"

type Props = {
  searchParams: Promise<{ status?: string }>
}

const STATUS_OPTIONS = ["pending", "approved", "rejected", "suspended"] as const

export default async function AdminFirmsPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: u } = await supabase.auth.getUser()
  if (!u.user) redirect("/login?redirect=/dashboard/firme")

  const { role } = await getUserRole(u.user.id)
  if (role !== "admin") redirect("/dashboard")

  const sp = await searchParams
  const status = (STATUS_OPTIONS as readonly string[]).includes(sp.status ?? "")
    ? (sp.status as string)
    : "pending"

  const admin = getServiceRoleSupabase()
  const { data: firms } = await admin
    .from("gas_firms")
    .select(
      "id, slug, brand_name, legal_name, cui, anre_authorization_no, plan, " +
      "verification_status, is_active, created_at, " +
      "judete:sediu_judet_id(nume), localitati:sediu_localitate_id(nume)",
    )
    .eq("verification_status", status)
    .order("created_at", { ascending: false })
    .limit(100)

  const rows = (firms ?? []) as unknown as Array<{
    id: string
    slug: string
    brand_name: string | null
    legal_name: string
    cui: string | null
    anre_authorization_no: string | null
    plan: string
    verification_status: string
    is_active: boolean
    created_at: string
    judete: { nume: string } | { nume: string }[] | null
    localitati: { nume: string } | { nume: string }[] | null
  }>

  return (
    <div className="dash-page">
      <h1 className="dash-title">Firme — moderare</h1>

      <nav className="dash-tabs">
        {STATUS_OPTIONS.map((s) => (
          <Link
            key={s}
            href={`/dashboard/firme?status=${s}`}
            className={`dash-tab ${status === s ? "dash-tab--active" : ""}`}
          >
            {s}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <p className="dash-note">Nicio firmă cu status „{status}".</p>
      ) : (
        <table className="dash-table">
          <thead>
            <tr>
              <th>Firmă</th>
              <th>CUI</th>
              <th>Aut. ANRE</th>
              <th>Locație</th>
              <th>Plan</th>
              <th>Creată</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((f) => {
              const j = Array.isArray(f.judete) ? f.judete[0] : f.judete
              const l = Array.isArray(f.localitati) ? f.localitati[0] : f.localitati
              const loc = [l?.nume, j?.nume].filter(Boolean).join(", ") || "—"
              return (
                <tr key={f.id}>
                  <td>
                    <Link href={`/firme/${f.slug}`}>
                      {f.brand_name || f.legal_name}
                    </Link>
                    <div className="dash-subtle">{f.legal_name}</div>
                  </td>
                  <td>{f.cui ?? "—"}</td>
                  <td>{f.anre_authorization_no ?? "—"}</td>
                  <td>{loc}</td>
                  <td>{f.plan}</td>
                  <td>{new Date(f.created_at).toLocaleDateString("ro-RO")}</td>
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
      )}
    </div>
  )
}
