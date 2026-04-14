"use client"

import { useState, useTransition } from "react"
import { createFirm } from "./actions"

type Judet = { id: number; nume: string }

export default function AdaugaFirmaClient({ judete }: { judete: Judet[] }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await createFirm(fd)
      if (res && !res.ok) setError(res.error)
    })
  }

  return (
    <form onSubmit={onSubmit} className="dash-form">
      {error && <div className="auth-error" role="alert">{error}</div>}

      <fieldset className="dash-fieldset">
        <legend>Date firmă</legend>
        <label className="dash-field">
          <span>Denumire legală <em>(ex: SC GAZ TECH SRL)</em> *</span>
          <input name="legal_name" required maxLength={200} />
        </label>
        <label className="dash-field">
          <span>Denumire comercială <em>(afișată pe site)</em></span>
          <input name="brand_name" maxLength={120} />
        </label>
        <label className="dash-field">
          <span>CUI</span>
          <input name="cui" maxLength={20} />
        </label>
      </fieldset>

      <fieldset className="dash-fieldset">
        <legend>Autorizare ANRE</legend>
        <label className="dash-field">
          <span>Nr. autorizație ANRE *</span>
          <input name="anre_authorization_no" required maxLength={60} />
        </label>
        <label className="dash-field">
          <span>Categorie <em>(ex: EDIB, EDSB, IS)</em></span>
          <input name="anre_category" maxLength={20} />
        </label>
      </fieldset>

      <fieldset className="dash-fieldset">
        <legend>Contact</legend>
        <label className="dash-field">
          <span>Telefon</span>
          <input name="phone" type="tel" maxLength={30} />
        </label>
        <label className="dash-field">
          <span>Email</span>
          <input name="email" type="email" maxLength={120} />
        </label>
      </fieldset>

      <fieldset className="dash-fieldset">
        <legend>Sediu</legend>
        <label className="dash-field">
          <span>Județ</span>
          <select name="sediu_judet_id" defaultValue="">
            <option value="">— alege —</option>
            {judete.map((j) => (
              <option key={j.id} value={j.id}>{j.nume}</option>
            ))}
          </select>
        </label>
        <label className="dash-field">
          <span>Adresă sediu</span>
          <input name="sediu_adresa" maxLength={200} />
        </label>
      </fieldset>

      <label className="dash-field">
        <span>Descriere scurtă <em>(afișată pe card)</em></span>
        <textarea name="short_description" maxLength={240} rows={3} />
      </label>

      <button type="submit" disabled={pending} className="dash-btn dash-btn--primary">
        {pending ? "Se salvează…" : "Trimite pentru validare"}
      </button>
    </form>
  )
}
