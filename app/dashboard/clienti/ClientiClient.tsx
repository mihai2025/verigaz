"use client"

import Link from "next/link"
import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { EquipmentType } from "@/lib/equipment/catalog"
import { resolveBullet, type ReminderBullet } from "@/lib/reminders/status"
import { upsertPropertyEquipment, deactivateEquipment } from "./actions"

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
}: {
  customers: Row[]
  properties: Row[]
  equipments: Row[]
  reminders: Row[]
  catalog: EquipmentType[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ propertyId: string; equipmentId: string | null } | null>(null)
  const [search, setSearch] = useState("")

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

  return (
    <>
      {error && <div className="auth-error" role="alert">{error}</div>}

      <div className="dash-search-bar no-print">
        <input
          type="text"
          placeholder="Caută: nume, telefon, email, CNP/CUI, adresă, marcă, model, serie, observații…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="report-search"
          autoFocus
        />
        {search && (
          <button type="button" className="dash-btn dash-btn--ghost" onClick={() => setSearch("")}>
            Șterge
          </button>
        )}
        <span className="dash-subtle">
          {visibleCustomers.length} / {customers.length} clienți
        </span>
      </div>

      {visibleCustomers.length === 0 ? (
        <p className="dash-note">Niciun client găsit{search ? ` pentru „${search}"` : ""}.</p>
      ) : (
        visibleCustomers.map((c) => {
          const custProps = properties.filter((p) => p.customer_id === c.id)
          return (
            <section key={c.id} className="dash-card">
              <header className="dash-client-header">
                <div>
                  <h2>{custName(c)}</h2>
                  <span className="dash-subtle">
                    {c.customer_type === "individual" ? "persoană fizică" : c.customer_type === "association" ? "asociație" : "firmă"}
                    {" · "}
                    <a href={`tel:${c.phone}`}>{c.phone}</a>
                    {c.email && <> · {c.email}</>}
                    {c.cnp && <> · CNP {c.cnp}</>}
                    {c.cui && <> · CUI {c.cui}</>}
                  </span>
                </div>
                <div className="dash-actions-row">
                  <Link
                    href={`/dashboard/clienti/${c.id}`}
                    className="dash-btn dash-btn--primary"
                    title="Fișă client completă cu istoric și export PDF"
                  >
                    📋 Fișă client
                  </Link>
                </div>
              </header>

              {custProps.length === 0 ? (
                <p className="dash-note">Clientul nu are adrese înregistrate.</p>
              ) : (
                custProps.map((p) => {
                  const addrEquipments = equipments.filter((e) => e.property_id === p.id)
                  const isAddingNew = editing?.propertyId === p.id && editing?.equipmentId === null
                  return (
                    <div key={p.id} className="dash-property">
                      <h3 className="dash-property__addr">{addressText(p)}</h3>

                      {addrEquipments.length === 0 ? (
                        <p className="dash-note">Nu sunt echipamente înregistrate pe această adresă.</p>
                      ) : (
                        <table className="dash-table">
                          <thead>
                            <tr>
                              <th></th>
                              <th>Tip</th>
                              <th>Marcă/Model</th>
                              <th>Serie</th>
                              <th>Instalat</th>
                              <th>Scadență verificare</th>
                              <th>Scadență revizie</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {addrEquipments.map((eq) => {
                              const isEditing = editing?.equipmentId === eq.id
                              const typeLabel = eq.firm_equipment_type_id
                                ? catalog.find((c) => c.firmEquipmentId === eq.firm_equipment_type_id)?.nume
                                : catalog.find((c) => c.defaultEquipmentId === eq.equipment_type_id)?.nume
                              return (
                                <>
                                  <tr key={eq.id} className={!eq.is_active ? "dash-row--inactive" : ""}>
                                    <td>{bulletIcon(getBulletForEquipment(eq))}</td>
                                    <td>{typeLabel ?? "—"}</td>
                                    <td>{[eq.brand, eq.model].filter(Boolean).join(" ") || "—"}</td>
                                    <td>{eq.serial_number ? <code>{eq.serial_number}</code> : "—"}</td>
                                    <td>
                                      {eq.installation_date
                                        ? new Date(eq.installation_date).toLocaleDateString("ro-RO")
                                        : eq.manufacture_date
                                          ? `fab. ${new Date(eq.manufacture_date).toLocaleDateString("ro-RO")}`
                                          : "—"}
                                    </td>
                                    <td>
                                      {eq.next_verificare_due
                                        ? new Date(eq.next_verificare_due).toLocaleDateString("ro-RO")
                                        : "—"}
                                    </td>
                                    <td>
                                      {eq.next_revizie_due
                                        ? new Date(eq.next_revizie_due).toLocaleDateString("ro-RO")
                                        : "—"}
                                    </td>
                                    <td>
                                      <div className="dash-actions-row">
                                        <button
                                          type="button"
                                          disabled={pending}
                                          className="dash-btn dash-btn--ghost"
                                          onClick={() =>
                                            setEditing(
                                              isEditing
                                                ? null
                                                : { propertyId: p.id, equipmentId: eq.id },
                                            )
                                          }
                                        >
                                          {isEditing ? "Anulează" : "Editează"}
                                        </button>
                                        {eq.is_active && (
                                          <button
                                            type="button"
                                            disabled={pending}
                                            className="dash-btn dash-btn--ghost"
                                            onClick={() => {
                                              if (confirm("Dezactivezi echipamentul?")) {
                                                run(deactivateEquipment(eq.id))
                                              }
                                            }}
                                          >
                                            Dezactivează
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                  {isEditing && (
                                    <tr>
                                      <td colSpan={8}>
                                        <EquipmentForm
                                          propertyId={p.id}
                                          equipment={eq}
                                          catalog={catalog}
                                          pending={pending}
                                          onSubmit={(ev) => onSubmitEquipment(ev, eq.id)}
                                        />
                                      </td>
                                    </tr>
                                  )}
                                </>
                              )
                            })}
                          </tbody>
                        </table>
                      )}

                      <div className="dash-actions-row">
                        <button
                          type="button"
                          disabled={pending}
                          className="dash-btn dash-btn--primary"
                          onClick={() =>
                            setEditing(isAddingNew ? null : { propertyId: p.id, equipmentId: null })
                          }
                        >
                          {isAddingNew ? "Anulează" : "+ Adaugă echipament"}
                        </button>
                      </div>

                      {isAddingNew && (
                        <EquipmentForm
                          propertyId={p.id}
                          equipment={null}
                          catalog={catalog}
                          pending={pending}
                          onSubmit={(ev) => onSubmitEquipment(ev, null)}
                        />
                      )}
                    </div>
                  )
                })
              )}
            </section>
          )
        })
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
