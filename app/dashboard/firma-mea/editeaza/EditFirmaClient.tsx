"use client"

import { useState, useTransition } from "react"
import { updateFirmProfile } from "./actions"

type Initial = Record<string, string | null>

export default function EditFirmaClient({ initial }: { initial: Initial }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null); setSaved(false)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await updateFirmProfile(fd)
      if (!res.ok) setError(res.error)
      else setSaved(true)
    })
  }

  const v = (k: string) => initial[k] ?? ""

  return (
    <form onSubmit={onSubmit} className="dash-form">
      {error && <div className="auth-error" role="alert">{error}</div>}
      {saved && <div className="auth-notice">Profil actualizat.</div>}

      <fieldset className="dash-fieldset">
        <legend>Profil public</legend>
        <label className="dash-field">
          <span>Denumire comercială <em>(afișat pe site)</em></span>
          <input name="brand_name" defaultValue={v("brand_name")} maxLength={120} />
        </label>
        <label className="dash-field">
          <span>Denumire legală</span>
          <input defaultValue={v("legal_name")} maxLength={200} disabled />
        </label>
        <label className="dash-field">
          <span>Descriere scurtă (afișată pe card, max 240)</span>
          <textarea name="short_description" defaultValue={v("short_description")} maxLength={240} rows={2} />
        </label>
        <label className="dash-field">
          <span>Descriere completă (profil)</span>
          <textarea name="description" defaultValue={v("description")} maxLength={4000} rows={6} />
        </label>
      </fieldset>

      <fieldset className="dash-fieldset">
        <legend>Contact</legend>
        <label className="dash-field">
          <span>Telefon principal</span>
          <input name="phone" defaultValue={v("phone")} type="tel" maxLength={30} />
        </label>
        <label className="dash-field">
          <span>Telefon secundar</span>
          <input name="phone_secondary" defaultValue={v("phone_secondary")} type="tel" maxLength={30} />
        </label>
        <label className="dash-field">
          <span>Email</span>
          <input name="email" defaultValue={v("email")} type="email" maxLength={120} />
        </label>
        <label className="dash-field">
          <span>WhatsApp</span>
          <input name="whatsapp" defaultValue={v("whatsapp")} type="tel" maxLength={30} />
        </label>
        <label className="dash-field">
          <span>Site web</span>
          <input name="website" defaultValue={v("website")} type="url" maxLength={200} placeholder="https://…" />
        </label>
        <label className="dash-field">
          <span>Facebook URL</span>
          <input name="facebook_url" defaultValue={v("facebook_url")} type="url" maxLength={200} />
        </label>
        <label className="dash-field">
          <span>Instagram URL</span>
          <input name="instagram_url" defaultValue={v("instagram_url")} type="url" maxLength={200} />
        </label>
      </fieldset>

      <fieldset className="dash-fieldset">
        <legend>Persoană responsabilă</legend>
        <label className="dash-field">
          <span>Nume</span>
          <input name="contact_person_name" defaultValue={v("contact_person_name")} maxLength={120} />
        </label>
        <label className="dash-field">
          <span>Funcție</span>
          <input name="contact_person_role" defaultValue={v("contact_person_role")} maxLength={120} />
        </label>
        <label className="dash-field">
          <span>Telefon</span>
          <input name="contact_person_phone" defaultValue={v("contact_person_phone")} type="tel" maxLength={30} />
        </label>
        <label className="dash-field">
          <span>Email</span>
          <input name="contact_person_email" defaultValue={v("contact_person_email")} type="email" maxLength={120} />
        </label>
      </fieldset>

      <fieldset className="dash-fieldset">
        <legend>Sediu</legend>
        <label className="dash-field">
          <span>Adresă</span>
          <input name="sediu_adresa" defaultValue={v("sediu_adresa")} maxLength={200} />
        </label>
      </fieldset>

      <fieldset className="dash-fieldset">
        <legend>Notificări clienți</legend>
        <label className="dash-field">
          <span>
            Cu câte zile înainte de scadență se trimite notificarea (0–90)
          </span>
          <input
            name="reminder_advance_days"
            type="number"
            min={0}
            max={90}
            defaultValue={v("reminder_advance_days") || "7"}
          />
          <small className="dash-subtle">
            Default: 7. Exemplu: setezi 14 → clientul primește SMS/email cu 2 săptămâni
            înainte să expire verificarea.
          </small>
        </label>
      </fieldset>

      <button type="submit" disabled={pending} className="dash-btn dash-btn--primary">
        {pending ? "Se salvează…" : "Salvează modificările"}
      </button>
    </form>
  )
}
