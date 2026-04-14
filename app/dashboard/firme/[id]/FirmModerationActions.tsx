"use client"

import { useState, useTransition } from "react"
import { approveFirm, rejectFirm, suspendFirm, toggleFirmActive } from "./actions"

export default function FirmModerationActions({
  firmId,
  status,
  isActive,
}: {
  firmId: string
  status: string
  isActive: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [suspendReason, setSuspendReason] = useState("")

  function run(promise: Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      setError(null)
      const res = await promise
      if (!res.ok) setError(res.error ?? "Eroare necunoscută.")
    })
  }

  return (
    <section className="dash-card">
      <h2>Acțiuni moderation</h2>
      {error && <div className="auth-error" role="alert">{error}</div>}

      {status === "pending" && (
        <div className="dash-actions-row">
          <button
            type="button"
            disabled={pending}
            className="dash-btn dash-btn--primary"
            onClick={() => run(approveFirm(firmId))}
          >
            Aprobă firmă
          </button>
          <label className="dash-field">
            <span>Motiv respingere</span>
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              maxLength={300}
            />
          </label>
          <button
            type="button"
            disabled={pending || !rejectReason.trim()}
            className="dash-btn dash-btn--ghost"
            onClick={() => run(rejectFirm(firmId, rejectReason))}
          >
            Respinge
          </button>
        </div>
      )}

      {status === "approved" && (
        <div className="dash-actions-row">
          <label className="dash-field">
            <span>Motiv suspendare</span>
            <input
              type="text"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              maxLength={300}
            />
          </label>
          <button
            type="button"
            disabled={pending || !suspendReason.trim()}
            className="dash-btn dash-btn--ghost"
            onClick={() => run(suspendFirm(firmId, suspendReason))}
          >
            Suspendă
          </button>
        </div>
      )}

      {(status === "rejected" || status === "suspended") && (
        <div className="dash-actions-row">
          <button
            type="button"
            disabled={pending}
            className="dash-btn dash-btn--primary"
            onClick={() => run(approveFirm(firmId))}
          >
            Re-aprobă
          </button>
        </div>
      )}

      <div className="dash-actions-row">
        <span className="dash-subtle">Activă: <strong>{isActive ? "da" : "nu"}</strong></span>
        <button
          type="button"
          disabled={pending}
          className="dash-btn dash-btn--ghost"
          onClick={() => run(toggleFirmActive(firmId, !isActive))}
        >
          {isActive ? "Dezactivează" : "Reactivează"}
        </button>
      </div>
    </section>
  )
}
