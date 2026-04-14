"use client"

import { useState, useTransition } from "react"
import {
  confirmBooking,
  rejectBooking,
  completeBooking,
  saveInternalNote,
  assignTechnician,
} from "./actions"

type Employee = { id: string; full_name: string }

type Props = {
  bookingId: string
  status: string
  initialNote: string
  initialScheduled: string | null
  initialPriceFinal: number | null
  initialTechnicianId?: string | null
  employees?: Employee[]
}

function toDateTimeLocal(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function BookingActions({
  bookingId,
  status,
  initialNote,
  initialScheduled,
  initialPriceFinal,
  initialTechnicianId,
  employees = [],
}: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState(initialNote)
  const [scheduled, setScheduled] = useState(toDateTimeLocal(initialScheduled))
  const [priceFinal, setPriceFinal] = useState(initialPriceFinal != null ? String(initialPriceFinal) : "")
  const [rejectReason, setRejectReason] = useState("")
  const [technicianId, setTechnicianId] = useState<string>(initialTechnicianId ?? "")

  function run(promise: Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      setError(null)
      const res = await promise
      if (!res.ok) setError(res.error ?? "Eroare necunoscută.")
    })
  }

  const canConfirm = status === "pending"
  const canReject = status === "pending" || status === "confirmed"
  const canComplete = status === "confirmed" || status === "scheduled" || status === "in_progress"
  const canGenerate = status === "completed"

  const [docUrl, setDocUrl] = useState<string | null>(null)

  async function generateDocument() {
    setError(null); setDocUrl(null)
    // Preia numele tehnicianului selectat (dacă e)
    const tech = employees.find((e) => e.id === technicianId)
    startTransition(async () => {
      const res = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bookingId, technician: tech?.full_name }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? `Eroare ${res.status}`)
        return
      }
      setDocUrl(data.fileUrl)
    })
  }

  return (
    <section className="dash-card">
      <h2>Acțiuni</h2>
      {error && <div className="auth-error" role="alert">{error}</div>}

      <div className="dash-actions-row">
        <label className="dash-field">
          <span>Tehnician asignat</span>
          <select
            value={technicianId}
            onChange={(e) => setTechnicianId(e.target.value)}
          >
            <option value="">— neasignat —</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.full_name}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={pending}
          className="dash-btn dash-btn--ghost"
          onClick={() => run(assignTechnician(bookingId, technicianId || null))}
        >
          Salvează asignarea
        </button>
        {employees.length === 0 && (
          <span className="dash-subtle">Adaugă întâi angajați la <a href="/dashboard/salariati">Salariați</a>.</span>
        )}
      </div>

      {canConfirm && (
        <div className="dash-actions-row">
          <label className="dash-field">
            <span>Programează la</span>
            <input
              type="datetime-local"
              value={scheduled}
              onChange={(e) => setScheduled(e.target.value)}
            />
          </label>
          <button
            type="button"
            disabled={pending}
            className="dash-btn dash-btn--primary"
            onClick={() => run(confirmBooking(bookingId, scheduled || undefined))}
          >
            {scheduled ? "Confirmă + programează" : "Confirmă"}
          </button>
        </div>
      )}

      {canReject && (
        <div className="dash-actions-row">
          <label className="dash-field">
            <span>Motiv respingere (opțional)</span>
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              maxLength={200}
            />
          </label>
          <button
            type="button"
            disabled={pending}
            className="dash-btn dash-btn--ghost"
            onClick={() => run(rejectBooking(bookingId, rejectReason))}
          >
            Respinge
          </button>
        </div>
      )}

      {canComplete && (
        <div className="dash-actions-row">
          <label className="dash-field">
            <span>Preț final (lei)</span>
            <input
              type="number"
              step="0.01"
              value={priceFinal}
              onChange={(e) => setPriceFinal(e.target.value)}
            />
          </label>
          <button
            type="button"
            disabled={pending}
            className="dash-btn dash-btn--primary"
            onClick={() => run(completeBooking(bookingId, priceFinal ? Number(priceFinal) : undefined))}
          >
            Marchează finalizată
          </button>
        </div>
      )}

      {canGenerate && (
        <div className="dash-actions-row">
          <button
            type="button"
            disabled={pending}
            className="dash-btn dash-btn--primary"
            onClick={generateDocument}
          >
            Generează document PDF
          </button>
          {docUrl && (
            <a href={docUrl} target="_blank" rel="noreferrer" className="dash-btn dash-btn--ghost">
              Descarcă PDF ↗
            </a>
          )}
          <span className="dash-subtle">
            Tehnicianul de pe PDF: {employees.find((e) => e.id === technicianId)?.full_name ?? "(neasignat — selectează mai sus)"}
          </span>
        </div>
      )}

      <div className="dash-actions-row">
        <label className="dash-field dash-field--wide">
          <span>Notă internă (nu e vizibilă pentru client)</span>
          <textarea
            rows={3}
            maxLength={1000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <button
          type="button"
          disabled={pending}
          className="dash-btn dash-btn--ghost"
          onClick={() => run(saveInternalNote(bookingId, note))}
        >
          Salvează nota
        </button>
      </div>
    </section>
  )
}
