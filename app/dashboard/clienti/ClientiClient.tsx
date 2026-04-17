"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { EquipmentType } from "@/lib/equipment/catalog"
import { resolveBullet, type ReminderBullet } from "@/lib/reminders/status"
import { upsertPropertyEquipment, deactivateEquipment } from "./actions"
import { createCustomer, addPropertyForCustomer } from "../contracte/actions"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any

function bulletIcon(b: ReminderBullet) {
  if (b === "sent") return <span className="bullet bullet--sent" title="Notificare trimisă">●</span>
  if (b === "done") return <span className="bullet bullet--done" title="Verificare efectuată">✓</span>
  if (b === "overdue") return <span className="bullet bullet--overdue" title="Scadență trecută">!</span>
  return null
}

function custName(c: Row): string {
  if (c.customer_type === "individual") {
    return [c.first_name, c.last_name].filter(Boolean).join(" ") || c.full_name || "—"
  }
  return c.company_name || c.full_name || "—"
}

function addressText(p: Row): string {
  const parts = [p.address, p.block_name && `bl. ${p.block_name}`, p.apartment && `ap. ${p.apartment}`]
  const geo = [p.localitati?.nume, p.judete?.nume].filter(Boolean).join(", ")
  return [parts.filter(Boolean).join(", "), geo].filter(Boolean).join(" · ")
}

export default function ClientiClient({
  customers,
  properties,
  equipments,
  reminders,
  catalog,
  judete,
}: {
  customers: Row[]
  properties: Row[]
  equipments: Row[]
  reminders: Row[]
  catalog: EquipmentType[]
  judete: Row[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ propertyId: string; equipmentId: string | null } | null>(null)
  const [search, setSearch] = useState("")
  const [creatingCustomer, setCreatingCustomer] = useState(false)
  const [addingPropertyFor, setAddingPropertyFor] = useState<string | null>(null)

  const remindersByEquip = useMemo(() => {
    const m = new Map<string, Row>()
    for (const r of reminders) {
      if (r.equipment_id) {
        const cur = m.get(r.equipment_id)
        if (!cur || new Date(r.scheduled_for ?? 0) > new Date(cur.scheduled_for ?? 0)) {
          m.set(r.equipment_id, r)
        }
      }
    }
    return m
  }, [reminders])

  const visibleCustomers = useMemo(() => {
    if (!search.trim()) return customers
    const q = search.toLowerCase().trim()
    return customers.filter((c) => {
      const custHay = [
        custName(c), c.phone, c.email, c.cnp, c.cui, c.company_name,
        c.first_name, c.last_name,
      ].filter(Boolean).join(" ").toLowerCase()
      if (custHay.includes(q)) return true
      const myProps = properties.filter((p) => p.customer_id === c.id)
      for (const p of myProps) {
        const pHay = [
          addressText(p), p.address, p.block_name, p.stair, p.floor, p.apartment,
          p.localitati?.nume, p.judete?.nume,
        ].filter(Boolean).join(" ").toLowerCase()
        if (pHay.includes(q)) return true
        const myEq = equipments.filter((e) => e.property_id === p.id)
        for (const eq of myEq) {
          const eqHay = [eq.brand, eq.model, eq.serial_number, eq.observations]
            .filter(Boolean).join(" ").toLowerCase()
          if (eqHay.includes(q)) return true
        }
      }
      return false
    })
  }, [search, customers, properties, equipments])

  function getBulletForEquipment(eq: Row): ReminderBullet {
    const latest = remindersByEquip.get(eq.id)
    if (!latest) return null
    return resolveBullet(latest, eq.next_verificare_due ?? eq.next_revizie_due ?? null)
  }

  function run(promise: Promise<{ ok: boolean; error?: string }>, onOk?: () => void) {
    startTransition(async () => {
      setError(null)
      const res = await promise
      if (!res.ok) setError(res.error ?? "Eroare.")
      else { onOk?.(); router.refresh() }
    })
  }

  function onSubmitEquipment(e: React.FormEvent<HTMLFormElement>, equipmentId: string | null) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    run(upsertPropertyEquipment(equipmentId, fd), () => setEditing(null))
  }

  function onSubmitCreateCustomer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      setError(null)
      const res = await createCustomer(fd)
      if (!res.ok) { setError(res.error ?? "Eroare."); return }
      setCreatingCustomer(false)
      setAddingPropertyFor(res.customerId)
      router.refresh()
    })
  }

  function onSubmitAddProperty(e: React.FormEvent<HTMLFormElement>, customerId: string) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      setError(null)
      const res = await addPropertyForCustomer(customerId, fd)
      if (!res.ok) { setError(res.error ?? "Eroare."); return }
      setAddingPropertyFor(null)
      router.refresh()
    })
  }

  const customerById = useMemo(() => {
    const m = new Map<string, Row>()
    for (const c of customers) m.set(c.id, c)
    return m
  }, [customers])

  return (
    <>
      {error && <div className="auth-error" role="alert">{error}</div>}

      <div className="dash-search-bar no-print" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Caută: nume, telefon, email, CNP/CUI, adresă, marcă, model, serie…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="report-search"
          style={{ flex: "1 1 260px" }}
        />
        {search && (
          <button type="button" className="dash-btn dash-btn--ghost" onClick={() => setSearch("")}>
            Șterge
          </button>
        )}
        <span className="dash-subtle">
          {visibleCustomers.length} / {customers.length} clienți
        </span>
        <button
          type="button"
          className="dash-btn dash-btn--primary"
          disabled={pending}
          onClick={() => { setCreatingCustomer(!creatingCustomer); setAddingPropertyFor(null) }}
        >
          {creatingCustomer ? "Anulează" : "+ Client nou"}
        </button>
      </div>

      {creatingCustomer && (
        <div className="dash-card" style={{ marginBottom: 20 }}>
          <h3>Client nou</h3>
          <p className="dash-subtle" style={{ marginBottom: 10 }}>
            După salvare îți cerem imediat și o adresă pentru acest client.
          </p>
          <NewCustomerForm pending={pending} onSubmit={onSubmitCreateCustomer} />
        </div>
      )}

      {addingPropertyFor && (
        <div className="dash-card" style={{ marginBottom: 20 }}>
          <h3>Adresă nouă pentru {custName(customerById.get(addingPropertyFor) ?? { full_name: "client" })}</h3>
          <NewPropertyForm
            customerId={addingPropertyFor}
            judete={judete}
            pending={pending}
            onSubmit={(ev) => onSubmitAddProperty(ev, addingPropertyFor)}
            onCancel={() => setAddingPropertyFor(null)}
          />
        </div>
      )}

      {visibleCustomers.length === 0 ? (
        <p className="dash-note">
          {customers.length === 0
            ? "Nu ai încă clienți. Apasă butonul + Client nou ca să adaugi primul."
            : `Niciun client găsit${search ? ` pentru "${search}"` : ""}.`}
        </p>
      ) : (
        <div className="clienti-list">
          {visibleCustomers.map((c) => {
            const custProps = properties.filter((p) => p.customer_id === c.id)
            const custEquipments = equipments.filter((e) =>
              custProps.some((p) => p.id === e.property_id)
            )
            // Cel mai apropiat due date (verificare sau revizie) active
            let nextDue: { date: Date; label: string } | null = null
            for (const eq of custEquipments) {
              if (!eq.is_active) continue
              for (const [dateStr, label] of [
                [eq.next_verificare_due, "verificare"],
                [eq.next_revizie_due, "revizie"],
              ] as [string | null, string][]) {
                if (!dateStr) continue
                const d = new Date(dateStr)
                if (!nextDue || d < nextDue.date) nextDue = { date: d, label }
              }
            }
            const dueClass = nextDue
              ? (nextDue.date.getTime() - Date.now() < 0 ? "overdue"
                : nextDue.date.getTime() - Date.now() < 30 * 86400000 ? "soon" : "ok")
              : null

            return (
              <details key={c.id} className="clienti-row">
                <summary className="clienti-row__summary">
                  <span className="clienti-row__name">{custName(c)}</span>
                  <span className="clienti-row__meta">
                    <a href={`tel:${c.phone}`}>{c.phone}</a>
                    {c.email && <span className="clienti-row__email"> · {c.email}</span>}
                  </span>
                  <span className="clienti-row__badges">
                    <span className="pill pill--addr" title="adrese">{custProps.length} 📍</span>
                    <span className="pill pill--eq" title="echipamente">{custEquipments.length} ⚙</span>
                    {nextDue && (
                      <span className={`pill pill--due pill--${dueClass}`} title={`Scadență ${nextDue.label}`}>
                        {nextDue.date.toLocaleDateString("ro-RO")}
                      </span>
                    )}
                  </span>
                  <Link
                    href={`/dashboard/clienti/${c.id}`}
                    className="dash-btn dash-btn--ghost clienti-row__fisa"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Fișă →
                  </Link>
                </summary>

                {custProps.length === 0 ? (
                  <p className="dash-note" style={{ margin: "8px 14px" }}>Fără adrese.</p>
                ) : (
                  <div className="clienti-row__details">
                    {custProps.map((p) => {
                      const addrEqs = equipments.filter((e) => e.property_id === p.id)
                      const isAddingNew = editing?.propertyId === p.id && editing?.equipmentId === null
                      return (
                        <div key={p.id} className="clienti-addr">
                          <div className="clienti-addr__head">
                            <span className="clienti-addr__text">📍 {addressText(p)}</span>
                            <button
                              type="button"
                              disabled={pending}
                              className="dash-btn dash-btn--ghost dash-btn--small"
                              onClick={() =>
                                setEditing(isAddingNew ? null : { propertyId: p.id, equipmentId: null })
                              }
                            >
                              {isAddingNew ? "Anulează" : "+ Echipament"}
                            </button>
                          </div>
                          {addrEqs.length > 0 && (
                            <ul className="clienti-eq-list">
                              {addrEqs.map((eq) => {
                                const isEditing = editing?.equipmentId === eq.id
                                const typeLabel = eq.firm_equipment_type_id
                                  ? catalog.find((c) => c.firmEquipmentId === eq.firm_equipment_type_id)?.nume
                                  : catalog.find((c) => c.defaultEquipmentId === eq.equipment_type_id)?.nume
                                const brandModel = [eq.brand, eq.model].filter(Boolean).join(" ")
                                return (
                                  <li key={eq.id} className={`clienti-eq ${!eq.is_active ? "is-inactive" : ""}`}>
                                    <span className="clienti-eq__bullet">{bulletIcon(getBulletForEquipment(eq))}</span>
                                    <span className="clienti-eq__type">{typeLabel ?? "—"}</span>
                                    {brandModel && <span className="clienti-eq__bm">{brandModel}</span>}
                                    {eq.serial_number && <code className="clienti-eq__sn">{eq.serial_number}</code>}
                                    {eq.next_verificare_due && (
                                      <span className="clienti-eq__due" title="Scadență verificare">
                                        V: {new Date(eq.next_verificare_due).toLocaleDateString("ro-RO")}
                                      </span>
                                    )}
                                    {eq.next_revizie_due && (
                                      <span className="clienti-eq__due" title="Scadență revizie">
                                        R: {new Date(eq.next_revizie_due).toLocaleDateString("ro-RO")}
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      disabled={pending}
                                      className="dash-btn dash-btn--ghost dash-btn--small"
                                      onClick={() =>
                                        setEditing(isEditing ? null : { propertyId: p.id, equipmentId: eq.id })
                                      }
                                    >
                                      {isEditing ? "✕" : "✎"}
                                    </button>
                                    {eq.is_active && (
                                      <button
                                        type="button"
                                        disabled={pending}
                                        className="dash-btn dash-btn--ghost dash-btn--small"
                                        title="Dezactivează"
                                        onClick={() => {
                                          if (confirm("Dezactivezi echipamentul?")) {
                                            run(deactivateEquipment(eq.id))
                                          }
                                        }}
                                      >
                                        🗑
                                      </button>
                                    )}
                                    {isEditing && (
                                      <div className="clienti-eq__form">
                                        <EquipmentForm
                                          propertyId={p.id}
                                          equipment={eq}
                                          catalog={catalog}
                                          pending={pending}
                                          onSubmit={(ev) => onSubmitEquipment(ev, eq.id)}
                                        />
                                      </div>
                                    )}
                                  </li>
                                )
                              })}
                            </ul>
                          )}
                          {isAddingNew && (
                            <div className="clienti-eq__form">
                              <EquipmentForm
                                propertyId={p.id}
                                equipment={null}
                                catalog={catalog}
                                pending={pending}
                                onSubmit={(ev) => onSubmitEquipment(ev, null)}
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </details>
            )
          })}
        </div>
      )}
    </>
  )
}

function EquipmentForm({
  propertyId,
  equipment,
  catalog,
  pending,
  onSubmit,
}: {
  propertyId: string
  equipment: Row | null
  catalog: EquipmentType[]
  pending: boolean
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
}) {
  const options = catalog.filter((c) => c.is_active)
  const [selectedValue, setSelectedValue] = useState(() => {
    if (equipment?.firm_equipment_type_id) return `firm:${equipment.firm_equipment_type_id}`
    if (equipment?.equipment_type_id) return `default:${equipment.equipment_type_id}`
    return ""
  })

  return (
    <form onSubmit={onSubmit} className="dash-form" style={{ padding: "0.75rem", background: "#f8fafc" }}>
      <input type="hidden" name="property_id" value={propertyId} />
      <label className="dash-field">
        <span>Tip echipament *</span>
        <select value={selectedValue} onChange={(e) => setSelectedValue(e.target.value)} required>
          <option value="">— alege —</option>
          {options.map((o) => (
            <option
              key={o.id}
              value={o.source === "default" ? `default:${o.defaultEquipmentId}` : `firm:${o.firmEquipmentId}`}
            >
              {o.nume}
              {o.verificare_months && ` (verif. ${o.verificare_months} luni)`}
            </option>
          ))}
        </select>
      </label>
      {selectedValue.startsWith("default:") && (
        <input type="hidden" name="equipment_type_id" value={selectedValue.slice(8)} />
      )}
      {selectedValue.startsWith("firm:") && (
        <input type="hidden" name="firm_equipment_type_id" value={selectedValue.slice(5)} />
      )}
      <div className="booking-row">
        <label className="dash-field">
          <span>Marcă</span>
          <input name="brand" defaultValue={equipment?.brand ?? ""} maxLength={60} />
        </label>
        <label className="dash-field">
          <span>Model</span>
          <input name="model" defaultValue={equipment?.model ?? ""} maxLength={120} />
        </label>
        <label className="dash-field">
          <span>Serie (S/N)</span>
          <input name="serial_number" defaultValue={equipment?.serial_number ?? ""} maxLength={100} />
        </label>
      </div>
      <div className="booking-row">
        <label className="dash-field">
          <span>Data fabricației</span>
          <input name="manufacture_date" type="date" defaultValue={equipment?.manufacture_date ?? ""} />
        </label>
        <label className="dash-field">
          <span>Data instalării</span>
          <input name="installation_date" type="date" defaultValue={equipment?.installation_date ?? ""} />
        </label>
      </div>

      <div className="booking-row">
        <label className="dash-field">
          <span>Ultima verificare</span>
          <input name="last_verificare_at" type="date" defaultValue={equipment?.last_verificare_at ?? ""} />
        </label>
        <label className="dash-field">
          <span>Scadență următoare verificare</span>
          <input name="next_verificare_due" type="date" defaultValue={equipment?.next_verificare_due ?? ""} />
          <small style={{ color: "var(--text-500)" }}>
            Gol = auto-calcul pe baza ultimei verificări + luni din catalog (ex: 24 luni).
          </small>
        </label>
      </div>

      <div className="booking-row">
        <label className="dash-field">
          <span>Ultima revizie</span>
          <input name="last_revizie_at" type="date" defaultValue={equipment?.last_revizie_at ?? ""} />
        </label>
        <label className="dash-field">
          <span>Scadență următoare revizie</span>
          <input name="next_revizie_due" type="date" defaultValue={equipment?.next_revizie_due ?? ""} />
          <small style={{ color: "var(--text-500)" }}>
            Gol = auto-calcul pe baza ultimei revizii + luni din catalog (ex: 120 luni).
          </small>
        </label>
      </div>

      <label className="dash-field">
        <span>Observații</span>
        <textarea name="observations" rows={2} maxLength={500} defaultValue={equipment?.observations ?? ""} />
      </label>
      <label className="booking-checkbox">
        <input type="checkbox" name="is_active" defaultChecked={equipment?.is_active !== false} />
        <span>Activ</span>
      </label>
      <button type="submit" disabled={pending} className="dash-btn dash-btn--primary">
        {pending ? "Se salvează…" : equipment ? "Salvează" : "Adaugă echipament"}
      </button>
    </form>
  )
}

function NewCustomerForm({
  pending,
  onSubmit,
}: {
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
          <label className="dash-field"><span>Prenume *</span><input name="first_name" required maxLength={60} /></label>
          <label className="dash-field"><span>Nume *</span><input name="last_name" required maxLength={60} /></label>
          <label className="dash-field"><span>CNP (opțional)</span><input name="cnp" maxLength={13} pattern="\d{13}" /></label>
        </div>
      ) : (
        <div className="booking-row">
          <label className="dash-field">
            <span>Denumire {customerType === "association" ? "asociație" : "firmă"} *</span>
            <input name="company_name" required maxLength={160} />
          </label>
          <label className="dash-field"><span>CUI</span><input name="cui" maxLength={20} /></label>
        </div>
      )}
      <button type="submit" disabled={pending} className="dash-btn dash-btn--primary">
        {pending ? "Se salvează…" : "Salvează client + adaugă adresă"}
      </button>
    </form>
  )
}

function NewPropertyForm({
  customerId,
  judete,
  pending,
  onSubmit,
  onCancel,
}: {
  customerId: string
  judete: Row[]
  pending: boolean
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}) {
  const [judetId, setJudetId] = useState<string>("")
  const [localitati, setLocalitati] = useState<Array<{ id: number; nume: string }>>([])
  const [loadingLoc, setLoadingLoc] = useState(false)

  useEffect(() => {
    if (!judetId) { setLocalitati([]); return }
    setLoadingLoc(true)
    fetch(`/api/geo/localitati?judet=${judetId}`)
      .then((r) => r.json())
      .then((d) => { if (d?.ok) setLocalitati(d.localitati ?? []) })
      .catch(() => {})
      .finally(() => setLoadingLoc(false))
  }, [judetId])

  return (
    <form onSubmit={onSubmit} className="dash-form" style={{ padding: "0.75rem", background: "#fef3c7" }}>
      <input type="hidden" name="customer_id_marker" value={customerId} />
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
          <select name="judet_id" value={judetId} onChange={(e) => setJudetId(e.target.value)}>
            <option value="">— alege județ —</option>
            {judete.map((j) => <option key={j.id} value={j.id}>{j.nume}</option>)}
          </select>
        </label>
        <label className="dash-field">
          <span>Localitate {loadingLoc && <em>(se încarcă…)</em>}</span>
          <select name="localitate_id" defaultValue="" disabled={!judetId || loadingLoc}>
            <option value="">{judetId ? "— alege localitate —" : "întâi alege județul"}</option>
            {localitati.map((l) => <option key={l.id} value={l.id}>{l.nume}</option>)}
          </select>
        </label>
      </div>
      <label className="dash-field">
        <span>Adresă (stradă + număr) *</span>
        <input name="address" required maxLength={200} placeholder="ex: Str. Memorandumului 28" />
      </label>
      <div className="booking-row">
        <label className="dash-field"><span>Bloc</span><input name="block_name" maxLength={30} /></label>
        <label className="dash-field"><span>Scară</span><input name="stair" maxLength={10} /></label>
        <label className="dash-field"><span>Apartament</span><input name="apartment" maxLength={10} /></label>
        <label className="dash-field"><span>Etaj</span><input name="floor" maxLength={10} /></label>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button type="submit" disabled={pending} className="dash-btn dash-btn--primary">
          {pending ? "Se salvează…" : "Salvează adresă"}
        </button>
        <button type="button" onClick={onCancel} disabled={pending} className="dash-btn dash-btn--ghost">
          Mai târziu
        </button>
      </div>
    </form>
  )
}
