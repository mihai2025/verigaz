"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { ReviziaRow } from "@/lib/reports/revizii"
import { addRevizieManual, deleteRevizie, updateRevizie } from "./actions"

type Filters = {
  search: string
  dateFrom: string
  dateTo: string
  dateMode: "issued" | "expires"
  activeOnly: boolean
}

type SortKey = "doc" | "issued" | "valid" | "address" | "customer" | "technician"
type SortDir = "asc" | "desc"

function addressMultiline(r: ReviziaRow) {
  const line1 = [
    r.address,
    r.blockName && `bl. ${r.blockName}`,
    r.stair && `sc. ${r.stair}`,
    r.floor && `et. ${r.floor}`,
    r.apartment && `ap. ${r.apartment}`,
    r.localitate,
  ].filter(Boolean).join(", ")
  return line1
}

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("ro-RO")
}

function expiringBadge(validUntil: string | null, revokedAt: string | null): { label: string; cls: string } | null {
  if (revokedAt) return { label: "revocat", cls: "revoked" }
  if (!validUntil) return null
  const days = (new Date(validUntil).getTime() - Date.now()) / 86400000
  if (days < 0) return { label: "expirat", cls: "expired" }
  if (days < 90) return { label: `expiră în ${Math.ceil(days)}z`, cls: "soon" }
  return null
}

export default function ReviziiReport({
  rows,
  initialFilters,
  employees,
  judete,
}: {
  rows: ReviziaRow[]
  initialFilters: Filters
  employees: { id: string; full_name: string }[]
  judete: { id: number; nume: string }[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [sortKey, setSortKey] = useState<SortKey>("issued")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  function applyFilters() {
    const params = new URLSearchParams()
    if (filters.search) params.set("q", filters.search)
    if (filters.dateFrom) params.set("from", filters.dateFrom)
    if (filters.dateTo) params.set("to", filters.dateTo)
    if (filters.dateMode !== "issued") params.set("mode", filters.dateMode)
    if (filters.activeOnly) params.set("active", "1")
    router.push(`/dashboard/rapoarte/revizii?${params.toString()}`)
  }

  function clearFilters() {
    setFilters({ search: "", dateFrom: "", dateTo: "", dateMode: "issued", activeOnly: false })
    router.push("/dashboard/rapoarte/revizii")
  }

  const sorted = useMemo(() => {
    const arr = [...rows]
    arr.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1
      const get = (r: ReviziaRow): string => {
        switch (sortKey) {
          case "doc": return r.documentNumber
          case "issued": return r.issuedAt
          case "valid": return r.validUntil ?? ""
          case "address": return addressMultiline(r)
          case "customer": return r.customerFullName
          case "technician": return r.technician ?? ""
        }
      }
      const va = get(a), vb = get(b)
      return va < vb ? -dir : va > vb ? dir : 0
    })
    return arr
  }, [rows, sortKey, sortDir])

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc")
    else { setSortKey(k); setSortDir("asc") }
  }

  function sortArrow(k: SortKey) {
    if (sortKey !== k) return <span className="report-sort-arrow">⇅</span>
    return <span className="report-sort-arrow report-sort-arrow--active">{sortDir === "asc" ? "↑" : "↓"}</span>
  }

  function run(promise: Promise<{ ok: boolean; error?: string }>, onOk?: () => void) {
    startTransition(async () => {
      setError(null)
      const res = await promise
      if (!res.ok) setError(res.error ?? "Eroare.")
      else { onOk?.(); router.refresh() }
    })
  }

  function onDelete(r: ReviziaRow) {
    const reason = prompt(`Șterge revizia ${r.documentNumber}? Motiv (opțional):`)
    if (reason === null) return
    run(deleteRevizie(r.documentId, reason))
  }

  function onSaveEdit(e: React.FormEvent<HTMLFormElement>, documentId: string) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    run(updateRevizie(documentId, fd), () => setEditingId(null))
  }

  function onAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    run(addRevizieManual(fd), () => {
      setShowAdd(false)
      e.currentTarget.reset()
    })
  }

  function exportExcel() {
    const params = new URLSearchParams()
    if (filters.search) params.set("q", filters.search)
    if (filters.dateFrom) params.set("from", filters.dateFrom)
    if (filters.dateTo) params.set("to", filters.dateTo)
    if (filters.dateMode !== "issued") params.set("mode", filters.dateMode)
    if (filters.activeOnly) params.set("active", "1")
    window.open(`/api/export/revizii?${params.toString()}`, "_blank")
  }

  return (
    <div className="dash-page report-page">
      <header className="report-header">
        <div>
          <h1 className="dash-title">Raport revizii (cadenţă 10 ani)</h1>
          <p className="dash-subtle">{sorted.length} înregistrări afișate</p>
        </div>
        <div className="report-actions no-print">
          <button type="button" onClick={() => window.print()} className="dash-btn dash-btn--ghost">
            🖨 Print
          </button>
          <button type="button" onClick={exportExcel} className="dash-btn dash-btn--ghost">
            ⬇ Excel
          </button>
          <button type="button" onClick={() => setShowAdd((v) => !v)} className="dash-btn dash-btn--primary">
            {showAdd ? "Anulează" : "+ Adaugă revizie"}
          </button>
        </div>
      </header>

      {error && <div className="auth-error" role="alert">{error}</div>}

      {/* ─── FILTRE ─────────────────────────────────────────── */}
      <section className="report-filters no-print">
        <input
          type="text"
          placeholder="Caută: document, adresă, nume, telefon, observații…"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          className="report-search"
        />
        <div className="report-daterange">
          <label>
            <span>De la</span>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
          </label>
          <label>
            <span>Până la</span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            />
          </label>
        </div>
        <fieldset className="report-mode">
          <label>
            <input
              type="radio"
              name="mode"
              checked={filters.dateMode === "issued"}
              onChange={() => setFilters({ ...filters, dateMode: "issued" })}
            />
            <span>efectuate în perioadă</span>
          </label>
          <label>
            <input
              type="radio"
              name="mode"
              checked={filters.dateMode === "expires"}
              onChange={() => setFilters({ ...filters, dateMode: "expires" })}
            />
            <span>expiră în perioadă</span>
          </label>
        </fieldset>
        <label className="report-active">
          <input
            type="checkbox"
            checked={filters.activeOnly}
            onChange={(e) => setFilters({ ...filters, activeOnly: e.target.checked })}
          />
          <span>doar active (exclud revocate)</span>
        </label>
        <div className="report-filter-actions">
          <button type="button" className="dash-btn dash-btn--primary" onClick={applyFilters}>
            Aplică
          </button>
          <button type="button" className="dash-btn dash-btn--ghost" onClick={clearFilters}>
            Resetează
          </button>
        </div>
      </section>

      {/* ─── ADAUGĂ ─────────────────────────────────────────── */}
      {showAdd && (
        <section className="dash-card no-print">
          <h2>Adaugă revizie (manual — din dosar hârtie)</h2>
          <form onSubmit={onAdd} className="dash-form">
            <div className="booking-row">
              <label className="dash-field">
                <span>Nr. document *</span>
                <input name="document_number" required maxLength={40} />
              </label>
              <label className="dash-field">
                <span>Data reviziei *</span>
                <input name="issued_at" type="date" required />
              </label>
              <label className="dash-field">
                <span>Tehnician</span>
                <select name="technician_id" defaultValue="">
                  <option value="">— alege —</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.full_name}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="booking-row">
              <label className="dash-field">
                <span>Nume client *</span>
                <input name="customer_name" required maxLength={120} />
              </label>
              <label className="dash-field">
                <span>Telefon *</span>
                <input name="customer_phone" required maxLength={30} type="tel" />
              </label>
              <label className="dash-field">
                <span>Email</span>
                <input name="customer_email" maxLength={120} type="email" />
              </label>
            </div>
            <div className="booking-row">
              <label className="dash-field">
                <span>Județ</span>
                <select name="judet_id" defaultValue="">
                  <option value="">—</option>
                  {judete.map((j) => (
                    <option key={j.id} value={j.id}>{j.nume}</option>
                  ))}
                </select>
              </label>
              <label className="dash-field">
                <span>Adresă (stradă + nr.) *</span>
                <input name="address" required maxLength={200} />
              </label>
              <label className="dash-field">
                <span>Bloc</span>
                <input name="block_name" maxLength={40} />
              </label>
              <label className="dash-field">
                <span>Ap.</span>
                <input name="apartment" maxLength={10} />
              </label>
            </div>
            <label className="dash-field">
              <span>Observații</span>
              <textarea name="observations" rows={2} maxLength={500} />
            </label>
            <button type="submit" disabled={pending} className="dash-btn dash-btn--primary">
              {pending ? "Se salvează…" : "Adaugă revizie"}
            </button>
          </form>
        </section>
      )}

      {/* ─── TABEL ──────────────────────────────────────────── */}
      {sorted.length === 0 ? (
        <p className="dash-note">Nicio revizie găsită.</p>
      ) : (
        <div className="report-table-wrap">
          <table className="report-table">
            <thead>
              <tr>
                <th><button type="button" onClick={() => toggleSort("doc")}>Document {sortArrow("doc")}</button></th>
                <th><button type="button" onClick={() => toggleSort("address")}>Adresă + client {sortArrow("address")}</button></th>
                <th><button type="button" onClick={() => toggleSort("issued")}>Data revizie / Valabilitate {sortArrow("issued")}</button></th>
                <th><button type="button" onClick={() => toggleSort("technician")}>Tehnician {sortArrow("technician")}</button></th>
                <th>Observații</th>
                <th className="no-print">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => {
                const badge = expiringBadge(r.validUntil, r.revokedAt)
                const isEditing = editingId === r.documentId
                return (
                  <>
                    <tr key={r.documentId} className={r.revokedAt ? "report-row--revoked" : ""}>
                      <td>
                        <code>{r.documentNumber}</code>
                        {r.fileUrl && (
                          <div className="report-cell-sub">
                            <a href={r.fileUrl} target="_blank" rel="noreferrer">PDF ↗</a>
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="report-addr">{addressMultiline(r)}</div>
                        <div className="report-customer">
                          <strong>{r.customerFullName}</strong> · <a href={`tel:${r.customerPhone}`}>{r.customerPhone}</a>
                        </div>
                      </td>
                      <td>
                        <div>Revizie: <strong>{formatDate(r.issuedAt)}</strong></div>
                        <div>Expiră: {formatDate(r.validUntil)}</div>
                        {r.retea_installation_date && (
                          <div className="report-cell-sub">
                            Instalare rețea: {formatDate(r.retea_installation_date)}
                          </div>
                        )}
                        {badge && <span className={`report-badge report-badge--${badge.cls}`}>{badge.label}</span>}
                      </td>
                      <td>{r.technician ?? "—"}</td>
                      <td>{r.observations ?? "—"}</td>
                      <td className="no-print">
                        <div className="report-row-actions">
                          <button
                            type="button"
                            disabled={pending}
                            className="dash-btn dash-btn--ghost"
                            onClick={() => setEditingId(isEditing ? null : r.documentId)}
                          >
                            {isEditing ? "Anulează" : "Edit"}
                          </button>
                          {!r.revokedAt && (
                            <button
                              type="button"
                              disabled={pending}
                              className="dash-btn dash-btn--ghost"
                              onClick={() => onDelete(r)}
                            >
                              Șterge
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isEditing && (
                      <tr className="no-print">
                        <td colSpan={6}>
                          <form
                            onSubmit={(ev) => onSaveEdit(ev, r.documentId)}
                            className="dash-form report-edit-form"
                          >
                            <div className="booking-row">
                              <label className="dash-field">
                                <span>Data reviziei</span>
                                <input name="issued_at" type="date" defaultValue={r.issuedAt.slice(0, 10)} />
                              </label>
                              <label className="dash-field">
                                <span>Valabilitate (expiră)</span>
                                <input name="valid_until" type="date" defaultValue={r.validUntil?.slice(0, 10) ?? ""} />
                              </label>
                              <label className="dash-field">
                                <span>Tehnician</span>
                                <select name="technician_id" defaultValue="">
                                  <option value="">— nu schimba —</option>
                                  {employees.map((e) => (
                                    <option key={e.id} value={e.id}>{e.full_name}</option>
                                  ))}
                                </select>
                              </label>
                            </div>
                            <label className="dash-field">
                              <span>Observații</span>
                              <textarea
                                name="observations"
                                rows={2}
                                defaultValue={r.observations ?? ""}
                                maxLength={500}
                              />
                            </label>
                            <button type="submit" disabled={pending} className="dash-btn dash-btn--primary">
                              {pending ? "Se salvează…" : "Salvează"}
                            </button>
                          </form>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
