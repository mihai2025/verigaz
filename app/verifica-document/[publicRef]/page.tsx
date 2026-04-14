// app/verifica-document/[publicRef]/page.tsx
// Verificare publică a autenticității unui document emis pe verigaz.
// Accesat prin scanarea QR-code-ului de pe PDF.
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getServiceRoleSupabase } from "@/lib/supabase/server"

type Params = { publicRef: string }

const TYPE_LABELS: Record<string, string> = {
  certificat_verificare: "Certificat verificare instalație gaze",
  proces_verbal_revizie: "Proces-verbal revizie instalație gaze",
  certificat_conformitate: "Certificat conformitate",
  fisa_tehnica_centrala: "Fișă tehnică centrală termică",
  declaratie_detector: "Declarație detector gaze",
  anexa_fotografii: "Anexă fotografii",
}

export const metadata: Metadata = {
  title: "Verificare autenticitate document — verigaz",
  description: "Verifică autenticitatea unui document emis pe verigaz.",
  robots: { index: false, follow: false },
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { publicRef } = await params
  const admin = getServiceRoleSupabase()
  const { data: doc } = await admin
    .from("documents")
    .select(
      "id, document_type, document_number, issued_at, valid_from, valid_until, " +
      "revoked_at, revoked_reason, sha256_hash, file_url, signed_status, " +
      "gas_firms(slug, brand_name, legal_name, anre_authorization_no), " +
      "customers(full_name), " +
      "properties(address, block_name, apartment, judete:judet_id(nume), localitati:localitate_id(nume))",
    )
    .eq("public_ref", publicRef)
    .maybeSingle()

  if (!doc) notFound()

  const f = Array.isArray(doc.gas_firms) ? doc.gas_firms[0] : doc.gas_firms
  const c = Array.isArray(doc.customers) ? doc.customers[0] : doc.customers
  const p = Array.isArray(doc.properties) ? doc.properties[0] : doc.properties

  const now = new Date()
  const validUntil = doc.valid_until ? new Date(doc.valid_until as string) : null
  const revoked = !!doc.revoked_at
  const expired = validUntil ? validUntil < now : false
  const valid = !revoked && !expired

  return (
    <div className="verify-page container">
      <header className="verify-hero">
        <div className={`verify-badge ${revoked ? "verify-badge--revoked" : expired ? "verify-badge--expired" : "verify-badge--valid"}`}>
          {revoked ? "REVOCAT" : expired ? "EXPIRAT" : "VALID"}
        </div>
        <h1 className="verify-title">
          {TYPE_LABELS[doc.document_type as string] ?? (doc.document_type as string)}
        </h1>
        <p className="verify-ref">
          Ref. <code>{publicRef}</code> · Nr. {doc.document_number as string}
        </p>
      </header>

      <section className="verify-card">
        <h2>Detalii</h2>
        <dl className="verify-dl">
          <dt>Emis de</dt>
          <dd>
            {f ? (
              <Link href={`/firme/${f.slug}`}>{f.brand_name || f.legal_name}</Link>
            ) : "—"}
            {f?.anre_authorization_no && (
              <div className="dash-subtle">Aut. ANRE: <code>{f.anre_authorization_no as string}</code></div>
            )}
          </dd>
          <dt>Emis pentru</dt>
          <dd>{c?.full_name ?? "—"}</dd>
          <dt>Adresă</dt>
          <dd>
            {p
              ? <>
                  {p.address as string}
                  {p.block_name && <>, bl. {p.block_name as string}</>}
                  {p.apartment && <>, ap. {p.apartment as string}</>}
                  <div className="dash-subtle">
                    {[p.localitati?.nume, p.judete?.nume].filter(Boolean).join(", ")}
                  </div>
                </>
              : "—"}
          </dd>
          <dt>Data emiterii</dt>
          <dd>{new Date(doc.issued_at as string).toLocaleDateString("ro-RO")}</dd>
          {validUntil && (
            <>
              <dt>Valabil până la</dt>
              <dd>{validUntil.toLocaleDateString("ro-RO")}</dd>
            </>
          )}
          <dt>Status semnare</dt>
          <dd>{doc.signed_status as string}</dd>
          {revoked && (
            <>
              <dt>Motiv revocare</dt>
              <dd>{doc.revoked_reason ?? "—"}</dd>
            </>
          )}
        </dl>
      </section>

      <section className="verify-card">
        <h2>Integritate fișier</h2>
        <p className="verify-hash">
          SHA-256: <code>{(doc.sha256_hash as string) ?? "—"}</code>
        </p>
        <p className="dash-subtle">
          Dacă descarci PDF-ul și calculezi hash-ul SHA-256, trebuie să se potrivească
          cu cel afișat aici. În caz contrar, fișierul a fost modificat.
        </p>
        {doc.file_url && (
          <p>
            <a href={doc.file_url as string} target="_blank" rel="noreferrer" className="dash-btn dash-btn--primary">
              Descarcă PDF original →
            </a>
          </p>
        )}
      </section>

      {valid ? (
        <p className="verify-note verify-note--valid">
          Document autentic emis prin platforma verigaz.
        </p>
      ) : revoked ? (
        <p className="verify-note verify-note--alert">
          Acest document a fost revocat de firma emitentă și nu mai e valabil.
        </p>
      ) : (
        <p className="verify-note verify-note--alert">
          Documentul și-a depășit valabilitatea. E necesară o nouă verificare/revizie.
        </p>
      )}
    </div>
  )
}
