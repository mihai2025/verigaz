"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { EquipmentType } from "@/lib/equipment/catalog"
import {
  overrideDefaultEquipment,
  resetOverride,
  createCustomEquipment,
  updateCustomEquipment,
  deleteCustomEquipment,
} from "./actions"

function formatMonths(m: number | null): string {
  if (m == null) return "—"
  if (m % 12 === 0) return `${m / 12} ${m === 12 ? "an" : "ani"} (${m} luni)`
  return `${m} luni`
}

export default function EchipamenteClient({ catalog }: { catalog: EquipmentType[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  function run(promise: Promise<{ ok: boolean; error?: string }>, onOk?: () => void) {
    startTransition(async () => {
      setError(null)
      const res = await promise
      if (!res.ok) setError(res.error ?? "Eroare.")
      else {
        onOk?.()
        router.refresh()
      }
    })
  }

  function onSaveOverride(e: React.FormEvent<HTMLFormElement>, defaultId: number) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    run(overrideDefaultEquipment(defaultId, fd), () => setEditing(null))
  }

  function onSaveCustomUpdate(e: React.FormEvent<HTMLFormElement>, firmEquipmentId: string) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    run(updateCustomEquipment(firmEquipmentId, fd), () => setEditing(null))
  }

  function onCreateCustom(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    run(createCustomEquipment(fd), () => { setShowAdd(false); e.currentTarget.reset() })
  }

  return (
    <>
      {error && <div className="auth-error" role="alert">{error}</div>}

      <div className="dash-actions-row" style={{ marginBottom: "1rem" }}>
        <button
          type="button"
          disabled={pending}
          className="dash-btn dash-btn--primary"
          onClick={() => { setShowAdd((v) => !v); setEditing(null) }}
        >
          {showAdd ? "Anulează" : "+ Adaugă tip custom"}
        </button>
      </div>

      {showAdd && (
        <section className="dash-card">
          <h2>Tip custom nou</h2>
          <form onSubmit={onCreateCustom} className="dash-form">
            <EquipmentFields />
            <button type="submit" disabled={pending} className="dash-btn dash-btn--primary">
              {pending ? "Se salvează…" : "Adaugă"}
            </button>
          </form>
        </section>
      )}

      <table className="dash-table">
        <thead>
          <tr>
            <th>Nume</th>
            <th>Sursă</th>
            <th>Verificare</th>
            <th>Revizie</th>
            <th>Categorie</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {catalog.map((e) => (
            <tr key={e.id} className={!e.is_active ? "dash-row--inactive" : ""}>
              <td>
                <strong>{e.nume}</strong>
                {e.descriere && <div className="dash-subtle">{e.descriere}</div>}
              </td>
              <td>
                {e.source === "default" && <span className="dash-status dash-status--default">default</span>}
                {e.source === "override" && <span className="dash-status dash-status--active">override firmă</span>}
                {e.source === "custom" && <span className="dash-status dash-status--custom">custom</span>}
              </td>
              <td>{formatMonths(e.verificare_months)}</td>
              <td>{formatMonths(e.revizie_months)}</td>
              <td>{e.service_category_slug ? <code>{e.service_category_slug}</code> : "—"}</td>
              <td>{e.is_active ? "activ" : "inactiv"}</td>
              <td>
                <div className="dash-actions-row">
                  <button
                    type="button"
                    disabled={pending}
                    className="dash-btn dash-btn--ghost"
                    onClick={() => setEditing(editing === e.id ? null : e.id)}
                  >
                    {editing === e.id ? "Anulează" : e.source === "default" ? "Override" : "Editează"}
                  </button>
                  {e.source === "override" && e.defaultEquipmentId != null && (
                    <button
                      type="button"
                      disabled={pending}
                      className="dash-btn dash-btn--ghost"
                      onClick={() => run(resetOverride(e.defaultEquipmentId!))}
                    >
                      Reset la default
                    </button>
                  )}
                  {e.source === "custom" && e.firmEquipmentId && (
                    <button
                      type="button"
                      disabled={pending}
                      className="dash-btn dash-btn--ghost"
                      onClick={() => {
                        if (confirm("Șterge definitiv acest tip custom?")) {
                          run(deleteCustomEquipment(e.firmEquipmentId!))
                        }
                      }}
                    >
                      Șterge
                    </button>
                  )}
                </div>

                {editing === e.id && (
                  <form
                    onSubmit={(ev) =>
                      e.source === "custom" && e.firmEquipmentId
                        ? onSaveCustomUpdate(ev, e.firmEquipmentId)
                        : e.defaultEquipmentId != null
                          ? onSaveOverride(ev, e.defaultEquipmentId)
                          : null
                    }
                    className="dash-form"
                    style={{ marginTop: "0.75rem", padding: "0.75rem", background: "#f8fafc" }}
                  >
                    <EquipmentFields initial={e} />
                    <button type="submit" disabled={pending} className="dash-btn dash-btn--primary">
                      {pending ? "Se salvează…" : "Salvează"}
                    </button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

function EquipmentFields({ initial }: { initial?: EquipmentType }) {
  return (
    <>
      <label className="dash-field">
        <span>Nume *</span>
        <input name="nume" required defaultValue={initial?.nume ?? ""} maxLength={120} />
      </label>
      <label className="dash-field">
        <span>Descriere</span>
        <textarea name="descriere" defaultValue={initial?.descriere ?? ""} rows={2} maxLength={500} />
      </label>
      <div className="booking-row">
        <label className="dash-field">
          <span>Verificare (luni)</span>
          <input
            name="verificare_months"
            type="number"
            min={0}
            max={360}
            defaultValue={initial?.verificare_months ?? ""}
            placeholder="ex: 24 pentru gaz, 60 pentru detector"
          />
        </label>
        <label className="dash-field">
          <span>Revizie (luni)</span>
          <input
            name="revizie_months"
            type="number"
            min={0}
            max={360}
            defaultValue={initial?.revizie_months ?? ""}
            placeholder="ex: 120 pentru instalație gaz"
          />
        </label>
      </div>
      <label className="dash-field">
        <span>Slug categorie serviciu (pentru reminder routing)</span>
        <input
          name="service_category_slug"
          defaultValue={initial?.service_category_slug ?? ""}
          maxLength={60}
          placeholder="ex: verificare-instalatie, service-detector"
        />
      </label>
      <label className="booking-checkbox">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={initial?.is_active !== false}
        />
        <span>Activ</span>
      </label>
    </>
  )
}
