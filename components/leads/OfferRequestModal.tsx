"use client"

import { useEffect, useState } from "react"

type Props = {
  open: boolean
  onClose: () => void
  // Prefilled values
  defaultJudetId?: number | null
  defaultLocalitateId?: number | null
  firmSlug?: string | null          // dacă e setat → SMS merge la această firmă
  firmName?: string | null          // afișat în titlu pt. context
  source?: string
}

const SERVICES = [
  { slug: "verificare-instalatie", label: "Verificare instalație (2 ani)" },
  { slug: "revizie-instalatie", label: "Revizie instalație (10 ani)" },
  { slug: "montaj-detector", label: "Montaj detector gaz" },
  { slug: "service-detector", label: "Service detector gaz" },
  { slug: "reparatii-instalatie", label: "Reparații instalație" },
  { slug: "verificare-centrala", label: "Verificare centrală (VTP)" },
  { slug: "revizie-centrala", label: "Revizie centrală termică" },
]

type Judet = { id: number; nume: string }

export default function OfferRequestModal({
  open,
  onClose,
  defaultJudetId = null,
  defaultLocalitateId = null,
  firmSlug = null,
  firmName = null,
  source = "modal",
}: Props) {
  const [judete, setJudete] = useState<Judet[]>([])
  const [localitati, setLocalitati] = useState<Array<{ id: number; nume: string }>>([])
  const [judetId, setJudetId] = useState<string>(defaultJudetId ? String(defaultJudetId) : "")
  const [localitateId, setLocalitateId] = useState<string>(defaultLocalitateId ? String(defaultLocalitateId) : "")
  const [loadingLoc, setLoadingLoc] = useState(false)
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  // Load județe la prima deschidere
  useEffect(() => {
    if (!open || judete.length > 0) return
    fetch("/api/geo/judete-public").then((r) => r.json()).then((d) => {
      if (d?.ok) setJudete(d.judete ?? [])
    }).catch(() => {})
  }, [open, judete.length])

  // Cascade localitate
  useEffect(() => {
    if (!judetId) { setLocalitati([]); return }
    setLoadingLoc(true)
    fetch(`/api/geo/localitati-public?judet=${judetId}`)
      .then((r) => r.json())
      .then((d) => { if (d?.ok) setLocalitati(d.localitati ?? []) })
      .catch(() => {})
      .finally(() => setLoadingLoc(false))
  }, [judetId])

  // ESC close + block scroll
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const payload = {
      customerName: String(fd.get("name") ?? ""),
      customerPhone: String(fd.get("phone") ?? ""),
      serviceCategorySlug: String(fd.get("service") ?? ""),
      judetId: Number(fd.get("judet_id")),
      localitateId: Number(fd.get("localitate_id")),
      firmSlug,
      source,
    }
    setPending(true)
    setResult(null)
    try {
      const res = await fetch("/api/leads/request-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const d = await res.json()
      if (d?.ok) setResult({ ok: true, message: d.message ?? "Cererea a fost trimisă." })
      else setResult({ ok: false, message: d?.error ?? "Eroare. Încearcă din nou." })
    } catch {
      setResult({ ok: false, message: "Eroare rețea. Încearcă din nou." })
    } finally {
      setPending(false)
    }
  }

  if (!open) return null

  return (
    <div className="offer-modal" role="dialog" aria-modal="true" aria-labelledby="offer-modal-title" onClick={onClose}>
      <div className="offer-modal__box" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="offer-modal__close" onClick={onClose} aria-label="Închide">×</button>

        {result?.ok ? (
          <div className="offer-modal__success">
            <div className="offer-modal__success-icon">✓</div>
            <h3>Cererea a fost trimisă</h3>
            <p>{result.message}</p>
            <button type="button" onClick={onClose} className="vg-btn vg-btn--primary">OK</button>
          </div>
        ) : (
          <>
            <h3 id="offer-modal-title" className="offer-modal__title">
              {firmName ? `Cere ofertă de la ${firmName}` : "Cere rapid ofertă"}
            </h3>
            <p className="offer-modal__sub">
              Firma autorizată ANRE te contactează în 24h cu prețul și data.
            </p>

            <form onSubmit={handleSubmit} className="offer-modal__form">
              <label className="offer-modal__field">
                <span>Nume *</span>
                <input name="name" type="text" required minLength={3} maxLength={80} autoComplete="name" />
              </label>
              <label className="offer-modal__field">
                <span>Telefon *</span>
                <input name="phone" type="tel" required maxLength={30} autoComplete="tel" placeholder="07XX XXX XXX" />
              </label>
              <label className="offer-modal__field">
                <span>Serviciu *</span>
                <select name="service" required defaultValue="">
                  <option value="" disabled>— alege —</option>
                  {SERVICES.map((s) => <option key={s.slug} value={s.slug}>{s.label}</option>)}
                </select>
              </label>
              <div className="offer-modal__row">
                <label className="offer-modal__field">
                  <span>Județ *</span>
                  <select name="judet_id" required value={judetId} onChange={(e) => { setJudetId(e.target.value); setLocalitateId("") }}>
                    <option value="">— alege —</option>
                    {judete.map((j) => <option key={j.id} value={j.id}>{j.nume}</option>)}
                  </select>
                </label>
                <label className="offer-modal__field">
                  <span>Localitate *</span>
                  <select name="localitate_id" required value={localitateId} onChange={(e) => setLocalitateId(e.target.value)} disabled={!judetId || loadingLoc}>
                    <option value="">{loadingLoc ? "se încarcă…" : judetId ? "— alege —" : "alege județul"}</option>
                    {localitati.map((l) => <option key={l.id} value={l.id}>{l.nume}</option>)}
                  </select>
                </label>
              </div>

              {result && !result.ok && (
                <div className="offer-modal__err">{result.message}</div>
              )}

              <button type="submit" disabled={pending} className="vg-btn vg-btn--primary vg-btn--lg offer-modal__submit">
                {pending ? "Se trimite…" : "Trimite cererea"}
              </button>

              <p className="offer-modal__note">
                SMS absolut <strong>gratuit</strong>. Firma te contactează direct. Nu stocăm card bancar.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
