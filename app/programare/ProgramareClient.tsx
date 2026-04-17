"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { createBooking } from "./actions"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"
import { slugifyRO } from "@/lib/utils/slugify"
import DateInput from "@/components/ui/DateInput"

type Firm = {
  id: string
  slug: string
  brand_name: string | null
  legal_name: string
  short_description: string | null
  sediu_judet_id: number | null
  sediu_localitate_id: number | null
} | null

type Category = { id: number; slug: string; nume: string }
type Judet = { id: number; nume: string }
type Localitate = { id: number; nume: string; slug: string }

const TIME_WINDOWS = [
  { value: "dimineata",    label: "Dimineața (8–12)" },
  { value: "pranz",        label: "Prânz (12–14)" },
  { value: "dupa-amiaza",  label: "După-amiaza (14–18)" },
  { value: "seara",        label: "Seara (18–20)" },
] as const

export default function ProgramareClient({
  firm,
  categories,
  judete,
  defaultCategorySlug,
  defaultJudetSlug,
  defaultLocalitateSlug,
}: {
  firm: Firm
  categories: Category[]
  judete: Judet[]
  defaultCategorySlug?: string
  defaultJudetSlug: string | null
  defaultLocalitateSlug: string | null
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [categorySlug, setCategorySlug] = useState(defaultCategorySlug ?? "")
  const [judetId, setJudetId] = useState<number | "">(
    defaultJudetSlug
      ? judete.find((j) => slugifyRO(j.nume) === defaultJudetSlug)?.id ?? ""
      : firm?.sediu_judet_id ?? "",
  )
  const [localitateId, setLocalitateId] = useState<number | "">(firm?.sediu_localitate_id ?? "")
  const [localitati, setLocalitati] = useState<Localitate[]>([])
  const [customerType, setCustomerType] = useState("individual")

  useEffect(() => {
    if (!judetId) {
      setLocalitati([])
      return
    }
    let cancelled = false
    const supabase = getSupabaseBrowserClient()
    supabase
      .from("localitati")
      .select("id, nume, slug")
      .eq("judet_id", judetId)
      .order("nume")
      .then(({ data }) => {
        if (cancelled) return
        const list = (data ?? []) as Localitate[]
        setLocalitati(list)
        if (defaultLocalitateSlug) {
          const hit = list.find((l) => l.slug === defaultLocalitateSlug)
          if (hit) setLocalitateId(hit.id)
        }
      })
    return () => { cancelled = true }
  }, [judetId, defaultLocalitateSlug])

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await createBooking(fd)
      // createBooking redirectează pe success; dacă se întoarce aici e error
      if (res && !res.ok) setError(res.error)
    })
  }

  return (
    <form onSubmit={onSubmit} className="booking-form">
      {error && <div className="auth-error" role="alert">{error}</div>}

      {/* Firmă — dacă e preselectată, ascunsă; altfel necesită click din listing */}
      {firm ? (
        <section className="booking-section">
          <h2>Firma aleasă</h2>
          <div className="booking-firm">
            <div>
              <strong>{firm.brand_name || firm.legal_name}</strong>
              {firm.short_description && <div className="dash-subtle">{firm.short_description}</div>}
            </div>
            <Link href={`/firme/${firm.slug}`} className="dash-btn dash-btn--ghost">
              Profil firmă →
            </Link>
          </div>
          <input type="hidden" name="firm_slug" value={firm.slug} />
        </section>
      ) : (
        <section className="booking-section booking-warning">
          <p>
            Nu ai selectat o firmă. {" "}
            <Link href="/servicii-gaze">Alege o firmă din listă</Link>{" "}
            pentru a continua.
          </p>
          <input type="hidden" name="firm_slug" value="" />
        </section>
      )}

      <section className="booking-section">
        <h2>Serviciu dorit</h2>
        <label className="booking-field">
          <span>Ce ai nevoie? *</span>
          <select
            name="category_slug"
            required
            value={categorySlug}
            onChange={(e) => setCategorySlug(e.target.value)}
          >
            <option value="">— alege —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>{c.nume}</option>
            ))}
          </select>
        </label>
      </section>

      <section className="booking-section">
        <h2>Adresa instalației</h2>
        <label className="booking-field">
          <span>Tip proprietate *</span>
          <select name="property_type" defaultValue="apartment">
            <option value="apartment">Apartament</option>
            <option value="house">Casă</option>
            <option value="building">Bloc (administrator)</option>
            <option value="office">Spațiu birouri / comercial</option>
            <option value="association">Asociație de proprietari</option>
          </select>
        </label>
        <div className="booking-row">
          <label className="booking-field">
            <span>Județ *</span>
            <select
              name="judet_id"
              required
              value={judetId}
              onChange={(e) => setJudetId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">— alege —</option>
              {judete.map((j) => (
                <option key={j.id} value={j.id}>{j.nume}</option>
              ))}
            </select>
          </label>
          <label className="booking-field">
            <span>Localitate *</span>
            <select
              name="localitate_id"
              required
              disabled={!judetId}
              value={localitateId}
              onChange={(e) => setLocalitateId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">— alege —</option>
              {localitati.map((l) => (
                <option key={l.id} value={l.id}>{l.nume}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="booking-field">
          <span>Stradă + număr *</span>
          <input type="text" name="address" required maxLength={200} />
        </label>
        <div className="booking-row">
          <label className="booking-field">
            <span>Bloc</span>
            <input type="text" name="block_name" maxLength={40} />
          </label>
          <label className="booking-field">
            <span>Scara</span>
            <input type="text" name="stair" maxLength={10} />
          </label>
          <label className="booking-field">
            <span>Etaj</span>
            <input type="text" name="floor" maxLength={10} />
          </label>
          <label className="booking-field">
            <span>Apartament</span>
            <input type="text" name="apartment" maxLength={10} />
          </label>
        </div>
      </section>

      <section className="booking-section">
        <h2>Când preferi</h2>
        <div className="booking-row">
          <label className="booking-field">
            <span>Data preferată</span>
            <DateInput name="preferred_date" />
          </label>
          <label className="booking-field">
            <span>Intervalul orar</span>
            <select name="preferred_time_window" defaultValue="">
              <option value="">— flexibil —</option>
              {TIME_WINDOWS.map((w) => (
                <option key={w.value} value={w.value}>{w.label}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="booking-section">
        <h2>Datele tale</h2>
        <label className="booking-field">
          <span>Tip client *</span>
          <select name="customer_type" value={customerType} onChange={(e) => setCustomerType(e.target.value)}>
            <option value="individual">Persoană fizică</option>
            <option value="business">Persoană juridică (firmă)</option>
            <option value="association">Asociație de proprietari</option>
          </select>
        </label>

        {customerType === "individual" ? (
          <>
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
              <span>CNP (opțional — necesar doar pentru facturare)</span>
              <input type="text" name="cnp" inputMode="numeric" pattern="\d{13}" maxLength={13} autoComplete="off" />
            </label>
          </>
        ) : (
          <>
            <label className="booking-field">
              <span>
                {customerType === "association" ? "Denumire asociație *" : "Denumire firmă *"}
              </span>
              <input type="text" name="company_name" required maxLength={200} />
            </label>
            <label className="booking-field">
              <span>CUI {customerType === "business" ? "*" : "(opțional)"}</span>
              <input
                type="text"
                name="cui"
                required={customerType === "business"}
                maxLength={20}
                autoComplete="off"
              />
            </label>
          </>
        )}

        <div className="booking-row">
          <label className="booking-field">
            <span>Telefon *</span>
            <input type="tel" name="phone" required maxLength={30} autoComplete="tel" placeholder="07..." />
          </label>
          <label className="booking-field">
            <span>Email</span>
            <input type="email" name="email" maxLength={120} autoComplete="email" />
          </label>
        </div>
        <label className="booking-field">
          <span>Observații (opțional)</span>
          <textarea name="notes" rows={3} maxLength={1000} />
        </label>
      </section>

      <label className="booking-checkbox">
        <input type="checkbox" name="consent_gdpr" value="1" required />
        <span>
          Sunt de acord cu prelucrarea datelor conform{" "}
          <Link href="/confidentialitate">politicii de confidențialitate</Link>. Firma te contactează doar pentru această programare.
        </span>
      </label>

      <button
        type="submit"
        disabled={pending || !firm}
        className="booking-btn booking-btn--primary"
      >
        {pending ? "Se trimite…" : "Trimite cererea"}
      </button>
    </form>
  )
}
