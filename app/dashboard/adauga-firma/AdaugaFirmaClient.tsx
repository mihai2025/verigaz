"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { createFirm } from "./actions"

type Judet = { id: number; nume: string }
type Localitate = { id: number; nume: string; slug: string; tip: string | null }

const TIP_LABELS: Record<string, string> = {
  sector: "Sectoare",
  municipiu: "Municipii",
  oras: "Orașe",
  comuna: "Comune",
  sat: "Sate",
}
const TIP_ORDER = ["sector", "municipiu", "oras", "comuna", "sat"]

export default function AdaugaFirmaClient({ judete }: { judete: Judet[] }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [judetId, setJudetId] = useState<string>("")
  const [localitati, setLocalitati] = useState<Localitate[]>([])
  const [loadingLoc, setLoadingLoc] = useState(false)

  useEffect(() => {
    if (!judetId) {
      setLocalitati([])
      return
    }
    let cancelled = false
    setLoadingLoc(true)
    fetch(`/api/public/localitati?judet_id=${encodeURIComponent(judetId)}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return
        setLocalitati(Array.isArray(j?.items) ? j.items : [])
      })
      .catch(() => {
        if (!cancelled) setLocalitati([])
      })
      .finally(() => {
        if (!cancelled) setLoadingLoc(false)
      })
    return () => {
      cancelled = true
    }
  }, [judetId])

  const grouped = useMemo(() => {
    const map: Record<string, Localitate[]> = {}
    for (const l of localitati) {
      const key = (l.tip ?? "").toLowerCase() || "altele"
      if (!map[key]) map[key] = []
      map[key].push(l)
    }
    return map
  }, [localitati])

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
        <div className="booking-row">
          <label className="dash-field">
            <span>Județ *</span>
            <select
              name="sediu_judet_id"
              value={judetId}
              onChange={(e) => setJudetId(e.target.value)}
              required
            >
              <option value="">— alege județul —</option>
              {judete.map((j) => (
                <option key={j.id} value={j.id}>{j.nume}</option>
              ))}
            </select>
            {judete.length === 0 && (
              <small style={{ color: "var(--text-500)" }}>
                Lista județelor nu s-a încărcat. Reîncarcă pagina.
              </small>
            )}
          </label>
          <label className="dash-field">
            <span>Localitate</span>
            <select name="sediu_localitate_id" defaultValue="" disabled={!judetId || loadingLoc}>
              <option value="">
                {!judetId
                  ? "— alege întâi județul —"
                  : loadingLoc
                  ? "Se încarcă…"
                  : "— alege localitatea —"}
              </option>
              {TIP_ORDER.map((tip) => {
                const list = grouped[tip]
                if (!list || list.length === 0) return null
                return (
                  <optgroup key={tip} label={TIP_LABELS[tip] ?? tip}>
                    {list.map((l) => (
                      <option key={l.id} value={l.id}>{l.nume}</option>
                    ))}
                  </optgroup>
                )
              })}
              {grouped["altele"] && grouped["altele"].length > 0 && (
                <optgroup label="Alte localități">
                  {grouped["altele"].map((l) => (
                    <option key={l.id} value={l.id}>{l.nume}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>
        </div>
        <label className="dash-field">
          <span>Adresă sediu</span>
          <input name="sediu_adresa" maxLength={200} placeholder="Strada, nr., bloc, etc." />
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
