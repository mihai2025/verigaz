// app/dashboard/notificari/page.tsx
// Log notificări trimise de firmă + status per reminder.
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"

type Props = { searchParams: Promise<{ status?: string }> }
const STATUS_TABS = ["all", "sent", "queued", "converted", "failed", "skipped"] as const

const TYPE_LABELS: Record<string, string> = {
  verificare_24m: "Verificare gaze 2 ani",
  revizie_120m: "Revizie gaze 10 ani",
  service_detector_12m: "Service detector",
  iscir_centrala: "VTP centrală termică",
  contract_service: "Contract service",
}

function statusBadge(status: string, responded: boolean) {
  if (status === "converted" || responded) {
    return <span className="bullet bullet--done" title="Client a răspuns / verificare efectuată">✓</span>
  }
  if (status === "sent") {
    return <span className="bullet bullet--sent" title="Notificare trimisă — așteptăm verificare">●</span>
  }
  if (status === "queued") {
    return <span className="bullet bullet--queued" title="Programat — nu s-a trimis încă">○</span>
  }
  if (status === "failed") {
    return <span className="bullet bullet--failed" title="Eșec la trimitere">✗</span>
  }
  return <span className="bullet bullet--other">·</span>
}

export default async function Page({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: u } = await supabase.auth.getUser()
  if (!u.user) redirect("/login?redirect=/dashboard/notificari")

  const { role, firmId } = await getUserRole(u.user.id)
  if (role !== "firm_owner" || !firmId) {
    return (
      <div className="dash-page">
        <h1 className="dash-title">Notificări</h1>
        <p className="dash-note">
          Doar firmele pot vedea log-ul de notificări.{" "}
          <Link href="/dashboard/adauga-firma">Adaugă firmă →</Link>
        </p>
      </div>
    )
  }

  const sp = await searchParams
  const status = (STATUS_TABS as readonly string[]).includes(sp.status ?? "")
    ? (sp.status as string)
    : "all"

  const admin = getServiceRoleSupabase()
  let query = admin
    .from("reminders")
    .select(
      "id, reminder_type, status, channel, scheduled_for, advance_days, sent_at, " +
      "response_at, response_booking_id, error_message, template_used, created_at, " +
      "customers(full_name, phone, email), " +
      "properties(address, block_name, apartment, " +
      "  judete:judet_id(nume), localitati:localitate_id(nume))",
    )
    .eq("firm_id", firmId)
    .order("created_at", { ascending: false })
    .limit(200)
  if (status !== "all") query = query.eq("status", status)

  const { data } = await query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[]

  // KPIs
  const counts = {
    total: rows.length,
    sent: rows.filter((r) => r.status === "sent").length,
    queued: rows.filter((r) => r.status === "queued").length,
    converted: rows.filter((r) => r.status === "converted").length,
    failed: rows.filter((r) => r.status === "failed").length,
  }

  return (
    <div className="dash-page">
      <h1 className="dash-title">Notificări</h1>

      <div className="dash-kpis">
        <div className="dash-kpi">
          <div className="dash-kpi__label">Programate</div>
          <div className="dash-kpi__value">{counts.queued}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi__label">Trimise, în așteptare</div>
          <div className="dash-kpi__value">{counts.sent}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi__label">Convertite</div>
          <div className="dash-kpi__value">{counts.converted}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi__label">Eșuate</div>
          <div className="dash-kpi__value">{counts.failed}</div>
        </div>
      </div>

      <nav className="dash-tabs">
        {STATUS_TABS.map((s) => (
          <Link
            key={s}
            href={`/dashboard/notificari?status=${s}`}
            className={`dash-tab ${status === s ? "dash-tab--active" : ""}`}
          >
            {s}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <p className="dash-note">Nicio notificare pentru status „{status}".</p>
      ) : (
        <table className="dash-table">
          <thead>
            <tr>
              <th></th>
              <th>Tip</th>
              <th>Client</th>
              <th>Adresă</th>
              <th>Programat</th>
              <th>Trimis</th>
              <th>Răspuns</th>
              <th>Canal</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const c = Array.isArray(r.customers) ? r.customers[0] : r.customers
              const p = Array.isArray(r.properties) ? r.properties[0] : r.properties
              const geo = p ? [p.localitati?.nume, p.judete?.nume].filter(Boolean).join(", ") : ""
              return (
                <tr key={r.id}>
                  <td>{statusBadge(r.status, !!r.response_booking_id)}</td>
                  <td>{TYPE_LABELS[r.reminder_type] ?? r.reminder_type}</td>
                  <td>
                    {c?.full_name ?? "—"}
                    {c?.phone && <div className="dash-subtle">{c.phone}</div>}
                  </td>
                  <td>
                    {p?.address ?? "—"}
                    {p?.block_name && <>, bl. {p.block_name}</>}
                    {p?.apartment && <>, ap. {p.apartment}</>}
                    {geo && <div className="dash-subtle">{geo}</div>}
                  </td>
                  <td>
                    {r.scheduled_for ? new Date(r.scheduled_for).toLocaleString("ro-RO") : "—"}
                    {r.advance_days != null && (
                      <div className="dash-subtle">cu {r.advance_days} zile înainte</div>
                    )}
                  </td>
                  <td>
                    {r.sent_at ? new Date(r.sent_at).toLocaleString("ro-RO") : "—"}
                    {r.error_message && (
                      <div className="dash-subtle" style={{ color: "#c00" }}>
                        {r.error_message}
                      </div>
                    )}
                  </td>
                  <td>
                    {r.response_at ? (
                      <>
                        {new Date(r.response_at).toLocaleDateString("ro-RO")}
                        {r.response_booking_id && (
                          <div className="dash-subtle">→ booking</div>
                        )}
                      </>
                    ) : "—"}
                  </td>
                  <td>{r.channel}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
