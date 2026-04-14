"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { previewSmsTemplate, upsertSmsTemplate } from "../actions"

export default function NewSmsTemplateClient() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<{ body: string; length: number; truncated: boolean } | null>(null)
  const [reminderType, setReminderType] = useState("")
  const [template, setTemplate] = useState("")
  const [maxChars, setMaxChars] = useState(160)

  function doPreview() {
    if (!reminderType || !template) return
    setPreview(null)
    startTransition(async () => {
      const res = await previewSmsTemplate(reminderType, template, maxChars)
      if (!res.ok) setError(res.error)
      else setPreview({ body: res.body, length: res.length, truncated: res.truncated })
    })
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await upsertSmsTemplate(null, fd)
      if (!res.ok) setError(res.error)
      else router.push("/dashboard/sms-templates")
    })
  }

  return (
    <>
      {error && <div className="auth-error" role="alert">{error}</div>}
      <form onSubmit={onSubmit} className="dash-form">
        <div className="booking-row">
          <label className="dash-field">
            <span>Tip reminder *</span>
            <select
              name="reminder_type"
              value={reminderType}
              onChange={(e) => setReminderType(e.target.value)}
              required
            >
              <option value="">— alege —</option>
              <option value="verificare_24m">verificare_24m (2 ani instalație)</option>
              <option value="revizie_120m">revizie_120m (10 ani instalație)</option>
              <option value="service_detector_12m">service_detector_12m (anual detector)</option>
              <option value="iscir_centrala">iscir_centrala (VTP centrală)</option>
              <option value="contract_service">contract_service</option>
            </select>
          </label>
          <label className="dash-field">
            <span>Max caractere</span>
            <input
              name="max_chars"
              type="number"
              min={50}
              max={320}
              value={maxChars}
              onChange={(e) => setMaxChars(Number(e.target.value))}
            />
          </label>
        </div>
        <label className="dash-field">
          <span>Descriere</span>
          <input name="description" maxLength={200} />
        </label>
        <label className="dash-field">
          <span>Template *</span>
          <textarea
            name="template"
            required
            rows={3}
            maxLength={400}
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            placeholder="{FIRMA}: {ACTIUNE} {ECHIPAMENT} expira {DATA}. Tel {TELEFON}. Programare: {LINK}"
          />
          <small className="dash-subtle">Brut: {template.length} char</small>
        </label>
        <label className="booking-checkbox">
          <input type="checkbox" name="is_active" defaultChecked />
          <span>Activ</span>
        </label>

        <div className="dash-actions-row">
          <button type="button" className="dash-btn dash-btn--ghost" onClick={doPreview} disabled={!reminderType || !template}>
            Preview
          </button>
          <button type="submit" disabled={pending} className="dash-btn dash-btn--primary">
            {pending ? "Se salvează…" : "Creează template"}
          </button>
        </div>
      </form>

      {preview && (
        <div className="dash-card sms-preview">
          <h3>Preview SMS</h3>
          <p className="sms-preview__body">{preview.body}</p>
          <p className="dash-subtle">
            Lungime: <strong>{preview.length}</strong> / {maxChars}
            {preview.truncated && <> — <span style={{ color: "#c00" }}>CLIP</span></>}
          </p>
        </div>
      )}
    </>
  )
}
