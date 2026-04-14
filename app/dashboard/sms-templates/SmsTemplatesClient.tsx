"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { deleteSmsTemplate, previewSmsTemplate, upsertSmsTemplate } from "./actions"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any

export default function SmsTemplatesClient({ templates }: { templates: Row[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [preview, setPreview] = useState<{ body: string; length: number; truncated: boolean } | null>(null)

  function run(promise: Promise<{ ok: boolean; error?: string }>, onOk?: () => void) {
    startTransition(async () => {
      setError(null)
      const res = await promise
      if (!res.ok) setError(res.error ?? "Eroare.")
      else { onOk?.(); router.refresh() }
    })
  }

  async function doPreview(reminderType: string, template: string, maxChars: number) {
    setPreview(null)
    const res = await previewSmsTemplate(reminderType, template, maxChars)
    if (res.ok) setPreview({ body: res.body, length: res.length, truncated: res.truncated })
    else setError(res.error)
  }

  function onSave(e: React.FormEvent<HTMLFormElement>, id: string | null) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    run(upsertSmsTemplate(id, fd), () => {
      setEditingId(null)
      setPreview(null)
    })
  }

  return (
    <>
      {error && <div className="auth-error" role="alert">{error}</div>}

      {templates.length === 0 ? (
        <p className="dash-note">Nu sunt template-uri salvate. Dispatcher-ul folosește fallback hardcoded.</p>
      ) : (
        <table className="dash-table">
          <thead>
            <tr>
              <th>Tip reminder</th>
              <th>Template</th>
              <th>Max</th>
              <th>Status</th>
              <th>Actualizat</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => {
              const isEditing = editingId === t.id
              return (
                <>
                  <tr key={t.id} className={!t.is_active ? "dash-row--inactive" : ""}>
                    <td><code>{t.reminder_type}</code></td>
                    <td style={{ maxWidth: 480 }}>
                      {t.template}
                      {t.description && <div className="dash-subtle">{t.description}</div>}
                    </td>
                    <td>{t.max_chars}</td>
                    <td>{t.is_active ? "activ" : "inactiv"}</td>
                    <td>{t.updated_at ? new Date(t.updated_at).toLocaleDateString("ro-RO") : "—"}</td>
                    <td>
                      <div className="dash-actions-row">
                        <button
                          type="button"
                          disabled={pending}
                          className="dash-btn dash-btn--ghost"
                          onClick={() => {
                            setEditingId(isEditing ? null : t.id)
                            setPreview(null)
                          }}
                        >
                          {isEditing ? "Anulează" : "Editează"}
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          className="dash-btn dash-btn--ghost"
                          onClick={() => doPreview(t.reminder_type, t.template, t.max_chars)}
                        >
                          Preview
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          className="dash-btn dash-btn--ghost"
                          onClick={() => {
                            if (confirm(`Șterge template-ul pentru ${t.reminder_type}?`)) {
                              run(deleteSmsTemplate(t.id))
                            }
                          }}
                        >
                          Șterge
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isEditing && (
                    <tr>
                      <td colSpan={6}>
                        <form onSubmit={(ev) => onSave(ev, t.id)} className="dash-form">
                          <TemplateFields initial={t} onPreview={(rt, tpl, mc) => doPreview(rt, tpl, mc)} />
                          <button type="submit" disabled={pending} className="dash-btn dash-btn--primary">
                            {pending ? "Se salvează…" : "Salvează"}
                          </button>
                        </form>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      )}

      {preview && (
        <div className="dash-card sms-preview">
          <h3>Preview SMS</h3>
          <p className="sms-preview__body">{preview.body}</p>
          <p className={`dash-subtle ${preview.truncated ? "sms-preview--truncated" : ""}`}>
            Lungime: <strong>{preview.length}</strong> caractere
            {preview.truncated && " — CLIP (truncat la max_chars)"}
          </p>
        </div>
      )}
    </>
  )
}

function TemplateFields({
  initial,
  onPreview,
}: {
  initial?: Row
  onPreview?: (reminderType: string, template: string, maxChars: number) => void
}) {
  const [reminderType, setReminderType] = useState(initial?.reminder_type ?? "")
  const [template, setTemplate] = useState(initial?.template ?? "")
  const [maxChars, setMaxChars] = useState(initial?.max_chars ?? 160)

  return (
    <>
      <div className="booking-row">
        <label className="dash-field">
          <span>Tip reminder *</span>
          <select
            name="reminder_type"
            value={reminderType}
            onChange={(e) => setReminderType(e.target.value)}
            required
            disabled={!!initial}
          >
            <option value="">— alege —</option>
            <option value="verificare_24m">verificare_24m (2 ani instalație)</option>
            <option value="revizie_120m">revizie_120m (10 ani instalație)</option>
            <option value="service_detector_12m">service_detector_12m (anual detector)</option>
            <option value="iscir_centrala">iscir_centrala (VTP centrală)</option>
            <option value="contract_service">contract_service (reînnoire service)</option>
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
        <input name="description" defaultValue={initial?.description ?? ""} maxLength={200} />
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
        <small className="dash-subtle">
          Caractere brute: {template.length}. După substituire + strip diacritice, clip la max_chars.
        </small>
      </label>
      <label className="booking-checkbox">
        <input type="checkbox" name="is_active" defaultChecked={initial?.is_active !== false} />
        <span>Activ (folosit de dispatcher)</span>
      </label>
      <div className="dash-actions-row">
        <button
          type="button"
          className="dash-btn dash-btn--ghost"
          onClick={() => onPreview?.(reminderType, template, maxChars)}
          disabled={!reminderType || !template}
        >
          Preview
        </button>
      </div>
    </>
  )
}
