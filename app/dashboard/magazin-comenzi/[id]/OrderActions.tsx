"use client"

import { useState, useTransition } from "react"
import { updateOrderFulfillment } from "../actions"

const STATUSES = ["processing", "shipped", "delivered", "returned", "cancelled"] as const

export default function OrderActions({
  orderId,
  currentStatus,
  trackingUrl,
  trackingNumber,
  internalNote,
}: {
  orderId: string
  currentStatus: string
  trackingUrl: string
  trackingNumber: string
  internalNote: string
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState(currentStatus)
  const [tUrl, setTUrl] = useState(trackingUrl)
  const [tNum, setTNum] = useState(trackingNumber)
  const [note, setNote] = useState(internalNote)

  function save() {
    setError(null)
    startTransition(async () => {
      const res = await updateOrderFulfillment(orderId, status, {
        trackingUrl: tUrl.trim() || undefined,
        trackingNumber: tNum.trim() || undefined,
        internalNote: note,
      })
      if (!res.ok) setError(res.error)
    })
  }

  return (
    <section className="dash-card">
      <h2>Actualizează comanda</h2>
      {error && <div className="auth-error" role="alert">{error}</div>}

      <label className="dash-field">
        <span>Status livrare</span>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>

      <div className="booking-row">
        <label className="dash-field">
          <span>URL tracking</span>
          <input type="url" value={tUrl} onChange={(e) => setTUrl(e.target.value)} maxLength={400} />
        </label>
        <label className="dash-field">
          <span>Nr. AWB / tracking</span>
          <input type="text" value={tNum} onChange={(e) => setTNum(e.target.value)} maxLength={100} />
        </label>
      </div>

      <label className="dash-field">
        <span>Notă internă</span>
        <textarea rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
      </label>

      <button type="button" disabled={pending} className="dash-btn dash-btn--primary" onClick={save}>
        {pending ? "Se salvează…" : "Salvează"}
      </button>
    </section>
  )
}
