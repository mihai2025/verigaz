// components/firms/FirmListItem.tsx
// Card reutilizabil portat stilistic din ghidulfunerar (sv-firm).
// Logo fallback = SVG cu inițialele firmei (fără SRL) când nu există logo_url.
import Link from "next/link"
import type { FirmListRow } from "@/lib/firms/fetchByGeo"
import { FirmLogo } from "./FirmLogo"
import { cleanFirmName } from "@/lib/utils/firmInitials"

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

function CoverFallback({ name }: { name: string }) {
  return (
    <div className="sv-media-fallback">
      <FirmLogo firmName={name} size={180} logoUrl={null} />
    </div>
  )
}

export function FirmListItem({ f, index = 0 }: { f: FirmListRow; index?: number }) {
  const displayName = cleanFirmName(f.brand_name || f.legal_name) || f.legal_name
  const plan = (f.plan || "free").toLowerCase()
  const isPremium = plan === "premium"
  const isPlus = plan === "plus"
  const isPaid = plan !== "free"

  const cardCls = `sv-firm sv-firm--3col ${
    isPremium ? "sv-firmPremium" : isPlus ? "sv-firmPlus" : plan === "start" ? "sv-firmStart" : "sv-firmFree"
  }`
  const starClass = isPremium ? "sv-starPremium" : plan === "start" ? "sv-starStart" : "sv-starFree"
  const starIcon = isPaid ? "★" : "☆"

  const tel  = telLink(f.phone || f.whatsapp)
  const wa   = waLink(f.whatsapp || f.phone)
  const site = isPaid ? f.website : null

  const profileHref = `/firme/${encodeURIComponent(f.slug)}`

  return (
    <article className={cardCls}>
      {/* Col 1: Cover */}
      <Link href={profileHref} className="sv-media sv-media--left" aria-label={`Profil ${displayName}`} tabIndex={-1}>
        {f.cover_url ? (
          <img
            className="sv-mediaImg"
            src={f.cover_url}
            alt={`Imagine reprezentativă ${displayName}`}
            width={720}
            height={420}
            decoding="async"
            loading={index === 0 ? "eager" : "lazy"}
          />
        ) : (
          <CoverFallback name={f.brand_name || f.legal_name} />
        )}
      </Link>

      {/* Col 2: Main info */}
      <div className="sv-main sv-main--flex">
        <div className="sv-top">
          <div className="sv-nameRow">
            <span className={`sv-star ${starClass}`} title={plan.toUpperCase()} aria-label={plan}>
              {starIcon}
            </span>
            <Link href={profileHref} className="sv-name">
              {displayName}
            </Link>
          </div>
        </div>

        {f.anre_authorization_no && (
          <div className="sv-anre" style={{ fontSize: 12, color: "var(--text-500)", marginTop: 2 }}>
            Aut. ANRE: <code>{f.anre_authorization_no}</code>
          </div>
        )}

        <div className="sv-desc">
          {f.short_description ||
            "Firmă autorizată ANRE pentru verificări, revizii și servicii instalații gaze."}
        </div>
      </div>

      {/* Col 3: Side */}
      <div className="sv-side">
        <div className="sv-logo">
          <FirmLogo
            logoUrl={f.logo_url}
            firmName={f.brand_name || f.legal_name}
            size={96}
            className="sv-logoImg"
          />
        </div>

        <div className="sv-actions sv-actions--stack">
          {tel
            ? <a href={tel} className="sv-chip sv-chipCall"><span>Sună</span></a>
            : <span className="sv-chip sv-chipCall sv-disabled" aria-disabled="true"><span>Sună</span></span>}
          {wa
            ? <a href={wa} target="_blank" rel="noreferrer" className="sv-chip sv-chipWa"><span>WhatsApp</span></a>
            : <span className="sv-chip sv-chipWa sv-disabled" aria-disabled="true"><span>WhatsApp</span></span>}
          {site
            ? <a href={site} target="_blank" rel="noreferrer" className="sv-chip sv-chipSite"><span>Site</span></a>
            : <span className="sv-chip sv-chipSite sv-disabled" aria-disabled="true"><span>Site</span></span>}
          <Link href={profileHref} className="sv-chip sv-chipProfile">
            <span>Profilul firmei →</span>
          </Link>
        </div>
      </div>
    </article>
  )
}
