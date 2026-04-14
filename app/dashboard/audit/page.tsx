// app/dashboard/audit/page.tsx
// Audit log viewer — toate acțiunile sensibile cu filtrare pe action/entity.
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"

type Props = { searchParams: Promise<{ action?: string; entity?: string }> }

export default async function Page({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: u } = await supabase.auth.getUser()
  if (!u.user) redirect("/login?redirect=/dashboard/audit")

  const { role } = await getUserRole(u.user.id)
  if (role !== "admin") redirect("/dashboard")

  const sp = await searchParams

  const admin = getServiceRoleSupabase()
  let query = admin
    .from("audit_log")
    .select("id, actor_user_id, actor_role, action, entity_type, entity_id, summary, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(500)
  if (sp.action) query = query.eq("action", sp.action)
  if (sp.entity) query = query.eq("entity_type", sp.entity)

  const { data } = await query
  const rows = (data ?? []) as Array<{
    id: string
    actor_user_id: string | null
    actor_role: string | null
    action: string
    entity_type: string
    entity_id: string
    summary: string | null
    metadata: Record<string, unknown> | null
    created_at: string
  }>

  // Distincte pentru filter chips
  const actions = [...new Set(rows.map((r) => r.action))]
  const entities = [...new Set(rows.map((r) => r.entity_type))]

  return (
    <div className="dash-page">
      <h1 className="dash-title">Audit log</h1>

      <div className="dash-filters">
        <div>
          <strong>Acțiune:</strong>
          <Link href="/dashboard/audit" className="dash-tab">toate</Link>
          {actions.map((a) => (
            <Link
              key={a}
              href={`/dashboard/audit?action=${a}${sp.entity ? `&entity=${sp.entity}` : ""}`}
              className={`dash-tab ${sp.action === a ? "dash-tab--active" : ""}`}
            >
              {a}
            </Link>
          ))}
        </div>
        <div>
          <strong>Entitate:</strong>
          <Link href="/dashboard/audit" className="dash-tab">toate</Link>
          {entities.map((e) => (
            <Link
              key={e}
              href={`/dashboard/audit?entity=${e}${sp.action ? `&action=${sp.action}` : ""}`}
              className={`dash-tab ${sp.entity === e ? "dash-tab--active" : ""}`}
            >
              {e}
            </Link>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="dash-note">Niciun eveniment înregistrat.</p>
      ) : (
        <table className="dash-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Actor</th>
              <th>Acțiune</th>
              <th>Entitate</th>
              <th>Sumar</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{new Date(r.created_at).toLocaleString("ro-RO")}</td>
                <td>
                  {r.actor_role ?? "—"}
                  {r.actor_user_id && <div className="dash-subtle"><code>{r.actor_user_id.slice(0, 8)}</code></div>}
                </td>
                <td><code>{r.action}</code></td>
                <td>
                  <code>{r.entity_type}</code>
                  <div className="dash-subtle"><code>{r.entity_id.slice(0, 8)}</code></div>
                </td>
                <td>{r.summary ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
