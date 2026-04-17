"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { VerificareRow } from "@/lib/reports/verificari"
import type { EquipmentType } from "@/lib/equipment/catalog"
import { addVerificareManual, deleteVerificare, updateVerificare } from "./actions"
import DateInput from "@/components/ui/DateInput"

type Filters = {
  search: string
  dateFrom: string
  dateTo: string
  dateMode: "issued" | "expires"
  activeOnly: boolean
  docType: "all" | "gaz" | "centrala"
}

type SortKey = "equipment" | "doc" | "issued" | "valid" | "address" | "customer" | "technician"
type SortDir = "asc" | "desc"

function addressMultiline(r: VerificareRow) {
  return [
    r.address,
    r.blockName && `bl. ${r.blockName}`,
    r.stair && `sc. ${r.stair}`,
    r.floor && `et. ${r.floor}`,
    r.apartment && `ap. ${r.apartment}`,
    r.localitate,
  ].filter(Boolean).join(", ")
}

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("ro-RO")
}

function expiringBadge(validUntil: string | null, revokedAt: string | null) {
  if (revokedAt) return { label: "revocat", cls: "revoked" }
  if (!validUntil) return null
  const days = (new Date(validUntil).getTime() - Date.now()) / 86400000
  if (days < 0) return { label: "expirat", cls: "expired" }
  if (days < 90) return { label: `expiră în ${Math.ceil(days)}z`, cls: "soon" }
  return null
}

export default function VerificariReport({
  rows,
  initialFilters,
  employees,
  judete,
  catalog,
}: {
  rows: VerificareRow[]
  initialFilters: Filters
  employees: { id: string; full_name: string }[]
  judete: { id: number; nume: string }[]
  catalog: EquipmentType[]
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
    const p = new URLSearchParams()
    if (filters.search) p.set("q", filters.search)
    if (filters.dateFrom) p.set("from", filters.dateFrom)
    if (filters.dateTo) p.set("to", filters.dateTo)
    if (filters.dateMode !== "issued") p.set("mode", filters.dateMode)
    if (filters.activeOnly) p.set("active", "1")
    if (filters.docType !== "all") p.set("type", filters.docType)
    router.push(`/dashboard/rapoarte/verificari?${p.toString()}`)
  }

  function clearFilters() {
    setFilters({ search: "", dateFrom: "", dateTo: "", dateMode: "issued", activeOnly: false, docType: "all" })
    router.push("/dashboard/rapoarte/verificari")
  }

  const sorted = useMemo(() => {
    const arr = [...rows]
    arr.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1
      const get = (r: VerificareRow): string => {
        switch (sortKey) {
          case "equipment": return [r.equipmentTypeName, r.equipmentBrand, r.equipmentModel].filter(Boolean).join(" ")
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

  function exportExcel() {
    const p = new URLSearchParams()
    if (filters.search) p.set("q", filters.search)
    if (filters.dateFrom) p.set("from", filters.dateFrom)
    if (filters.dateTo) p.set("to", filters.dateTo)
    if (filters.dateMode !== "issued") p.set("mode", filters.dateMode)
    if (filters.activeOnly) p.set("active", "1")
    if (filters.docType !== "all") p.set("type", filters.docType)
    window.open(`/api/export/verificari?${p.toString()}`, "_blank")
  }

  return (
    <div className="dash-page report-page">
      <header className="report-header">
        <div>
          <h1 className="dash-title">Raport verificări</h1>
          <p className="dash-subtle">{sorted.length} înregistrări afișate</p>
        </div>
        <div className="report-actions no-print">
          <button type="button" onClick={() => window.print()} className="dash-btn dash-btn--ghost">🖨 Print</button>
          <button type="button" onClick={exportExcel} className="dash-btn dash-btn--ghost">⬇ Excel</button>
          <button type="button" onClick={() => setShowAdd((v) => !v)} className="dash-btn dash-btn--primary">
            {showAdd ? "Anulează" : "+ Adaugă verificare"}
          </button>
        </div>
      </header>

      {error && <div className="auth-error" role="alert">{error}</div>}

      <section className="report-filters no-print">
        <input
          type="text"
          placeholder="Caută: document, echipament, adresă, nume, telefon…"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          className="report-search"
        />
        <select
          value={filters.docType}
          onChange={(e) => setFilters({ ...filters, docType: e.target.value as Filters["docType"] })}
          className="report-type-select"
        >
          <option value="all">Toate tipurile</option>
          <option value="gaz">Verificare gaz (ANRE)</option>
          <option value="centrala">VTP centrală (ISCIR)</option>
        </select>
        <div className="report-daterange">
          <label>
            <span>De la</span>
            <DateInput value={filters.dateFrom} onChange={(iso) => setFilters({ ...filters, dateFrom: iso })} />
          </label>
          <label>
            <span>Până la</span>
            <DateInput value={filters.dateTo} onChange={(iso) => setFilters({ ...filters, dateTo: iso })} />
          </label>
        </div>
        <fieldset className="report-mode">
          <label>
            <input
              type="radio"
              name="vmode"
              checked={filters.dateMode === "issued"}
              onChange={() => setFilters({ ...filters, dateMode: "issued" })}
            />
            <span>efectuate în perioadă</span>
          </label>
          <label>
            <input
              type="radio"
              name="vmode"
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
          <span>doar active</span>
        </label>
        <div className="report-filter-actions">
          <button type="button" className="dash-btn dash-btn--primary" onClick={applyFilters}>Aplică</button>
          <button type="button" className="dash-btn dash-btn--ghost" onClick={clearFilters}>Resetează</button>
        </div>
      </section>

      {showAdd && (
        <section className="dash-card no-print">
          <h2>Adaugă verificare (manual — din dosar hârtie)</h2>
          <AddVerificareForm
            employees={employees}
            judete={judete}
            catalog={catalog}
            pending={pending}
            onSubmit={(ev) => {
              ev.preventDefault()
              const fd = new FormData(ev.currentTarget)
              run(addVerificareManual(fd), () => {
                setShowAdd(false)
                ev.currentTarget.reset()
              })
            }}
          />
        </section>
      )}

      {sorted.length === 0 ? (
        <p className="dash-note">Nicio verificare găsită.</p>
      ) : (
        <div className="report-table-wrap">
          <table className="report-table">
            <thead>
              <tr>
                <th><button type="button" onClick={() => toggleSort("equipment")}>Echipament {sortArrow("equipment")}</button></th>
                <th><button type="button" onClick={() => toggleSort("doc")}>Document + Adresă {sortArrow("doc")}</button></th>
                <th><button type="button" onClick={() => toggleSort("issued")}>Verificare / Achiziție / Valabilitate {sortArrow("issued")}</button></th>
                <th><button type="button" onClick={() => toggleSort("technician")}>Tehnician {sortArrow("technician")}</button></th>
                <th>Observații</th>
                <th className="no-print">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => {
                const badge = expiringBadge(r.validUntil, r.revokedAt)
                const isEditing = editingId === r.documentId
                const obs = r.observations ?? r.equipmentObservations ?? null
                return (
                  <>
                    <tr key={r.documentId} className={r.revokedAt ? "report-row--revoked" : ""}>
                      <td>
                        <div className="report-equipment-type">
                          {r.equipmentTypeName ?? "—"}
                        </div>
                        <div className="report-cell-sub">
                          {[r.equipmentBrand, r.equipmentModel].filter(Boolean).join(" ") || "—"}
                        </div>
                        {r.equipmentSerial && (
                          <div className="report-cell-sub">S/N: <code>{r.equipmentSerial}</code></div>
                        )}
                      </td>
                      <td>
                        <code>{r.documentNumber}</code>
                        <div className="report-addr">{addressMultiline(r)}</div>
                        <div className="report-customer">
                          <strong>{r.customerFullName}</strong> · <a href={`tel:${r.customerPhone}`}>{r.customerPhone}</a>
                        </div>
                        {r.fileUrl && (
                          <div className="report-cell-sub">
                            <a href={r.fileUrl} target="_blank" rel="noreferrer">PDF ↗</a>
                          </div>
                        )}
                      </td>
                      <td>
                        <div>Verif.: <strong>{formatDate(r.issuedAt)}</strong></div>
                        <div>Expiră: {formatDate(r.validUntil)}</div>
                        {(r.equipmentInstallDate || r.equipmentManufactureDate) && (
                          <div className="report-cell-sub">
                            Achiziție: {formatDate(r.equipmentInstallDate ?? r.equipmentManufactureDate)}
                          </div>
                        )}
                        {badge && <span className={`report-badge report-badge--${badge.cls}`}>{badge.label}</span>}
                      </td>
                      <td>{r.technician ?? "—"}</td>
                      <td>{obs ?? "—"}</td>
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
                              onClick={() => {
                                const reason = prompt(`Șterge verificarea ${r.documentNumber}? Motiv:`)
                                if (reason === null) return
                                run(deleteVerificare(r.documentId, reason))
                              }}
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
                            onSubmit={(ev) => {
                              ev.preventDefault()
                              const fd = new FormData(ev.currentTarget)
                              run(updateVerificare(r.documentId, fd), () => setEditingId(null))
                            }}
                            className="dash-form report-edit-form"
                          >
                            <div className="booking-row">
                              <label className="dash-field">
                                <span>Data verificării</span>
                                <DateInput name="issued_at" defaultValue={r.issuedAt.slice(0, 10)} />
                              </label>
                              <label className="dash-field">
                                <span>Valabilitate (expiră)</span>
                                <DateInput name="valid_until" defaultValue={r.validUntil?.slice(0, 10) ?? ""} />
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
                              <textarea name="observations" rows={2} defaultValue={r.observations ?? ""} maxLength={500} />
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

function AddVerificareForm({
  employees,
  judete,
  catalog,
  pending,
  onSubmit,
}: {
  employees: { id: string; full_name: string }[]
  judete: { id: number; nume: string }[]
  catalog: EquipmentType[]
  pending: boolean
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
}) {
  const [selectedEq, setSelectedEq] = useState("")

  return (
    <form onSubmit={onSubmit} className="dash-form">
      <div className="booking-row">
        <label className="dash-field">
          <span>Tip document *</span>
          <select name="document_type" defaultValue="certificat_verificare">
            <option value="certificat_verificare">Certificat verificare gaz (ANRE)</option>
            <option value="fisa_tehnica_centrala">VTP centrală termică (ISCIR)</option>
            <option value="certificat_conformitate">Certificat conformitate</option>
          </select>
        </label>
        <label className="dash-field">
          <span>Nr. document *</span>
          <input name="document_number" required maxLength={40} />
        </label>
        <label className="dash-field">
          <span>Data verificării *</span>
          <DateInput name="issued_at" required />
        </label>
        <label className="dash-field">
          <span>Valabilitate (luni)</span>
          <input name="valid_months" type="number" min={1} max={240} defaultValue={24} />
        </label>
      </div>

      <fieldset className="dash-fieldset">
        <legend>Client + adresă</legend>
        <div className="booking-row">
          <label className="dash-field">
            <span>Nume client *</span>
            <input name="customer_name" required maxLength={120} />
          </label>
          <label className="dash-field">
            <span>Telefon *</span>
            <input name="customer_phone" required type="tel" maxLength={30} />
          </label>
          <label className="dash-field">
            <span>Email</span>
            <input name="customer_email" type="email" maxLength={120} />
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
      </fieldset>

      <fieldset className="dash-fieldset">
        <legend>Echipament (opțional)</legend>
        <label className="dash-field">
          <span>Tip echipament</span>
          <select
            value={selectedEq}
            onChange={(e) => setSelectedEq(e.target.value)}
          >
            <option value="">— nu completez echipament —</option>
            {catalog.filter((c) => c.is_active).map((c) => (
              <option
                key={c.id}
                value={c.source === "default" ? `default:${c.defaultEquipmentId}` : `firm:${c.firmEquipmentId}`}
              >
                {c.nume}
              </option>
            ))}
          </select>
        </label>
        {selectedEq.startsWith("default:") && (
          <input type="hidden" name="equipment_type_id" value={selectedEq.slice(8)} />
        )}
        {selectedEq.startsWith("firm:") && (
          <input type="hidden" name="firm_equipment_type_id" value={selectedEq.slice(5)} />
        )}
        {selectedEq && (
          <>
            <div className="booking-row">
              <label className="dash-field">
                <span>Marcă (ex: Ariston)</span>
                <input name="equipment_brand" maxLength={60} />
              </label>
              <label className="dash-field">
                <span>Model</span>
                <input name="equipment_model" maxLength={120} />
              </label>
              <label className="dash-field">
                <span>Serie</span>
                <input name="equipment_serial" maxLength={100} />
              </label>
            </div>
            <div className="booking-row">
              <label className="dash-field">
                <span>Data achiziție/instalare</span>
                <DateInput name="equipment_install_date" />
              </label>
              <label className="dash-field">
                <span>Data fabricație</span>
                <DateInput name="equipment_manufacture_date" />
              </label>
            </div>
          </>
        )}
      </fieldset>

      <div className="booking-row">
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

      <label className="dash-field">
        <span>Observații</span>
        <textarea name="observations" rows={2} maxLength={500} />
      </label>

      <button type="submit" disabled={pending} className="dash-btn dash-btn--primary">
        {pending ? "Se salvează…" : "Adaugă verificare"}
      </button>
    </form>
  )
}
