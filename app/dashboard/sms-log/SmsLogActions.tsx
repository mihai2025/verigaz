"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { retrySmsLog, retrySmsToFirm } from "./actions"

type FirmOption = { id: string; label: string }

export default function SmsLogActions({
  smsLogId,
  hasLead,
  candidateFirms,
}: {
  smsLogId: string
  hasLead: boolean
  candidateFirms: FirmOption[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)
  const [pickOpen, setPickOpen] = useState(false)
  const [selectedFirm, setSelectedFirm] = useState<string>("")

  function handleRetry() {
    setMsg(null)
    startTransition(async () => {
      const res = await retrySmsLog(smsLogId)
      setMsg(res.ok ? (res.message ?? "OK") : res.error)
      if (res.ok) router.refresh()
    })
  }

  function handleRetryToFirm() {
    if (!selectedFirm) return
    setMsg(null)
    startTransition(async () => {
      const res = await retrySmsToFirm(smsLogId, selectedFirm)
      setMsg(res.ok ? (res.message ?? "OK") : res.error)
      if (res.ok) {
        setPickOpen(false)
        setSelectedFirm("")
        router.refresh()
      }
    })
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        <button
          type="button"
          className="dash-btn dash-btn--ghost dash-btn--small"
          onClick={handleRetry}
          disabled={pending}
          title="Retrimite la aceeași firmă"
        >
          ↻ Retrimite
        </button>
        {hasLead && candidateFirms.length > 0 && (
          <button
            type="button"
            className="dash-btn dash-btn--ghost dash-btn--small"
            onClick={() => setPickOpen(!pickOpen)}
            disabled={pending}
            title="Retrimite la altă firmă"
          >
            → altă firmă
          </button>
        )}
      </div>
      {pickOpen && (
        <div style={{ display: "flex", gap: 4, marginTop: 2 }}>
          <select
            value={selectedFirm}
            onChange={(e) => setSelectedFirm(e.target.value)}
            style={{ fontSize: 11, padding: "2px 4px", maxWidth: 160 }}
            disabled={pending}
          >
            <option value="">— alege firmă —</option>
            {candidateFirms.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
          <button
            type="button"
            className="dash-btn dash-btn--primary dash-btn--small"
            onClick={handleRetryToFirm}
            disabled={pending || !selectedFirm}
          >
            Trimite
          </button>
        </div>
      )}
      {msg && <div style={{ fontSize: 11, color: msg.startsWith("Eroare") ? "#a01818" : "#1e6b34" }}>{msg}</div>}
    </div>
  )
}
