// app/dashboard/firma-mea/page.tsx
// Profil firmă — status verificare + date de bază. Editarea în iterație viitoare.
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"

export default async function FirmaMea() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect("/login?redirect=/dashboard/firma-mea")

  const { role, firmId } = await getUserRole(data.user.id)
  if (role !== "firm_owner" || !firmId) {
    return (
      <div className="dash-page">
        <h1 className="dash-title">Firma mea</h1>
        <p className="dash-note">
          Nu ai încă o firmă asociată contului. {" "}
          <Link href="/dashboard/adauga-firma">Adaugă firmă →</Link>
        </p>
      </div>
    )
  }

  const admin = getServiceRoleSupabase()
  const { data: firm } = await admin
    .from("gas_firms")
    .select(
      "id, slug, brand_name, legal_name, cui, anre_authorization_no, anre_category, " +
      "anre_valid_until, verification_status, plan, is_active, sediu_adresa, " +
      "sediu_judet_id, sediu_localitate_id, " +
      "judete:sediu_judet_id(nume), localitati:sediu_localitate_id(nume)",
    )
    .eq("id", firmId)
    .maybeSingle()

  if (!firm) {
    return (
      <div className="dash-page">
        <h1 className="dash-title">Firma mea</h1>
        <p>Firma nu a putut fi încărcată. Contactează administratorul.</p>
      </div>
    )
  }

  const j = (Array.isArray(firm.judete) ? firm.judete[0] : firm.judete) as { nume: string } | null
  const l = (Array.isArray(firm.localitati) ? firm.localitati[0] : firm.localitati) as { nume: string } | null
  const statusLabel: Record<string, string> = {
    pending: "în așteptare",
    approved: "aprobată",
    rejected: "respinsă",
    suspended: "suspendată",
  }

  return (
    <div className="dash-page">
      <h1 className="dash-title">{(firm.brand_name as string) || (firm.legal_name as string)}</h1>

      <section className="dash-card">
        <h2>Status</h2>
        <p>
          Verificare:{" "}
          <strong className={`dash-status dash-status--${firm.verification_status}`}>
            {statusLabel[firm.verification_status as string] ?? (firm.verification_status as string)}
          </strong>
        </p>
        <p>Plan: <strong>{firm.plan as string}</strong></p>
        <p>Activă: <strong>{firm.is_active ? "da" : "nu"}</strong></p>
      </section>

      <section className="dash-card">
        <h2>Date firmă</h2>
        <dl className="dash-dl">
          <dt>Denumire legală</dt><dd>{firm.legal_name as string}</dd>
          {firm.cui && (<><dt>CUI</dt><dd>{firm.cui as string}</dd></>)}
          <dt>Autorizație ANRE</dt>
          <dd>
            {firm.anre_authorization_no ? (
              <>
                <code>{firm.anre_authorization_no as string}</code>
                {firm.anre_category && <> · categoria {firm.anre_category as string}</>}
                {firm.anre_valid_until && <> · valabilă până la {new Date(firm.anre_valid_until as string).toLocaleDateString("ro-RO")}</>}
              </>
            ) : <em>nesetată</em>}
          </dd>
          <dt>Sediu</dt>
          <dd>
            {firm.sediu_adresa && <>{firm.sediu_adresa as string}<br /></>}
            {[l?.nume, j?.nume].filter(Boolean).join(", ") || "—"}
          </dd>
        </dl>
      </section>

      <section className="dash-card">
        <h2>Profil public</h2>
        <p>
          <Link href={`/firme/${firm.slug}`}>Vezi profilul pe site →</Link>
        </p>
        <p>
          <Link href="/dashboard/firma-mea/editeaza" className="dash-btn dash-btn--primary">
            Editează profil
          </Link>
        </p>
      </section>
    </div>
  )
}
