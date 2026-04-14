// components/firms/FirmListItem.tsx
// Card reutilizabil pentru orice pagină de listing firme (servicii-gaze,
// servicii/[cat]/..., verificari-centrala, revizii-centrala).
import Link from "next/link"
import type { FirmListRow } from "@/lib/firms/fetchByGeo"

function normalizePhone(raw?: string | null) {
  if (!raw) return null
  const digits = raw.replace(/[^\d+]/g, "")
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

export function FirmListItem({ f, index = 0 }: { f: FirmListRow; index?: number }) {
  const name = f.brand_name || f.legal_name
  const plan = (f.plan || "free").toLowerCase()
  const isPremium = plan === "premium"
  const isPaid = plan !== "free"

  const cardCls = `sv-firm sv-firm--${plan}`
  const coverSrc = f.cover_url || "/imagini/noimage.webp"
  const logoSrc  = f.logo_url  || "/imagini/noimage.webp"

  const tel  = isPaid ? telLink(f.phone || f.whatsapp) : null
  const wa   = isPaid ? waLink(f.whatsapp || f.phone)  : null
  const site = isPaid ? f.website                      : null

  const profileHref = `/firme/${encodeURIComponent(f.slug)}`

  return (
    <article className={cardCls}>
      <Link href={profileHref} className="sv-media" aria-label={`Imagine ${name}`} tabIndex={-1}>
        <img
          className="sv-mediaImg"
          src={coverSrc}
          alt={`Imagine ${name}`}
          width={720}
          height={420}
          decoding="async"
          loading={index === 0 ? "eager" : "lazy"}
        />
      </Link>

      <div className="sv-main">
        <div className="sv-nameRow">
          <span className="sv-plan" title={plan.toUpperCase()} aria-label={plan}>
            {isPremium ? "★" : isPaid ? "●" : "○"}
          </span>
          <Link href={profileHref} className="sv-name">{name}</Link>
        </div>

        {f.anre_authorization_no && (
          <div className="sv-anre">
            Aut. ANRE: <code>{f.anre_authorization_no}</code>
          </div>
        )}

        <p className="sv-desc">
          {f.short_description ||
            "Firmă autorizată ANRE pentru verificări, revizii și servicii instalații gaze."}
        </p>
      </div>

      <div className="sv-side">
        <div className="sv-logo">
          <img
            className="sv-logoImg"
            src={logoSrc}
            alt={`Logo ${name}`}
            width={96}
            height={96}
            decoding="async"
            loading="lazy"
          />
        </div>

        <div className="sv-actions">
          {tel
            ? <a href={tel} className="sv-chip sv-chipCall">Sună</a>
            : <span className="sv-chip sv-chipCall sv-disabled">Sună</span>}
          {wa
            ? <a href={wa} target="_blank" rel="noreferrer" className="sv-chip sv-chipWa">WhatsApp</a>
            : <span className="sv-chip sv-chipWa sv-disabled">WhatsApp</span>}
          {site
            ? <a href={site} target="_blank" rel="noreferrer" className="sv-chip sv-chipSite">Site</a>
            : <span className="sv-chip sv-chipSite sv-disabled">Site</span>}
          <Link href={profileHref} className="sv-chip sv-chipProfile">Detalii →</Link>
        </div>
      </div>
    </article>
  )
}
