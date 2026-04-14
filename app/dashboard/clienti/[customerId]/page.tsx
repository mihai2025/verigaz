// app/dashboard/clienti/[customerId]/page.tsx
// Fișa client — toate adresele + echipamentele + documentele emise.
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import { loadFisaClient, computeNextDue, type FisaClient } from "@/lib/clienti/fisa"

type Params = { customerId: string }

const DOC_TYPE_LABELS: Record<string, string> = {
  certificat_verificare: "Verificare",
  proces_verbal_revizie: "Revizie",
  fisa_tehnica_centrala: "VTP centrală",
  certificat_conformitate: "Conformitate",
  declaratie_detector: "Declarație detector",
  anexa_fotografii: "Anexă foto",
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("ro-RO")
}

function customerName(c: FisaClient["customer"]): string {
  if (c.customer_type === "individual") {
    return [c.first_name, c.last_name].filter(Boolean).join(" ") || c.full_name
  }
  return c.company_name || c.full_name
}

function addressLine(p: FisaClient["properties"][number]): string {
  const parts = [
    p.address,
    p.block_name && `bl. ${p.block_name}`,
    p.stair && `sc. ${p.stair}`,
    p.floor && `et. ${p.floor}`,
    p.apartment && `ap. ${p.apartment}`,
  ].filter(Boolean).join(", ")
  const geo = [p.localitate, p.judet].filter(Boolean).join(", ")
  return [parts, geo].filter(Boolean).join(" · ")
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { customerId } = await params
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect(`/login?redirect=/dashboard/clienti/${customerId}`)
  const { role, firmId } = await getUserRole(data.user.id)
  if (role !== "firm_owner" || !firmId) redirect("/dashboard")

  const fisa = await loadFisaClient(firmId, customerId)
  if (!fisa) notFound()

  return (
    <div className="dash-page fisa-page">
      <nav className="sv-breadcrumb no-print" aria-label="Navigare">
        <Link href="/dashboard/clienti">Clienți</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{customerName(fisa.customer)}</span>
      </nav>

      <header className="fisa-header">
        <div>
          <h1 className="dash-title">Fișă client</h1>
          <p className="dash-subtle">Emis de {fisa.firm.brand_name || fisa.firm.legal_name}</p>
        </div>
        <div className="dash-actions-row no-print">
          <button type="button" onClick={() => window.print()} className="dash-btn dash-btn--ghost">
            🖨 Print
          </button>
          <a
            href={`/api/export/fisa-client/${customerId}`}
            target="_blank"
            rel="noreferrer"
            className="dash-btn dash-btn--primary"
          >
            ⬇ Export PDF
          </a>
        </div>
      </header>

      {/* Client */}
      <section className="dash-card fisa-section">
        <h2>{customerName(fisa.customer)}</h2>
        <dl className="dash-dl">
          <dt>Tip</dt>
          <dd>
            {fisa.customer.customer_type === "individual"
              ? "Persoană fizică"
              : fisa.customer.customer_type === "association"
                ? "Asociație de proprietari"
                : "Persoană juridică"}
          </dd>
          <dt>Telefon</dt><dd><a href={`tel:${fisa.customer.phone}`}>{fisa.customer.phone}</a></dd>
          {fisa.customer.email && (<><dt>Email</dt><dd>{fisa.customer.email}</dd></>)}
          {fisa.customer.cnp && (<><dt>CNP</dt><dd><code>{fisa.customer.cnp}</code></dd></>)}
          {fisa.customer.cui && (<><dt>CUI</dt><dd><code>{fisa.customer.cui}</code></dd></>)}
        </dl>
      </section>

      {/* Adrese + echipamente */}
      {fisa.properties.length === 0 ? (
        <p className="dash-note">Clientul nu are adrese înregistrate.</p>
      ) : (
        fisa.properties.map((p) => (
          <section key={p.id} className="dash-card fisa-section">
            <h3>{addressLine(p)}</h3>

            {p.equipments.length === 0 ? (
              <p className="dash-note">Nu sunt echipamente înregistrate pe această adresă.</p>
            ) : (
              p.equipments.map((eq) => {
                // Fallback pentru echipamente fără documente: calculează scadența din install + interval default
                const hasDocs = eq.documents.length > 0
                const computedVerifDue = computeNextDue(
                  eq.installation_date,
                  eq.last_verificare_at,
                  eq.defaultVerificareMonths,
                )
                const computedRevizieDue = computeNextDue(
                  eq.installation_date,
                  eq.last_revizie_at,
                  eq.defaultRevizieMonths,
                )
                const verifDue = eq.next_verificare_due ?? computedVerifDue
                const revizieDue = eq.next_revizie_due ?? computedRevizieDue

                return (
                  <div key={eq.id} className={`fisa-equipment ${!eq.is_active ? "fisa-equipment--inactive" : ""}`}>
                    <div className="fisa-equipment__header">
                      <strong>{eq.typeLabel}</strong>
                      {[eq.brand, eq.model].filter(Boolean).length > 0 && (
                        <span> · {[eq.brand, eq.model].filter(Boolean).join(" ")}</span>
                      )}
                      {eq.serial_number && <span> · S/N <code>{eq.serial_number}</code></span>}
                      {!eq.is_active && <span className="dash-status dash-status--canceled"> dezactivat</span>}
                    </div>

                    <dl className="dash-dl fisa-equipment__dl">
                      <dt>Data instalării</dt>
                      <dd>{fmtDate(eq.installation_date)}</dd>
                      {eq.manufacture_date && (
                        <>
                          <dt>Data fabricație</dt>
                          <dd>{fmtDate(eq.manufacture_date)}</dd>
                        </>
                      )}
                      <dt>Ultima verificare</dt>
                      <dd>{fmtDate(eq.last_verificare_at)}</dd>
                      <dt>Următoarea verificare</dt>
                      <dd>
                        {fmtDate(verifDue)}
                        {!eq.last_verificare_at && verifDue && (
                          <span className="dash-subtle"> (calculat din dată instalare + {eq.defaultVerificareMonths} luni)</span>
                        )}
                      </dd>
                      {(eq.defaultRevizieMonths || eq.last_revizie_at || revizieDue) && (
                        <>
                          <dt>Ultima revizie</dt>
                          <dd>{fmtDate(eq.last_revizie_at)}</dd>
                          <dt>Următoarea revizie</dt>
                          <dd>
                            {fmtDate(revizieDue)}
                            {!eq.last_revizie_at && revizieDue && (
                              <span className="dash-subtle"> (calculat din dată instalare + {eq.defaultRevizieMonths} luni)</span>
                            )}
                          </dd>
                        </>
                      )}
                      {eq.observations && (
                        <>
                          <dt>Observații</dt>
                          <dd>{eq.observations}</dd>
                        </>
                      )}
                    </dl>

                    {hasDocs ? (
                      <div className="fisa-history">
                        <h4>Istoric verificări & revizii</h4>
                        <table className="dash-table">
                          <thead>
                            <tr>
                              <th>Tip</th>
                              <th>Nr. doc</th>
                              <th>Data</th>
                              <th>Valabilitate</th>
                              <th>Tehnician</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {eq.documents.map((d) => (
                              <tr key={d.id} className={d.revoked_at ? "dash-row--inactive" : ""}>
                                <td>{DOC_TYPE_LABELS[d.document_type] ?? d.document_type}</td>
                                <td>
                                  <code>{d.document_number}</code>
                                  {d.file_url && (
                                    <>
                                      {" · "}
                                      <a href={d.file_url} target="_blank" rel="noreferrer">PDF ↗</a>
                                    </>
                                  )}
                                </td>
                                <td>{fmtDate(d.issued_at)}</td>
                                <td>{fmtDate(d.valid_until)}</td>
                                <td>{d.technician ?? "—"}</td>
                                <td>{d.revoked_at ? "REVOCAT" : "activ"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="dash-note">
                        Nu există verificări/revizii înregistrate — scadențele de mai sus sunt calculate
                        automat din data instalării și intervalul default al echipamentului.
                      </p>
                    )}
                  </div>
                )
              })
            )}
          </section>
        ))
      )}
    </div>
  )
}
