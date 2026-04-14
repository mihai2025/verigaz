// app/programare/[ref]/page.tsx
// Confirmare programare — pagina publică accesată via public_ref generat la submit.
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getServiceRoleSupabase } from "@/lib/supabase/server"

type Params = { ref: string }

export const metadata: Metadata = {
  title: "Programare trimisă — verigaz",
  description: "Cererea ta a fost trimisă firmei. Urmează confirmarea.",
  robots: { index: false, follow: false },
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { ref } = await params
  const admin = getServiceRoleSupabase()
  const { data: booking } = await admin
    .from("bookings")
    .select(
      "public_ref, status, preferred_date, preferred_time_window, created_at, notes_customer, " +
      "customers(full_name, phone, email), " +
      "service_categories(nume), " +
      "gas_firms(slug, brand_name, legal_name, phone), " +
      "properties(address, block_name, apartment, judete:judet_id(nume), localitati:localitate_id(nume))",
    )
    .eq("public_ref", ref)
    .maybeSingle()

  if (!booking) notFound()

  const c = Array.isArray(booking.customers) ? booking.customers[0] : booking.customers
  const sc = Array.isArray(booking.service_categories) ? booking.service_categories[0] : booking.service_categories
  const f = Array.isArray(booking.gas_firms) ? booking.gas_firms[0] : booking.gas_firms
  const p = Array.isArray(booking.properties) ? booking.properties[0] : booking.properties

  const timeWindowLabels: Record<string, string> = {
    dimineata: "Dimineața (8–12)",
    pranz: "Prânz (12–14)",
    "dupa-amiaza": "După-amiaza (14–18)",
    seara: "Seara (18–20)",
  }

  return (
    <div className="booking-confirmation container">
      <header className="booking-hero">
        <div className="booking-check" aria-hidden="true">✓</div>
        <h1 className="booking-title">Cererea a fost trimisă</h1>
        <p className="booking-lead">
          Număr de referință: <code className="booking-ref">{booking.public_ref}</code>
        </p>
        <p className="booking-lead">
          Firma te contactează pentru confirmare, de obicei în 24h.
          Te rugăm să răspunzi la telefon când te sună.
        </p>
      </header>

      <section className="booking-card">
        <h2>Rezumat programare</h2>
        <dl className="booking-dl">
          <dt>Serviciu</dt><dd>{sc?.nume ?? "—"}</dd>
          <dt>Firma</dt>
          <dd>
            {f ? (
              <Link href={`/firme/${f.slug}`}>{f.brand_name || f.legal_name}</Link>
            ) : "—"}
            {f?.phone && <div className="dash-subtle">Tel. firmă: <a href={`tel:${f.phone}`}>{f.phone}</a></div>}
          </dd>
          <dt>Adresă</dt>
          <dd>
            {p?.address}
            {p?.block_name && <>, bl. {p.block_name}</>}
            {p?.apartment && <>, ap. {p.apartment}</>}
            {p && (
              <div className="dash-subtle">
                {[p.localitati?.nume, p.judete?.nume].filter(Boolean).join(", ")}
              </div>
            )}
          </dd>
          <dt>Data preferată</dt>
          <dd>
            {booking.preferred_date
              ? new Date(booking.preferred_date).toLocaleDateString("ro-RO")
              : "flexibil"}
            {booking.preferred_time_window && (
              <> · {timeWindowLabels[booking.preferred_time_window] ?? booking.preferred_time_window}</>
            )}
          </dd>
          <dt>Client</dt>
          <dd>
            {c?.full_name}
            {c?.phone && <div className="dash-subtle">{c.phone}</div>}
            {c?.email && <div className="dash-subtle">{c.email}</div>}
          </dd>
          {booking.notes_customer && (
            <>
              <dt>Observații</dt>
              <dd>{booking.notes_customer}</dd>
            </>
          )}
        </dl>
      </section>

      <section className="booking-card booking-next">
        <h2>Ce urmează</h2>
        <ol>
          <li>Firma primește notificare imediat și te contactează.</li>
          <li>Confirmi ora exactă și orice detaliu tehnic suplimentar.</li>
          <li>
            După intervenție primești <strong>certificat digital</strong> și ți se programează
            automat <strong>reminder-ul următoarei scadențe</strong> (verificare: 24 luni,
            revizie: 120 luni).
          </li>
        </ol>
      </section>

      <div className="booking-actions">
        <Link href="/" className="dash-btn dash-btn--ghost">Pagina principală</Link>
        <Link href="/servicii-gaze" className="dash-btn dash-btn--ghost">Alte firme</Link>
      </div>
    </div>
  )
}
