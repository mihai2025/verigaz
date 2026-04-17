"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { createBooking } from "@/app/programare/actions"
import DateInput from "@/components/ui/DateInput"

type Firm = {
  id: string
  slug: string
  brand_name: string | null
  legal_name: string
  short_description: string | null
  phone: string | null
}

export default function ProgramareRapidaClient({
  firm,
  category,
}: {
  firm: Firm
  category: { slug: string; nume: string } | null
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)

    // Programare-rapida trimite minimul necesar — câmpurile nepopulate sunt optionale.
    // Addresa lipsește intentionally — firma știe adresa clientului din istoricul său.
    // Setăm fallback "TBD" pentru address ca să treacă validarea actions.createBooking.
    if (!fd.get("address")) fd.set("address", "de comunicat la confirmare")
    if (!fd.get("property_type")) fd.set("property_type", "apartment")
    fd.set("customer_type", "individual")

    startTransition(async () => {
      const res = await createBooking(fd)
      if (res && !res.ok) setError(res.error)
    })
  }

  return (
    <form onSubmit={onSubmit} className="booking-form booking-form--quick">
      {error && <div className="auth-error" role="alert">{error}</div>}

      <input type="hidden" name="firm_slug" value={firm.slug} />
      {category && <input type="hidden" name="category_slug" value={category.slug} />}

      <section className="booking-section">
        {category ? (
          <p className="dash-subtle">
            Serviciu: <strong>{category.nume}</strong>
          </p>
        ) : (
          <label className="booking-field">
            <span>Serviciu dorit *</span>
            <select name="category_slug" required defaultValue="verificare-instalatie">
              <option value="verificare-instalatie">Verificare instalație gaz (2 ani)</option>
              <option value="revizie-instalatie">Revizie instalație gaz (10 ani)</option>
              <option value="verificare-centrala">Verificare centrală termică</option>
              <option value="revizie-centrala">Revizie centrală termică</option>
              <option value="service-detector">Service detector gaz</option>
              <option value="montaj-detector">Montaj detector gaz</option>
              <option value="reparatii-instalatie">Reparații instalație</option>
            </select>
          </label>
        )}
      </section>

      <section className="booking-section">
        <div className="booking-row">
          <label className="booking-field">
            <span>Prenume *</span>
            <input type="text" name="first_name" required maxLength={60} autoComplete="given-name" />
          </label>
          <label className="booking-field">
            <span>Nume *</span>
            <input type="text" name="last_name" required maxLength={60} autoComplete="family-name" />
          </label>
        </div>
        <label className="booking-field">
          <span>Telefon *</span>
          <input type="tel" name="phone" required maxLength={30} autoComplete="tel" placeholder="07..." />
        </label>
      </section>

      <section className="booking-section">
        <div className="booking-row">
          <label className="booking-field">
            <span>Data preferată *</span>
            <DateInput name="preferred_date" required />
          </label>
          <label className="booking-field">
            <span>Interval orar *</span>
            <select name="preferred_time_window" required defaultValue="">
              <option value="">— alege —</option>
              <option value="dimineata">Dimineața (8–12)</option>
              <option value="pranz">Prânz (12–14)</option>
              <option value="dupa-amiaza">După-amiaza (14–18)</option>
              <option value="seara">Seara (18–20)</option>
            </select>
          </label>
        </div>
        <label className="booking-field">
          <span>Observații (opțional)</span>
          <textarea name="notes" rows={2} maxLength={500} placeholder="Ex: apartamentul la etaj 4, soneria nu merge..." />
        </label>
      </section>

      <label className="booking-checkbox">
        <input type="checkbox" name="consent_gdpr" value="1" required />
        <span>
          Accept prelucrarea datelor conform <Link href="/confidentialitate">politicii de confidențialitate</Link>.
        </span>
      </label>

      <button type="submit" disabled={pending} className="booking-btn booking-btn--primary">
        {pending ? "Se trimite…" : "Trimite programarea"}
      </button>

      <p className="dash-subtle booking-quick__note">
        ℹ Programarea va fi <strong>confirmată de firma instalatoare</strong> ({firm.brand_name || firm.legal_name})
        {firm.phone && <> · Tel. firmă: <a href={`tel:${firm.phone}`}>{firm.phone}</a></>}.
      </p>
    </form>
  )
}
