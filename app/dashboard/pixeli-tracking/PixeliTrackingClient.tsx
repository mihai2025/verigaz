"use client"

import { useState, useTransition } from "react"
import { saveTrackingSettings } from "./actions"
import type { TrackingSettings } from "@/lib/settings/appSettings"

const FIELDS: Array<{
  key: keyof TrackingSettings
  label: string
  placeholder: string
  help: string
}> = [
  {
    key: "fbPixelId",
    label: "Facebook / Meta Pixel ID",
    placeholder: "ex: 123456789012345",
    help: "Events Manager → Pixel. Trimite PageView automat.",
  },
  {
    key: "gaId",
    label: "Google Analytics (GA4)",
    placeholder: "ex: G-XXXXXXXXXX",
    help: "GA4 Measurement ID (începe cu G-). IP-ul vizitatorilor e anonimizat.",
  },
  {
    key: "googleAdsId",
    label: "Google Ads Conversion ID",
    placeholder: "ex: AW-123456789",
    help: "Pentru remarketing + tracking conversii din Ads.",
  },
  {
    key: "googleAdsLabel",
    label: "Google Ads Conv. Label",
    placeholder: "ex: AbCdEfGhIjK",
    help: "Labelul specific conversiei (doar dacă folosești event-uri).",
  },
  {
    key: "snapchatPixelId",
    label: "Snapchat Pixel ID",
    placeholder: "ex: abc123-def456",
    help: "Snap Pixel pentru Snapchat Ads.",
  },
  {
    key: "pinterestTagId",
    label: "Pinterest Tag ID",
    placeholder: "ex: 1234567890",
    help: "Pinterest Conversions Tag.",
  },
]

export default function PixeliTrackingClient({ initial }: { initial: TrackingSettings }) {
  const [pending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMsg(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await saveTrackingSettings(fd)
      if (res.ok) setMsg({ kind: "ok", text: "Setările au fost salvate. Hard refresh pentru a reîncărca scripturile." })
      else setMsg({ kind: "err", text: res.error })
    })
  }

  return (
    <form onSubmit={onSubmit} className="dash-form" style={{ maxWidth: 700 }}>
      {msg && (
        <div
          role="status"
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            background: msg.kind === "ok" ? "#e6f4ea" : "#fde8e8",
            color: msg.kind === "ok" ? "#1e6b34" : "#a01818",
            border: `1px solid ${msg.kind === "ok" ? "#b7dfc3" : "#f0b4b4"}`,
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          {msg.text}
        </div>
      )}

      <fieldset className="dash-fieldset">
        <legend>ID-uri tracking</legend>

        {FIELDS.map((f) => (
          <label key={f.key} className="dash-field">
            <span>{f.label}</span>
            <input
              name={f.key}
              type="text"
              defaultValue={initial[f.key]}
              placeholder={f.placeholder}
              maxLength={100}
              autoComplete="off"
              spellCheck={false}
            />
            <small style={{ color: "var(--text-500)" }}>{f.help}</small>
          </label>
        ))}
      </fieldset>

      <div style={{ marginTop: 16, padding: 12, background: "var(--surface-2)", borderRadius: 8, fontSize: 13 }}>
        <strong>Note:</strong>
        <ul style={{ margin: "6px 0 0", paddingLeft: 20 }}>
          <li>Câmpurile goale = scriptul nu se încarcă pentru acel provider</li>
          <li>Modificările se propagă imediat pe toate paginile (revalidate layout)</li>
          <li>Toate scripturile încarcă cu <code>strategy=&quot;afterInteractive&quot;</code> (nu blochează randarea)</li>
          <li>GDPR: pentru conformitate, folosește CookieBanner ca să ceri consimțământul înainte de a activa tracking</li>
        </ul>
      </div>

      <button type="submit" disabled={pending} className="dash-btn dash-btn--primary" style={{ marginTop: 16 }}>
        {pending ? "Se salvează…" : "Salvează setările"}
      </button>
    </form>
  )
}
