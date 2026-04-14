// app/dashboard/documente/page.tsx
// Listă documente emise de firmă (certificate, procese verbale etc).
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"

const TYPE_LABELS: Record<string, string> = {
  certificat_verificare: "Certificat verificare",
  proces_verbal_revizie: "Proces verbal revizie",
  declaratie_detector: "Declarație detector",
  certificat_conformitate: "Certificat conformitate",
  fisa_tehnica_centrala: "Fișă tehnică centrală",
  anexa_fotografii: "Anexă fotografii",
}

type Props = { searchParams: Promise<{ type?: string }> }

export default async function Page({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: u } = await supabase.auth.getUser()
  if (!u.user) redirect("/login?redirect=/dashboard/documente")

  const { role, firmId } = await getUserRole(u.user.id)
  if (role !== "firm_owner" || !firmId) {
    return (
      <div className="dash-page">
        <h1 className="dash-title">Documente emise</h1>
        <p className="dash-note">
          Doar firmele înregistrate emit documente. {" "}
          <Link href="/dashboard/adauga-firma">Adaugă firma →</Link>
        </p>
      </div>
    )
  }

  const sp = await searchParams
  const typeFilter = sp.type && TYPE_LABELS[sp.type] ? sp.type : null

  const admin = getServiceRoleSupabase()
  let query = admin
    .from("documents")
    .select(
      "id, document_type, document_number, version, public_ref, file_url, " +
      "signed_status, issued_at, valid_from, valid_until, revoked_at, " +
      "customers(full_name, phone), " +
      "bookings(public_ref)",
    )
    .eq("firm_id", firmId)
    .order("issued_at", { ascending: false })
    .limit(200)
  if (typeFilter) query = query.eq("document_type", typeFilter)

  const { data: docs } = await query
  const rows = (docs ?? []) as unknown as Array<{
    id: string
    document_type: string
    document_number: string
    version: number
    public_ref: string | null
    file_url: string
    signed_status: string
    issued_at: string
    valid_from: string | null
    valid_until: string | null
    revoked_at: string | null
    customers: { full_name: string; phone: string } | { full_name: string; phone: string }[] | null
    bookings: { public_ref: string } | { public_ref: string }[] | null
  }>

  return (
    <div className="dash-page">
      <h1 className="dash-title">Documente emise</h1>

      <nav className="dash-tabs">
        <Link
          href="/dashboard/documente"
          className={`dash-tab ${!typeFilter ? "dash-tab--active" : ""}`}
        >
          toate
        </Link>
        {Object.entries(TYPE_LABELS).map(([slug, label]) => (
          <Link
            key={slug}
            href={`/dashboard/documente?type=${slug}`}
            className={`dash-tab ${typeFilter === slug ? "dash-tab--active" : ""}`}
          >
            {label}
          </Link>
        ))}
      </nav>

      <p className="dash-note">
        Generarea de certificate digitale se va face automat după marcarea programării ca
        finalizată (iterație viitoare — task_11 motor PDF).
      </p>

      {rows.length === 0 ? (
        <p className="dash-note">Niciun document emis încă.</p>
      ) : (
        <table className="dash-table">
          <thead>
            <tr>
              <th>Nr.</th>
              <th>Tip</th>
              <th>Client</th>
              <th>Programare</th>
              <th>Emis</th>
              <th>Valabilitate</th>
              <th>Semnat</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => {
              const c = Array.isArray(d.customers) ? d.customers[0] : d.customers
              const b = Array.isArray(d.bookings) ? d.bookings[0] : d.bookings
              const revoked = !!d.revoked_at
              return (
                <tr key={d.id} className={revoked ? "dash-row--revoked" : ""}>
                  <td>
                    <code>{d.document_number}</code>
                    {d.version > 1 && <span className="dash-subtle"> v{d.version}</span>}
                  </td>
                  <td>{TYPE_LABELS[d.document_type] ?? d.document_type}</td>
                  <td>{c?.full_name ?? "—"}</td>
                  <td>{b?.public_ref ? <code>{b.public_ref}</code> : "—"}</td>
                  <td>{new Date(d.issued_at).toLocaleDateString("ro-RO")}</td>
                  <td>
                    {d.valid_until
                      ? `până la ${new Date(d.valid_until).toLocaleDateString("ro-RO")}`
                      : "—"}
                  </td>
                  <td>{d.signed_status}</td>
                  <td>
                    <a href={d.file_url} target="_blank" rel="noreferrer" className="dash-btn dash-btn--ghost">
                      Descarcă →
                    </a>
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
