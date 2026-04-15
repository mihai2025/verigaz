"use client"

import Link from "next/link"

type Firm = {
  slug: string
  name: string
  phone: string | null
  whatsapp: string | null
  email: string | null
  website: string | null
  facebook_url: string | null
  instagram_url: string | null
  sediu_adresa: string | null
  sediu_localitate_nume: string | null
  sediu_judet_nume: string | null
  anre_authorization_no: string | null
  anre_category: string | null
  anre_valid_until: string | null
  plan: string | null
}

function normalizePhone(raw?: string | null) {
  if (!raw) return null
  const digits = String(raw).replace(/[^\d+]/g, "")
  if (!digits) return null
  return digits.startsWith("0") ? `+4${digits}` : digits
}
function telLink(raw?: string | null) {
  const n = normalizePhone(raw)
  return n ? `tel:${n}` : null
}
function waLink(raw?: string | null) {
  const n = normalizePhone(raw)
  return n ? `https://wa.me/${n.replace("+", "")}` : null
}
function safeUrl(raw?: string | null) {
  const v = String(raw || "").trim()
  if (!v) return null
  return v.startsWith("http") ? v : `https://${v}`
}

export function FirmaAside({ firm }: { firm: Firm }) {
  const plan = String(firm.plan || "free").toLowerCase()
  const canAll = plan === "start" || plan === "plus" || plan === "premium"
  const tel = canAll ? telLink(firm.phone || firm.whatsapp) : null
  const wa = canAll ? waLink(firm.whatsapp || firm.phone) : null
  const site = canAll ? safeUrl(firm.website) : null
  const fb = canAll ? safeUrl(firm.facebook_url) : null
  const ig = canAll ? safeUrl(firm.instagram_url) : null

  const addrLines = [firm.sediu_adresa, [firm.sediu_localitate_nume, firm.sediu_judet_nume].filter(Boolean).join(", ")].filter(Boolean)
  const mapsHref = firm.sediu_adresa
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([firm.sediu_adresa, firm.sediu_localitate_nume, firm.sediu_judet_nume].filter(Boolean).join(", "))}`
    : null

  return (
    <div className="firmaAsideInner">
      {/* CONTACT CARD */}
      <div className="firmaAsideCard">
        <div className="firmaAsideCard__title">Contact direct</div>

        {tel ? (
          <a href={tel} className="firmaAsideBtn firmaAsideBtn--call">
            📞 <strong>{firm.phone}</strong>
          </a>
        ) : (
          <div className="firmaAsideBtn firmaAsideBtn--locked">
            🔒 Telefon disponibil pe plan Start/Premium
          </div>
        )}

        {wa && (
          <a href={wa} target="_blank" rel="noreferrer" className="firmaAsideBtn firmaAsideBtn--wa">
            💬 WhatsApp
          </a>
        )}

        {firm.email && (
          <a href={`mailto:${firm.email}`} className="firmaAsideBtn firmaAsideBtn--email">
            ✉ Trimite email
          </a>
        )}

        {site && (
          <a href={site} target="_blank" rel="noreferrer" className="firmaAsideBtn firmaAsideBtn--site">
            🌐 Vizitează site-ul
          </a>
        )}

        <Link href={`/programare?firma=${encodeURIComponent(firm.slug)}`} className="firmaAsideBtn firmaAsideBtn--primary">
          Programează online →
        </Link>
      </div>

      {/* LOCATION CARD */}
      {addrLines.length > 0 && (
        <div className="firmaAsideCard">
          <div className="firmaAsideCard__title">📍 Adresă sediu</div>
          <div className="firmaAsideAddr">
            {addrLines.map((l, i) => <div key={i}>{l}</div>)}
          </div>
          {mapsHref && (
            <a href={mapsHref} target="_blank" rel="noreferrer" className="firmaAsideBtn firmaAsideBtn--nav">
              Navighează cu Google Maps →
            </a>
          )}
        </div>
      )}

      {/* ANRE CARD */}
      {firm.anre_authorization_no && (
        <div className="firmaAsideCard firmaAsideCard--anre">
          <div className="firmaAsideCard__title">✓ Autorizare ANRE</div>
          <div className="firmaAsideAnre">
            <div><strong>Nr. autorizație:</strong> {firm.anre_authorization_no}</div>
            {firm.anre_category && <div><strong>Categorie:</strong> {firm.anre_category}</div>}
            {firm.anre_valid_until && (
              <div><strong>Valabilă până la:</strong> {new Date(firm.anre_valid_until).toLocaleDateString("ro-RO")}</div>
            )}
            <div className="firmaAsideAnre__note">
              Autorizația e verificată manual de echipa verificari-gaze.ro.
            </div>
          </div>
        </div>
      )}

      {/* SOCIAL CARD */}
      {(fb || ig) && (
        <div className="firmaAsideCard">
          <div className="firmaAsideCard__title">Rețele sociale</div>
          <div className="firmaAsideSocials">
            {fb && <a href={fb} target="_blank" rel="noreferrer" className="firmaAsideSocial firmaAsideSocial--fb">Facebook</a>}
            {ig && <a href={ig} target="_blank" rel="noreferrer" className="firmaAsideSocial firmaAsideSocial--ig">Instagram</a>}
          </div>
        </div>
      )}

      {/* WHY US */}
      <div className="firmaAsideCard">
        <div className="firmaAsideCard__title">De ce verificari-gaze.ro</div>
        <ul className="firmaAsideWhy">
          <li>✓ Autorizație ANRE validată manual</li>
          <li>✓ Certificat digital cu QR public</li>
          <li>✓ Reminder SMS la scadența următoare</li>
          <li>✓ Programare online gratuită</li>
        </ul>
      </div>
    </div>
  )
}
