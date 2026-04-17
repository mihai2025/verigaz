"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { TehnicianBookingRow } from "@/lib/reports/tehnicieni"
import DateInput from "@/components/ui/DateInput"

type Filters = {
  tech: string          // "" = all, "unassigned" = neasignate, uuid = specific
  dateFrom: string
  dateTo: string
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("ro-RO")
}
function dayKey(b: TehnicianBookingRow): string {
  const iso = b.scheduledStart ?? b.preferredDate
  if (!iso) return "fara-data"
  return iso.slice(0, 10)
}
function formatDay(key: string): string {
  if (key === "fara-data") return "Fără dată programată"
  const d = new Date(key)
  return d.toLocaleDateString("ro-RO", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })
}

export default function TehnicieniReport({
  bookings,
  employees,
  initialFilters,
}: {
  bookings: TehnicianBookingRow[]
  employees: { id: string; full_name: string; role: string | null }[]
  initialFilters: Filters
}) {
  const router = useRouter()
  const [filters, setFilters] = useState<Filters>(initialFilters)

  function applyFilters() {
    const p = new URLSearchParams()
    if (filters.tech) p.set("tech", filters.tech)
    if (filters.dateFrom) p.set("from", filters.dateFrom)
    if (filters.dateTo) p.set("to", filters.dateTo)
    router.push(`/dashboard/rapoarte/tehnicieni?${p.toString()}`)
  }

  function clearFilters() {
    setFilters({ tech: "", dateFrom: "", dateTo: "" })
    router.push("/dashboard/rapoarte/tehnicieni")
  }

  function exportPdf() {
    const p = new URLSearchParams()
    if (filters.tech) p.set("tech", filters.tech)
    if (filters.dateFrom) p.set("from", filters.dateFrom)
    if (filters.dateTo) p.set("to", filters.dateTo)
    window.open(`/api/export/foaie-tehnician?${p.toString()}`, "_blank")
  }

  // Group bookings by day
  const grouped = useMemo(() => {
    const m = new Map<string, TehnicianBookingRow[]>()
    for (const b of bookings) {
      const k = dayKey(b)
      if (!m.has(k)) m.set(k, [])
      m.get(k)!.push(b)
    }
    // sortează zilele
    return [...m.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  }, [bookings])

  const techLabel =
    filters.tech === "" ? "toți tehnicienii"
    : filters.tech === "unassigned" ? "programări neasignate"
    : employees.find((e) => e.id === filters.tech)?.full_name ?? "tehnician necunoscut"

  return (
    <div className="dash-page report-page">
      <header className="report-header">
        <div>
          <h1 className="dash-title">Raport tehnicieni</h1>
          <p className="dash-subtle">
            {bookings.length} programări · {techLabel}
          </p>
        </div>
        <div className="report-actions no-print">
          <button type="button" onClick={() => window.print()} className="dash-btn dash-btn--ghost">
            🖨 Print
          </button>
          <button type="button" onClick={exportPdf} className="dash-btn dash-btn--primary">
            ⬇ Foaie tehnician PDF
          </button>
        </div>
      </header>

      <section className="report-filters no-print">
        <label className="dash-field">
          <span>Tehnician</span>
          <select
            value={filters.tech}
            onChange={(e) => setFilters({ ...filters, tech: e.target.value })}
          >
            <option value="">Toți tehnicienii</option>
            <option value="unassigned">— neasignate —</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.full_name}{e.role ? ` (${e.role})` : ""}
              </option>
            ))}
          </select>
        </label>
        <div className="report-daterange">
          <label>
            <span>De la</span>
            <DateInput
              value={filters.dateFrom}
              onChange={(iso) => setFilters({ ...filters, dateFrom: iso })}
            />
          </label>
          <label>
            <span>Până la</span>
            <DateInput
              value={filters.dateTo}
              onChange={(iso) => setFilters({ ...filters, dateTo: iso })}
            />
          </label>
        </div>
        <div className="report-filter-actions">
          <button type="button" className="dash-btn dash-btn--primary" onClick={applyFilters}>
            Aplică
          </button>
          <button type="button" className="dash-btn dash-btn--ghost" onClick={clearFilters}>
            Resetează
          </button>
        </div>
      </section>

      {grouped.length === 0 ? (
        <p className="dash-note">Nicio programare pentru filtrul selectat.</p>
      ) : (
        grouped.map(([day, items]) => (
          <section key={day} className="dash-card">
            <h2 className="dash-day-header">📅 {formatDay(day)} <span className="dash-subtle">· {items.length} programări</span></h2>
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Ora</th>
                  <th>Ref.</th>
                  <th>Client</th>
                  <th>Serviciu</th>
                  <th>Adresă</th>
                  <th>Echipament</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((b) => {
                  const time = b.scheduledStart
                    ? new Date(b.scheduledStart).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })
                    : (b.preferredTimeWindow ?? "—")
                  const addr = [
                    b.address,
                    b.blockName && `bl. ${b.blockName}`,
                    b.apartment && `ap. ${b.apartment}`,
                    b.localitate,
                  ].filter(Boolean).join(", ")
                  return (
                    <tr key={b.bookingId}>
                      <td><strong>{time}</strong></td>
                      <td><code>{b.publicRef}</code></td>
                      <td>
                        {b.customerFullName}
                        <div className="dash-subtle"><a href={`tel:${b.customerPhone}`}>{b.customerPhone}</a></div>
                      </td>
                      <td>{b.serviceCategoryName ?? "—"}</td>
                      <td>{addr || "—"}</td>
                      <td>{b.equipmentInfo ?? "—"}</td>
                      <td><span className={`dash-status dash-status--${b.status}`}>{b.status}</span></td>
                      <td>
                        <Link href={`/dashboard/programari/${b.bookingId}`} className="dash-btn dash-btn--ghost">
                          Detalii
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>
        ))
      )}
    </div>
  )
}
