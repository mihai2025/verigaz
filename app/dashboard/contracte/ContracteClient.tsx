"use client"

import { Fragment, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { upsertContract, changeContractStatus, deleteContract, createCustomerAndProperty } from "./actions"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any

const PERIOD_LABELS: Record<string, string> = {
  "2_ani": "Verificare 2 ani",
  "10_ani": "Revizie 10 ani",
  "anual": "Anual",
  "custom": "Personalizat",
}

const STATUS_LABELS: Record<string, string> = {
  activ: "Activ",
  reziliat: "Reziliat",
  suspendat: "Suspendat",
}

const STATUS_COLORS: Record<string, string> = {
  activ: "#1e6b34",
  reziliat: "#a01818",
  suspendat: "#555",
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

export default function ContracteClient({
  contracts,
  customers,
  properties,
  equipments,
  judete,
}: {
  contracts: Row[]
  customers: Row[]
  properties: Row[]
  equipments: Row[]
  judete: Row[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Row | null | "new">(null)
  const [creatingCustomer, setCreatingCustomer] = useState(false)
  const [prefillCustomer, setPrefillCustomer] = useState<{ customerId: string; propertyId: string } | null>(null)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("")

  const customerById = useMemo(() => {
    const m = new Map<string, Row>()
    for (const c of customers) m.set(c.id, c)
    return m
  }, [customers])

  const propertyById = useMemo(() => {
    const m = new Map<string, Row>()
    for (const p of properties) m.set(p.id, p)
    return m
  }, [properties])

  const visible = useMemo(() => {
    return contracts.filter((c) => {
      if (filterStatus && c.status !== filterStatus) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const cust = customerById.get(c.customer_id)
        const prop = c.property_id ? propertyById.get(c.property_id) : null
        const hay = [
          c.contract_number,
          c.notes,
          custName(cust),
          cust?.phone,
          cust?.email,
          addressText(prop),
        ].filter(Boolean).join(" ").toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [contracts, filterStatus, search, customerById, propertyById])

  const counts = useMemo(() => {
    const c = { total: contracts.length, activ: 0, reziliat: 0, suspendat: 0 }
    for (const x of contracts) {
      c[x.status as keyof typeof c] = (c[x.status as keyof typeof c] ?? 0) + 1
    }
    return c
  }, [contracts])

  function run<T>(promise: Promise<{ ok: boolean; error?: string } & T>, onOk?: () => void) {
    startTransition(async () => {
      setError(null)
      const res = await promise
      if (!res.ok) setError(res.error ?? "Eroare.")
      else { onOk?.(); router.refresh() }
    })
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>, contractId: string | null) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    run(upsertContract(contractId, fd), () => {
      setEditing(null)
      setPrefillCustomer(null)
    })
  }

  function onSubmitCreateCustomer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      setError(null)
      const res = await createCustomerAndProperty(fd)
      if (!res.ok) {
        setError(res.error ?? "Eroare.")
        return
      }
      setCreatingCustomer(false)
      setPrefillCustomer({ customerId: res.customerId, propertyId: res.propertyId })
      setEditing("new")
      router.refresh()
    })
  }

  return (
    <>
      {error && <div className="auth-error" role="alert">{error}</div>}

      <div className="dash-stats-row" style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <div className="dash-stat"><strong>{counts.total}</strong><span>total</span></div>
        <div className="dash-stat" style={{ color: STATUS_COLORS.activ }}><strong>{counts.activ}</strong><span>activ</span></div>
        <div className="dash-stat" style={{ color: STATUS_COLORS.suspendat }}><strong>{counts.suspendat}</strong><span>suspendate</span></div>
        <div className="dash-stat" style={{ color: STATUS_COLORS.reziliat }}><strong>{counts.reziliat}</strong><span>reziliate</span></div>
      </div>
      <p className="dash-subtle" style={{ marginTop: -12, marginBottom: 16, fontSize: 13 }}>
        Scadențele reale sunt pe echipamente — vezi <a href="/dashboard/rapoarte/scadente">raportul de scadențe</a>.
      </p>

      <div className="dash-search-bar no-print" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Caută: nr. contract, client, telefon, adresă, notițe…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="report-search"
          style={{ flex: "1 1 260px" }}
        />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Toate statusurile</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button
          type="button"
          className="dash-btn dash-btn--ghost"
          onClick={() => { setCreatingCustomer(!creatingCustomer); setEditing(null) }}
          disabled={pending}
        >
          {creatingCustomer ? "Anulează client" : "+ Client nou"}
        </button>
        <button
          type="button"
          className="dash-btn dash-btn--primary"
          onClick={() => { setEditing(editing === "new" ? null : "new"); setCreatingCustomer(false) }}
          disabled={pending}
        >
          {editing === "new" ? "Anulează" : "+ Contract nou"}
        </button>
      </div>

      {creatingCustomer && (
        <div className="dash-card" style={{ marginBottom: 20 }}>
          <h3>Client nou + adresă</h3>
          <p className="dash-subtle" style={{ marginBottom: 10 }}>
            După salvare, pre-umplem formularul de contract cu datele acestui client.
          </p>
          <NewCustomerForm
            judete={judete}
            pending={pending}
            onSubmit={onSubmitCreateCustomer}
          />
        </div>
      )}

      {editing === "new" && (
        <div className="dash-card" style={{ marginBottom: 20 }}>
          <h3>Contract nou{prefillCustomer ? " (client proaspăt creat)" : ""}</h3>
          <ContractForm
            contract={prefillCustomer ? { customer_id: prefillCustomer.customerId, property_id: prefillCustomer.propertyId } as Row : null}
            customers={customers}
            properties={properties}
            equipments={equipments}
            pending={pending}
            onSubmit={(ev) => onSubmit(ev, null)}
          />
        </div>
      )}

      {visible.length === 0 ? (
        <p className="dash-note">Niciun contract găsit.</p>
      ) : (
        <table className="dash-table">
          <thead>
            <tr>
              <th>Nr. contract</th>
              <th>Client</th>
              <th>Adresă</th>
              <th>Început</th>
              <th>Echipamente</th>
              <th>Status</th>
              <th>Tarif</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((c) => {
              const cust = customerById.get(c.customer_id)
              const prop = c.property_id ? propertyById.get(c.property_id) : null
              const isEditing = editing && editing !== "new" && editing.id === c.id
              const equipCount = (c._equipment_ids ?? []).length
              return (
                <Fragment key={c.id}>
                  <tr>
                    <td><code>{c.contract_number || "—"}</code></td>
                    <td>{custName(cust)}</td>
                    <td style={{ fontSize: 12 }}>{addressText(prop) || "—"}</td>
                    <td>{formatDate(c.start_date)}</td>
                    <td>
                      {equipCount > 0 ? (
                        <span>{equipCount} echip.</span>
                      ) : (
                        <span style={{ color: "#888", fontStyle: "italic" }}>toate</span>
                      )}
                    </td>
                    <td>
                      <span style={{ color: STATUS_COLORS[c.status] ?? "#333", fontWeight: 600 }}>
                        {STATUS_LABELS[c.status] ?? c.status}
                      </span>
                    </td>
                    <td>
                      {c.monthly_fee ? `${c.monthly_fee} lei/lună` : c.total_amount ? `${c.total_amount} lei` : "—"}
                    </td>
                    <td>
                      <div className="dash-actions-row">
                        <button
                          type="button"
                          className="dash-btn dash-btn--ghost"
                          disabled={pending}
                          onClick={() => setEditing(isEditing ? null : c)}
                        >
                          {isEditing ? "Anulează" : "Editează"}
                        </button>
                        {c.status === "activ" && (
                          <button
                            type="button"
                            className="dash-btn dash-btn--ghost"
                            disabled={pending}
                            onClick={() => {
                              const reason = prompt("Motiv reziliere (opțional):") ?? ""
                              if (confirm("Reziliezi contractul?")) {
                                run(changeContractStatus(c.id, "reziliat", reason || null))
                              }
                            }}
                          >
                            Reziliază
                          </button>
                        )}
                        <button
                          type="button"
                          className="dash-btn dash-btn--ghost"
                          disabled={pending}
                          onClick={() => {
                            if (confirm("Ștergi definitiv contractul? (Alternativ: folosește Reziliază)")) {
                              run(deleteContract(c.id))
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
                      <td colSpan={8}>
                        <ContractForm
                          contract={c}
                          customers={customers}
                          properties={properties}
                          equipments={equipments}
                          pending={pending}
                          onSubmit={(ev) => onSubmit(ev, c.id)}
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

function ContractForm({
  contract,
  customers,
  properties,
  equipments,
  pending,
  onSubmit,
}: {
  contract: Row | null
  customers: Row[]
  properties: Row[]
  equipments: Row[]
  pending: boolean
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
}) {
  const [selectedCustomer, setSelectedCustomer] = useState<string>(contract?.customer_id ?? "")
  const [selectedProperty, setSelectedProperty] = useState<string>(contract?.property_id ?? "")
  const custProperties = properties.filter((p) => p.customer_id === selectedCustomer)
  const propEquipments = selectedProperty ? equipments.filter((e) => e.property_id === selectedProperty) : []
  const preselectedEquipments: string[] = contract?._equipment_ids ?? []

  return (
    <form onSubmit={onSubmit} className="dash-form" style={{ padding: "0.75rem", background: "#f8fafc" }}>
      <div className="booking-row">
        <label className="dash-field">
          <span>Client *</span>
          <select
            name="customer_id"
            required
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
          >
            <option value="">— alege client —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {custName(c)} {c.phone ? `· ${c.phone}` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="dash-field">
          <span>Adresă (opțional)</span>
          <select
            name="property_id"
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
          >
            <option value="">Toate adresele clientului</option>
            {custProperties.map((p) => (
              <option key={p.id} value={p.id}>{addressText(p)}</option>
            ))}
          </select>
        </label>
      </div>

      {selectedProperty && propEquipments.length > 0 && (
        <div className="dash-field">
          <span style={{ marginBottom: 6, display: "block" }}>
            Echipamente acoperite de contract ({propEquipments.length} disponibile)
          </span>
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
          <small style={{ color: "var(--text-500)" }}>
            Necompletat = contractul acoperă toate echipamentele de la această adresă.
          </small>
        </div>
      )}

      <div className="booking-row">
        <label className="dash-field">
          <span>Nr. contract</span>
          <input name="contract_number" defaultValue={contract?.contract_number ?? ""} maxLength={40} />
        </label>
        <label className="dash-field">
          <span>Status</span>
          <select name="status" defaultValue={contract?.status ?? "activ"}>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="dash-field">
          <span>Data început *</span>
          <input name="start_date" type="date" defaultValue={contract?.start_date ?? ""} required />
        </label>
      </div>

      <details style={{ marginBottom: 12 }}>
        <summary style={{ cursor: "pointer", fontSize: 13, color: "var(--text-600)" }}>
          Opțional: tip perioadă + dată expirare (contractele se auto-reînnoiesc dacă lipsesc)
        </summary>
        <div className="booking-row" style={{ marginTop: 10 }}>
          <label className="dash-field">
            <span>Tip perioadă</span>
            <select name="period_type" defaultValue={contract?.period_type ?? ""}>
              <option value="">—</option>
              {Object.entries(PERIOD_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label className="dash-field">
            <span>Data expirare</span>
            <input name="expiry_date" type="date" defaultValue={contract?.expiry_date ?? ""} />
          </label>
        </div>
      </details>

      <div className="booking-row">
        <label className="dash-field">
          <span>Tarif lunar (lei)</span>
          <input name="monthly_fee" type="number" min={0} step="0.01" defaultValue={contract?.monthly_fee ?? ""} />
        </label>
        <label className="dash-field">
          <span>Valoare totală (lei)</span>
          <input name="total_amount" type="number" min={0} step="0.01" defaultValue={contract?.total_amount ?? ""} />
        </label>
      </div>

      <label className="dash-field">
        <span>Notițe</span>
        <textarea name="notes" rows={2} defaultValue={contract?.notes ?? ""} maxLength={1000} />
      </label>

      <button type="submit" disabled={pending} className="dash-btn dash-btn--primary">
        {pending ? "Se salvează…" : contract ? "Salvează" : "Adaugă contract"}
      </button>
    </form>
  )
}

function NewCustomerForm({
  judete,
  pending,
  onSubmit,
}: {
  judete: Row[]
  pending: boolean
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
}) {
  const [customerType, setCustomerType] = useState<string>("individual")

  return (
    <form onSubmit={onSubmit} className="dash-form" style={{ padding: "0.75rem", background: "#f0f9ff" }}>
      <div className="booking-row">
        <label className="dash-field">
          <span>Tip client *</span>
          <select name="customer_type" value={customerType} onChange={(e) => setCustomerType(e.target.value)} required>
            <option value="individual">Persoană fizică</option>
            <option value="association">Asociație proprietari</option>
            <option value="business">Firmă / PFA</option>
          </select>
        </label>
        <label className="dash-field">
          <span>Telefon *</span>
          <input name="phone" type="tel" required maxLength={30} placeholder="07xx xxx xxx" />
        </label>
        <label className="dash-field">
          <span>Email</span>
          <input name="email" type="email" maxLength={120} />
        </label>
      </div>

      {customerType === "individual" ? (
        <div className="booking-row">
          <label className="dash-field">
            <span>Prenume *</span>
            <input name="first_name" required maxLength={60} />
          </label>
          <label className="dash-field">
            <span>Nume *</span>
            <input name="last_name" required maxLength={60} />
          </label>
          <label className="dash-field">
            <span>CNP (opțional)</span>
            <input name="cnp" maxLength={13} pattern="\d{13}" />
          </label>
        </div>
      ) : (
        <div className="booking-row">
          <label className="dash-field">
            <span>Denumire {customerType === "association" ? "asociație" : "firmă"} *</span>
            <input name="company_name" required maxLength={160} />
          </label>
          <label className="dash-field">
            <span>CUI</span>
            <input name="cui" maxLength={20} />
          </label>
        </div>
      )}

      <div className="booking-row">
        <label className="dash-field">
          <span>Tip imobil</span>
          <select name="property_type" defaultValue="apartment">
            <option value="apartment">Apartament</option>
            <option value="house">Casă</option>
            <option value="building">Bloc</option>
            <option value="office">Birou / Sediu</option>
            <option value="association">Scară / Asociație</option>
          </select>
        </label>
        <label className="dash-field">
          <span>Județ</span>
          <select name="judet_id" defaultValue="">
            <option value="">—</option>
            {judete.map((j) => <option key={j.id} value={j.id}>{j.nume}</option>)}
          </select>
        </label>
        <label className="dash-field">
          <span>Localitate</span>
          <input name="localitate_text" maxLength={120} placeholder="ex: Cluj-Napoca" />
        </label>
      </div>

      <label className="dash-field">
        <span>Adresă (stradă + număr) *</span>
        <input name="address" required maxLength={200} />
      </label>

      <div className="booking-row">
        <label className="dash-field">
          <span>Bloc</span>
          <input name="block_name" maxLength={30} />
        </label>
        <label className="dash-field">
          <span>Apartament</span>
          <input name="apartment" maxLength={10} />
        </label>
      </div>

      <button type="submit" disabled={pending} className="dash-btn dash-btn--primary">
        {pending ? "Se salvează…" : "Salvează client + continuă cu contract"}
      </button>
    </form>
  )
}
