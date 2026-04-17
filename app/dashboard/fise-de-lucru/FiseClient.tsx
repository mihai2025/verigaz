"use client"

import { Fragment, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { upsertWorkSheet, deleteWorkSheet } from "./actions"
import DateInput from "@/components/ui/DateInput"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any

const STATUS_LABELS: Record<string, string> = {
  planificat: "Planificat",
  in_lucru: "În lucru",
  finalizat: "Finalizat",
  anulat: "Anulat",
}

const STATUS_COLORS: Record<string, string> = {
  planificat: "#555",
  in_lucru: "#a87400",
  finalizat: "#1e6b34",
  anulat: "#a01818",
}

const WORK_TYPE_LABELS: Record<string, string> = {
  verificare: "Verificare",
  revizie: "Revizie",
  reparatie: "Reparație",
  instalare: "Instalare",
  inspectie: "Inspecție",
  altul: "Altul",
}

function custName(c: Row): string {
  if (!c) return "—"
  if (c.customer_type === "individual") {
    return [c.first_name, c.last_name].filter(Boolean).join(" ") || c.full_name || "—"
  }
  return c.company_name || c.full_name || "—"
}

function addressText(p: Row | undefined): string {
  if (!p) return ""
  const geo = [p.localitati?.nume, p.judete?.nume].filter(Boolean).join(", ")
  return [p.address, geo].filter(Boolean).join(" · ")
}

function formatDate(d: string | null | undefined): string {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("ro-RO")
}

export default function FiseClient({
  sheets,
  contracts,
  technicians,
  properties,
  customers,
  equipments,
}: {
  sheets: Row[]
  contracts: Row[]
  technicians: Row[]
  properties: Row[]
  customers: Row[]
  equipments: Row[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Row | null | "new">(null)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("")
  const [filterTech, setFilterTech] = useState<string>("")
  const [filterDate, setFilterDate] = useState<string>("")
  const [filterType, setFilterType] = useState<string>("")

  const propertyById = useMemo(() => {
    const m = new Map<string, Row>()
    for (const p of properties) m.set(p.id, p)
    return m
  }, [properties])

  const customerById = useMemo(() => {
    const m = new Map<string, Row>()
    for (const c of customers) m.set(c.id, c)
    return m
  }, [customers])

  const contractById = useMemo(() => {
    const m = new Map<string, Row>()
    for (const c of contracts) m.set(c.id, c)
    return m
  }, [contracts])

  const techById = useMemo(() => {
    const m = new Map<string, Row>()
    for (const t of technicians) m.set(t.id, t)
    return m
  }, [technicians])

  const visible = useMemo(() => {
    return sheets.filter((s) => {
      if (filterStatus && s.status !== filterStatus) return false
      if (filterTech && s.technician_id !== filterTech) return false
      if (filterDate && s.work_date !== filterDate) return false
      if (filterType && s.work_type !== filterType) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const tech = s.technician_id ? techById.get(s.technician_id) : null
        const prop = s.property_id ? propertyById.get(s.property_id) : null
        const cust = prop ? customerById.get(prop.customer_id) : null
        const contract = s.contract_id ? contractById.get(s.contract_id) : null
        const hay = [
          s.tasks_done,
          s.materials_used,
          s.observations,
          tech?.full_name,
          addressText(prop),
          custName(cust),
          contract?.contract_number,
        ].filter(Boolean).join(" ").toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [sheets, filterStatus, filterTech, filterDate, filterType, search, techById, propertyById, customerById, contractById])

  const counts = useMemo(() => {
    const c = { total: sheets.length, planificat: 0, in_lucru: 0, finalizat: 0, anulat: 0 }
    for (const s of sheets) {
      c[s.status as keyof typeof c] = (c[s.status as keyof typeof c] ?? 0) + 1
    }
    return c
  }, [sheets])

  function run<T>(promise: Promise<{ ok: boolean; error?: string } & T>, onOk?: () => void) {
    startTransition(async () => {
      setError(null)
      const res = await promise
      if (!res.ok) setError(res.error ?? "Eroare.")
      else { onOk?.(); router.refresh() }
    })
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>, sheetId: string | null) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    run(upsertWorkSheet(sheetId, fd), () => setEditing(null))
  }

  return (
    <>
      {error && <div className="auth-error" role="alert">{error}</div>}

      <div className="dash-stats-row" style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <div className="dash-stat"><strong>{counts.total}</strong><span>total</span></div>
        <div className="dash-stat" style={{ color: STATUS_COLORS.planificat }}><strong>{counts.planificat}</strong><span>planificate</span></div>
        <div className="dash-stat" style={{ color: STATUS_COLORS.in_lucru }}><strong>{counts.in_lucru}</strong><span>în lucru</span></div>
        <div className="dash-stat" style={{ color: STATUS_COLORS.finalizat }}><strong>{counts.finalizat}</strong><span>finalizate</span></div>
      </div>

      <div className="dash-search-bar no-print" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Caută: tehnician, client, adresă, task, materiale, observații…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="report-search"
          style={{ flex: "1 1 260px" }}
        />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Toate statusurile</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">Toate tipurile</option>
          {Object.entries(WORK_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={filterTech} onChange={(e) => setFilterTech(e.target.value)}>
          <option value="">Toți tehnicienii</option>
          {technicians.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
        </select>
        <DateInput
          value={filterDate}
          onChange={(iso) => setFilterDate(iso)}
        />
        <button
          type="button"
          className="dash-btn dash-btn--primary"
          onClick={() => setEditing(editing === "new" ? null : "new")}
          disabled={pending}
        >
          {editing === "new" ? "Anulează" : "+ Fișă nouă"}
        </button>
      </div>

      {editing === "new" && (
        <div className="dash-card" style={{ marginBottom: 20 }}>
          <h3>Fișă de lucru nouă</h3>
          <SheetForm
            sheet={null}
            contracts={contracts}
            technicians={technicians}
            properties={properties}
            customers={customers}
            equipments={equipments}
            pending={pending}
            onSubmit={(ev) => onSubmit(ev, null)}
          />
        </div>
      )}

      {visible.length === 0 ? (
        <p className="dash-note">Nicio fișă găsită.</p>
      ) : (
        <table className="dash-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Tip</th>
              <th>Tehnician</th>
              <th>Adresă / Client</th>
              <th>Contract</th>
              <th>Durată</th>
              <th>Status</th>
              <th>Semnat</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((s) => {
              const tech = s.technician_id ? techById.get(s.technician_id) : null
              const prop = s.property_id ? propertyById.get(s.property_id) : null
              const cust = prop ? customerById.get(prop.customer_id) : null
              const contract = s.contract_id ? contractById.get(s.contract_id) : null
              const isEditing = editing && editing !== "new" && editing.id === s.id
              return (
                <Fragment key={s.id}>
                  <tr>
                    <td>{formatDate(s.work_date)}</td>
                    <td>{WORK_TYPE_LABELS[s.work_type] ?? s.work_type ?? "—"}</td>
                    <td>{tech?.full_name ?? "—"}</td>
                    <td style={{ fontSize: 12 }}>
                      {custName(cust)}
                      {prop && <div style={{ color: "#666" }}>{addressText(prop)}</div>}
                    </td>
                    <td><code>{contract?.contract_number ?? (s.contract_id ? "—" : "")}</code></td>
                    <td>{s.duration_minutes ? `${s.duration_minutes} min` : "—"}</td>
                    <td>
                      <span style={{ color: STATUS_COLORS[s.status] ?? "#333", fontWeight: 600 }}>
                        {STATUS_LABELS[s.status] ?? s.status}
                      </span>
                    </td>
                    <td>{s.signed_by_customer ? "✓" : "—"}</td>
                    <td>
                      <div className="dash-actions-row">
                        <button
                          type="button"
                          className="dash-btn dash-btn--ghost"
                          disabled={pending}
                          onClick={() => setEditing(isEditing ? null : s)}
                        >
                          {isEditing ? "Anulează" : "Editează"}
                        </button>
                        <button
                          type="button"
                          className="dash-btn dash-btn--ghost"
                          disabled={pending}
                          onClick={() => {
                            if (confirm("Ștergi fișa de lucru?")) {
                              run(deleteWorkSheet(s.id))
                            }
                          }}
                          style={{ color: "#a01818" }}
                        >
                          Șterge
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isEditing && (
                    <tr>
                      <td colSpan={9}>
                        <SheetForm
                          sheet={s}
                          contracts={contracts}
                          technicians={technicians}
                          properties={properties}
                          customers={customers}
                          equipments={equipments}
                          pending={pending}
                          onSubmit={(ev) => onSubmit(ev, s.id)}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      )}
    </>
  )
}

function SheetForm({
  sheet,
  contracts,
  technicians,
  properties,
  customers,
  equipments,
  pending,
  onSubmit,
}: {
  sheet: Row | null
  contracts: Row[]
  technicians: Row[]
  properties: Row[]
  customers: Row[]
  equipments: Row[]
  pending: boolean
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
}) {
  const customerById = new Map<string, Row>()
  for (const c of customers) customerById.set(c.id, c)

  const [selectedProperty, setSelectedProperty] = useState<string>(sheet?.property_id ?? "")
  const propEquipments = equipments.filter((e) => e.property_id === selectedProperty)
  const preselectedEquipments: string[] = sheet?._equipment_ids ?? []

  return (
    <form onSubmit={onSubmit} className="dash-form" style={{ padding: "0.75rem", background: "#f8fafc" }}>
      <div className="booking-row">
        <label className="dash-field">
          <span>Data *</span>
          <DateInput name="work_date" defaultValue={sheet?.work_date ?? new Date().toISOString().slice(0, 10)} required />
        </label>
        <label className="dash-field">
          <span>Tip intervenție *</span>
          <select name="work_type" defaultValue={sheet?.work_type ?? "altul"} required>
            {Object.entries(WORK_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="dash-field">
          <span>Status</span>
          <select name="status" defaultValue={sheet?.status ?? "planificat"}>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="dash-field">
          <span>Tehnician</span>
          <select name="technician_id" defaultValue={sheet?.technician_id ?? ""}>
            <option value="">—</option>
            {technicians.map((t) => <option key={t.id} value={t.id}>{t.full_name}{t.role ? ` (${t.role})` : ""}</option>)}
          </select>
        </label>
      </div>

      <div className="booking-row">
        <label className="dash-field">
          <span>Contract (opțional)</span>
          <select name="contract_id" defaultValue={sheet?.contract_id ?? ""}>
            <option value="">—</option>
            {contracts.map((c) => {
              const cust = customerById.get(c.customer_id)
              return (
                <option key={c.id} value={c.id}>
                  {c.contract_number ? `${c.contract_number} · ` : ""}{custName(cust)}
                </option>
              )
            })}
          </select>
        </label>
        <label className="dash-field">
          <span>Adresă (opțional)</span>
          <select
            name="property_id"
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
          >
            <option value="">—</option>
            {properties.map((p) => {
              const cust = customerById.get(p.customer_id)
              return (
                <option key={p.id} value={p.id}>
                  {custName(cust)} · {addressText(p)}
                </option>
              )
            })}
          </select>
        </label>
      </div>

      {selectedProperty && propEquipments.length > 0 && (
        <div className="dash-field">
          <span style={{ marginBottom: 6, display: "block" }}>Echipamente servisate ({propEquipments.length} disponibile)</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 8, padding: 10, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6 }}>
            {propEquipments.map((eq) => (
              <label key={eq.id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  name="equipment_ids"
                  value={eq.id}
                  defaultChecked={preselectedEquipments.includes(eq.id)}
                />
                <span>
                  {[eq.brand, eq.model].filter(Boolean).join(" ") || "Echipament"}
                  {eq.serial_number && <code style={{ marginLeft: 6, fontSize: 11 }}>{eq.serial_number}</code>}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="booking-row">
        <label className="dash-field">
          <span>Ora început</span>
          <input name="start_time" type="time" defaultValue={sheet?.start_time ?? ""} />
        </label>
        <label className="dash-field">
          <span>Ora sfârșit</span>
          <input name="end_time" type="time" defaultValue={sheet?.end_time ?? ""} />
        </label>
        <label className="dash-field">
          <span>Durată (minute)</span>
          <input name="duration_minutes" type="number" min={0} step={1} defaultValue={sheet?.duration_minutes ?? ""} />
        </label>
      </div>

      <label className="dash-field">
        <span>Task-uri efectuate</span>
        <textarea name="tasks_done" rows={3} defaultValue={sheet?.tasks_done ?? ""} maxLength={2000} />
      </label>

      <label className="dash-field">
        <span>Materiale folosite</span>
        <textarea name="materials_used" rows={2} defaultValue={sheet?.materials_used ?? ""} maxLength={1000} />
      </label>

      <label className="dash-field">
        <span>Observații</span>
        <textarea name="observations" rows={2} defaultValue={sheet?.observations ?? ""} maxLength={1000} />
      </label>

      <label className="booking-checkbox">
        <input type="checkbox" name="signed_by_customer" defaultChecked={sheet?.signed_by_customer === true} />
        <span>Semnat de client</span>
      </label>

      <button type="submit" disabled={pending} className="dash-btn dash-btn--primary">
        {pending ? "Se salvează…" : sheet ? "Salvează" : "Adaugă fișă"}
      </button>
    </form>
  )
}
