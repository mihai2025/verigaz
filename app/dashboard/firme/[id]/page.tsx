// app/dashboard/firme/[id]/page.tsx
// Detaliu firmă pentru admin: KYB data + documente + acțiuni moderation.
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import FirmModerationActions from "./FirmModerationActions"

type Params = { id: string }

export default async function Page({ params }: { params: Promise<Params> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: u } = await supabase.auth.getUser()
  if (!u.user) redirect(`/login?redirect=/dashboard/firme/${id}`)

  const { role } = await getUserRole(u.user.id)
  if (role !== "admin") redirect("/dashboard")

  const admin = getServiceRoleSupabase()
  const [firmRes, docsRes, auditRes] = await Promise.all([
    admin
      .from("gas_firms")
      .select(
        "id, slug, brand_name, legal_name, cui, registration_no, plan, " +
        "anre_authorization_no, anre_category, anre_valid_until, " +
        "iscir_authorization_no, iscir_valid_until, " +
        "verification_status, verified_at, verified_by, rejection_reason, " +
        "short_description, description, phone, email, website, " +
        "contact_person_name, contact_person_role, contact_person_phone, " +
        "sediu_adresa, is_active, owner_user_id, created_at, " +
        "judete:sediu_judet_id(nume), localitati:sediu_localitate_id(nume)",
      )
      .eq("id", id)
      .maybeSingle(),
    admin
      .from("firm_documents")
      .select("id, document_type, file_url, file_name, valid_until, uploaded_at, verified_at")
      .eq("firm_id", id)
      .order("uploaded_at", { ascending: false }),
    admin
      .from("audit_log")
      .select("id, action, summary, created_at, actor_user_id")
      .eq("entity_type", "gas_firms")
      .eq("entity_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
  ])

  const firm = firmRes.data
  if (!firm) notFound()

  const j = (Array.isArray(firm.judete) ? firm.judete[0] : firm.judete) as { nume: string } | null
  const l = (Array.isArray(firm.localitati) ? firm.localitati[0] : firm.localitati) as { nume: string } | null

  const docs = (docsRes.data ?? []) as unknown as Array<{
    id: string
    document_type: string
    file_url: string
    file_name: string | null
    valid_until: string | null
    uploaded_at: string
    verified_at: string | null
  }>
  const audits = (auditRes.data ?? []) as unknown as Array<{
    id: string
    action: string
    summary: string | null
    created_at: string
    actor_user_id: string | null
  }>

  return (
    <div className="dash-page">
      <nav className="sv-breadcrumb" aria-label="Navigare">
        <Link href="/dashboard/firme">Firme</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{firm.brand_name || firm.legal_name}</span>
      </nav>

      <h1 className="dash-title">
        {firm.brand_name || firm.legal_name}
        <span className={`dash-status dash-status--${firm.verification_status}`}>
          {firm.verification_status as string}
        </span>
      </h1>

      <section className="dash-card">
        <h2>KYB — identificare firmă</h2>
        <dl className="dash-dl">
          <dt>Denumire legală</dt><dd>{firm.legal_name as string}</dd>
          <dt>CUI</dt><dd>{firm.cui ?? "—"}</dd>
          <dt>Nr. registru comerț</dt><dd>{firm.registration_no ?? "—"}</dd>
          <dt>Autorizație ANRE</dt>
          <dd>
            {firm.anre_authorization_no ?? "—"}
            {firm.anre_category && <> · {firm.anre_category as string}</>}
            {firm.anre_valid_until && <> · valabilă până la {new Date(firm.anre_valid_until as string).toLocaleDateString("ro-RO")}</>}
          </dd>
          <dt>Autorizație ISCIR</dt>
          <dd>
            {firm.iscir_authorization_no ?? "—"}
            {firm.iscir_valid_until && <> · valabilă până la {new Date(firm.iscir_valid_until as string).toLocaleDateString("ro-RO")}</>}
          </dd>
          <dt>Sediu</dt>
          <dd>
            {firm.sediu_adresa && <>{firm.sediu_adresa as string}<br /></>}
            {[l?.nume, j?.nume].filter(Boolean).join(", ") || "—"}
          </dd>
          <dt>Creat</dt>
          <dd>{new Date(firm.created_at as string).toLocaleString("ro-RO")}</dd>
          {firm.verified_at && (<><dt>Verificat la</dt><dd>{new Date(firm.verified_at as string).toLocaleString("ro-RO")}</dd></>)}
          {firm.rejection_reason && (<><dt>Motiv respingere</dt><dd>{firm.rejection_reason as string}</dd></>)}
        </dl>
      </section>

      <section className="dash-card">
        <h2>Contact</h2>
        <dl className="dash-dl">
          <dt>Telefon</dt><dd>{firm.phone ?? "—"}</dd>
          <dt>Email</dt><dd>{firm.email ?? "—"}</dd>
          <dt>Website</dt><dd>{firm.website ? <a href={firm.website as string} target="_blank" rel="noreferrer">{firm.website as string}</a> : "—"}</dd>
          <dt>Persoană responsabilă</dt>
          <dd>
            {firm.contact_person_name
              ? <>
                  {firm.contact_person_name as string}
                  {firm.contact_person_role && <> · {firm.contact_person_role as string}</>}
                  {firm.contact_person_phone && <> · {firm.contact_person_phone as string}</>}
                </>
              : "—"}
          </dd>
        </dl>
      </section>

      <section className="dash-card">
        <h2>Documente încărcate ({docs.length})</h2>
        {docs.length === 0 ? (
          <p className="dash-note">Firma nu a încărcat documente încă.</p>
        ) : (
          <ul className="dash-list">
            {docs.map((d) => (
              <li key={d.id}>
                <a href={d.file_url} target="_blank" rel="noreferrer">
                  {d.document_type} — {d.file_name ?? "fișier"}
                </a>
                <span className="dash-subtle">
                  {" · încărcat "}
                  {new Date(d.uploaded_at).toLocaleDateString("ro-RO")}
                  {d.valid_until && <> · val. {new Date(d.valid_until).toLocaleDateString("ro-RO")}</>}
                  {d.verified_at && " · verificat ✓"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <FirmModerationActions
        firmId={firm.id as string}
        status={firm.verification_status as string}
        isActive={firm.is_active as boolean}
      />

      <section className="dash-card">
        <h2>Istoric audit</h2>
        {audits.length === 0 ? (
          <p className="dash-note">Nicio acțiune înregistrată.</p>
        ) : (
          <ul className="dash-list">
            {audits.map((a) => (
              <li key={a.id}>
                <code>{a.action}</code>
                {a.summary && <> — {a.summary}</>}
                <span className="dash-subtle"> · {new Date(a.created_at).toLocaleString("ro-RO")}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
