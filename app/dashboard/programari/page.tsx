// app/dashboard/programari/page.tsx
// Listă programări pentru firma curentă.
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"

type Props = { searchParams: Promise<{ status?: string }> }

const STATUS_TABS = ["pending", "confirmed", "scheduled", "completed", "cancelled"] as const

export default async function Page({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: u } = await supabase.auth.getUser()
  if (!u.user) redirect("/login?redirect=/dashboard/programari")

  const { role, firmId } = await getUserRole(u.user.id)
  if (role !== "firm_owner" || !firmId) {
    return (
      <div className="dash-page">
        <h1 className="dash-title">Programări</h1>
        <p className="dash-note">
          Doar firmele înregistrate pot primi programări. {" "}
          <Link href="/dashboard/adauga-firma">Adaugă firma →</Link>
        </p>
      </div>
    )
  }

  const sp = await searchParams
  const status = (STATUS_TABS as readonly string[]).includes(sp.status ?? "")
    ? (sp.status as string)
    : "pending"

  const admin = getServiceRoleSupabase()
  const { data: bookings } = await admin
    .from("bookings")
    .select(
      "id, public_ref, status, preferred_date, preferred_time_window, scheduled_start, " +
      "price_quoted, price_final, source, notes_customer, created_at, " +
      "customers(full_name, phone), " +
      "service_categories(slug, nume), " +
      "properties(address, judete:judet_id(nume), localitati:localitate_id(nume))",
    )
    .eq("firm_id", firmId)
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(100)

  const rows = (bookings ?? []) as Array<{
    id: string
    public_ref: string
    status: string
    preferred_date: string | null
    preferred_time_window: string | null
    scheduled_start: string | null
    price_quoted: number | null
    price_final: number | null
    source: string | null
    notes_customer: string | null
    created_at: string
    customers: { full_name: string; phone: string } | { full_name: string; phone: string }[] | null
    service_categories: { slug: string; nume: string } | { slug: string; nume: string }[] | null
    properties:
      | { address: string; judete: { nume: string } | null; localitati: { nume: string } | null }
      | Array<{ address: string; judete: { nume: string } | null; localitati: { nume: string } | null }>
      | null
  }>

  return (
    <div className="dash-page">
      <h1 className="dash-title">Programări</h1>

      <nav className="dash-tabs">
        {STATUS_TABS.map((s) => (
          <Link
            key={s}
            href={`/dashboard/programari?status=${s}`}
            className={`dash-tab ${status === s ? "dash-tab--active" : ""}`}
          >
            {s}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <p className="dash-note">Nicio programare cu status „{status}".</p>
      ) : (
        <table className="dash-table">
          <thead>
            <tr>
              <th>Ref.</th>
              <th>Client</th>
              <th>Serviciu</th>
              <th>Adresă</th>
              <th>Data preferată</th>
              <th>Preț</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => {
              const c = Array.isArray(b.customers) ? b.customers[0] : b.customers
              const sc = Array.isArray(b.service_categories) ? b.service_categories[0] : b.service_categories
              const p = Array.isArray(b.properties) ? b.properties[0] : b.properties
              const loc = p
                ? [p.localitati?.nume, p.judete?.nume].filter(Boolean).join(", ")
                : ""
              const date = b.scheduled_start
                ? new Date(b.scheduled_start).toLocaleString("ro-RO")
                : b.preferred_date
                  ? new Date(b.preferred_date).toLocaleDateString("ro-RO")
                  : "—"
              const price = b.price_final ?? b.price_quoted
              return (
                <tr key={b.id}>
                  <td><code>{b.public_ref}</code></td>
                  <td>
                    {c?.full_name ?? "—"}
                    {c?.phone && <div className="dash-subtle">{c.phone}</div>}
                  </td>
                  <td>{sc?.nume ?? "—"}</td>
                  <td>
                    {p?.address ?? "—"}
                    {loc && <div className="dash-subtle">{loc}</div>}
                  </td>
                  <td>
                    {date}
                    {b.preferred_time_window && (
                      <div className="dash-subtle">{b.preferred_time_window}</div>
                    )}
                  </td>
                  <td>{price != null ? `${price} lei` : "—"}</td>
                  <td>
                    <Link href={`/dashboard/programari/${b.id}`} className="dash-btn dash-btn--ghost">
                      Deschide →
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
