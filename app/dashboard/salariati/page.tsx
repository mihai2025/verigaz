// app/dashboard/salariati/page.tsx
// Nomenclator angajați firmă — cei care execută verificări/revizii/instalări.
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"

type Props = { searchParams: Promise<{ status?: string }> }

export default async function Page({ searchParams }: Props) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect("/login?redirect=/dashboard/salariati")

  const { role, firmId } = await getUserRole(data.user.id)
  if (role !== "firm_owner" || !firmId) {
    return (
      <div className="dash-page">
        <h1 className="dash-title">Salariați</h1>
        <p className="dash-note">
          Doar firmele înregistrate pot gestiona angajați.{" "}
          <Link href="/dashboard/adauga-firma">Adaugă firmă →</Link>
        </p>
      </div>
    )
  }

  const sp = await searchParams
  const showInactive = sp.status === "inactivi"

  const admin = getServiceRoleSupabase()
  let query = admin
    .from("firm_employees")
    .select("id, full_name, employee_code, role, phone, email, anre_personal_certificate_no, is_active, deactivated_at, created_at")
    .eq("firm_id", firmId)
    .order("is_active", { ascending: false })
    .order("full_name", { ascending: true })
  if (!showInactive) query = query.eq("is_active", true)

  const { data: emps } = await query
  const rows = (emps ?? []) as unknown as Array<{
    id: string
    full_name: string
    employee_code: string | null
    role: string | null
    phone: string | null
    email: string | null
    anre_personal_certificate_no: string | null
    is_active: boolean
    deactivated_at: string | null
    created_at: string
  }>

  return (
    <div className="dash-page">
      <h1 className="dash-title">Salariați</h1>
      <p className="dash-subtle">
        Nomenclator persoane care execută verificări/revizii/instalări. Poate fi
        atribuit la programări și apare ca tehnician pe certificat.
      </p>

      <nav className="dash-tabs">
        <Link
          href="/dashboard/salariati"
          className={`dash-tab ${!showInactive ? "dash-tab--active" : ""}`}
        >
          activi
        </Link>
        <Link
          href="/dashboard/salariati?status=inactivi"
          className={`dash-tab ${showInactive ? "dash-tab--active" : ""}`}
        >
          toți (inclusiv inactivi)
        </Link>
      </nav>

      <p>
        <Link href="/dashboard/salariati/nou" className="dash-btn dash-btn--primary">
          + Adaugă angajat
        </Link>
      </p>

      {rows.length === 0 ? (
        <p className="dash-note">Nu ai încă angajați înregistrați.</p>
      ) : (
        <table className="dash-table">
          <thead>
            <tr>
              <th>Nume</th>
              <th>Cod</th>
              <th>Rol</th>
              <th>Contact</th>
              <th>Aut. ANRE personală</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id} className={!e.is_active ? "dash-row--inactive" : ""}>
                <td>{e.full_name}</td>
                <td>{e.employee_code ? <code>{e.employee_code}</code> : "—"}</td>
                <td>{e.role ?? "—"}</td>
                <td>
                  {e.phone && <div>{e.phone}</div>}
                  {e.email && <div className="dash-subtle">{e.email}</div>}
                  {!e.phone && !e.email && "—"}
                </td>
                <td>{e.anre_personal_certificate_no ? <code>{e.anre_personal_certificate_no}</code> : "—"}</td>
                <td>
                  {e.is_active ? (
                    <span className="dash-status dash-status--active">activ</span>
                  ) : (
                    <>
                      <span className="dash-status dash-status--canceled">inactiv</span>
                      {e.deactivated_at && (
                        <div className="dash-subtle">
                          din {new Date(e.deactivated_at).toLocaleDateString("ro-RO")}
                        </div>
                      )}
                    </>
                  )}
                </td>
                <td>
                  <Link href={`/dashboard/salariati/${e.id}`} className="dash-btn dash-btn--ghost">
                    Editează →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
