// app/dashboard/programari/[id]/page.tsx
// Detaliu programare + acțiuni (confirm/reject/complete).
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import BookingActions from "./BookingActions"

type Params = { id: string }

export default async function Page({ params }: { params: Promise<Params> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: u } = await supabase.auth.getUser()
  if (!u.user) redirect(`/login?redirect=/dashboard/programari/${id}`)

  const { role, firmId } = await getUserRole(u.user.id)
  if (role !== "firm_owner" || !firmId) redirect("/dashboard")

  const admin = getServiceRoleSupabase()
  const { data: b } = await admin
    .from("bookings")
    .select(
      "id, public_ref, firm_id, status, preferred_date, preferred_time_window, " +
      "scheduled_start, scheduled_end, price_quoted, price_final, notes_customer, " +
      "notes_internal, source, created_at, confirmed_at, completed_at, cancelled_at, " +
      "cancellation_reason, assigned_team_member_id, " +
      "customers(full_name, phone, email), " +
      "service_categories(slug, nume, descriere), " +
      "properties(address, block_name, stair, apartment, floor, " +
      "judete:judet_id(nume), localitati:localitate_id(nume))",
    )
    .eq("id", id)
    .maybeSingle()

  if (!b || b.firm_id !== firmId) notFound()

  const { data: employees } = await admin
    .from("firm_employees")
    .select("id, full_name")
    .eq("firm_id", firmId)
    .eq("is_active", true)
    .order("full_name")

  const c = Array.isArray(b.customers) ? b.customers[0] : b.customers
  const sc = Array.isArray(b.service_categories) ? b.service_categories[0] : b.service_categories
  const p = Array.isArray(b.properties) ? b.properties[0] : b.properties
  const loc = p ? [p.localitati?.nume, p.judete?.nume].filter(Boolean).join(", ") : ""
  const addressParts = p
    ? [p.address, p.block_name && `bl. ${p.block_name}`, p.stair && `sc. ${p.stair}`, p.apartment && `ap. ${p.apartment}`, p.floor && `et. ${p.floor}`]
        .filter(Boolean)
        .join(", ")
    : "—"

  return (
    <div className="dash-page">
      <nav className="sv-breadcrumb" aria-label="Navigare">
        <Link href="/dashboard/programari">Programări</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{b.public_ref}</span>
      </nav>

      <h1 className="dash-title">
        Programare <code>{b.public_ref}</code>
        <span className={`dash-status dash-status--${b.status}`}>{b.status}</span>
      </h1>

      <section className="dash-card">
        <h2>Client</h2>
        <dl className="dash-dl">
          <dt>Nume</dt><dd>{c?.full_name ?? "—"}</dd>
          <dt>Telefon</dt><dd>{c?.phone ? <a href={`tel:${c.phone}`}>{c.phone}</a> : "—"}</dd>
          <dt>Email</dt><dd>{c?.email ?? "—"}</dd>
        </dl>
      </section>

      <section className="dash-card">
        <h2>Serviciu</h2>
        <p><strong>{sc?.nume ?? "—"}</strong></p>
        {sc?.descriere && <p className="dash-subtle">{sc.descriere}</p>}
      </section>

      <section className="dash-card">
        <h2>Adresă</h2>
        <p>{addressParts}</p>
        {loc && <p className="dash-subtle">{loc}</p>}
      </section>

      <section className="dash-card">
        <h2>Programare</h2>
        <dl className="dash-dl">
          <dt>Data preferată</dt>
          <dd>
            {b.preferred_date ? new Date(b.preferred_date).toLocaleDateString("ro-RO") : "—"}
            {b.preferred_time_window && <> · {b.preferred_time_window}</>}
          </dd>
          <dt>Data programată</dt>
          <dd>{b.scheduled_start ? new Date(b.scheduled_start).toLocaleString("ro-RO") : "—"}</dd>
          <dt>Preț estimat</dt>
          <dd>{b.price_quoted != null ? `${b.price_quoted} lei` : "—"}</dd>
          <dt>Preț final</dt>
          <dd>{b.price_final != null ? `${b.price_final} lei` : "—"}</dd>
          {b.notes_customer && (<><dt>Notă client</dt><dd>{b.notes_customer}</dd></>)}
          {b.cancellation_reason && (<><dt>Motiv anulare</dt><dd>{b.cancellation_reason}</dd></>)}
        </dl>
      </section>

      <BookingActions
        bookingId={b.id}
        status={b.status}
        initialNote={b.notes_internal ?? ""}
        initialScheduled={b.scheduled_start ?? null}
        initialPriceFinal={b.price_final ?? null}
        initialTechnicianId={b.assigned_team_member_id ?? null}
        employees={(employees ?? []) as { id: string; full_name: string }[]}
      />
    </div>
  )
}
