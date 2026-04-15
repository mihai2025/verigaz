"use client"

import Link from "next/link"
import { FirmLogo } from "@/components/firms/FirmLogo"

type Firm = {
  slug: string
  name: string
  legal_name: string
  cui: string | null
  logo_url: string | null
  cover_url: string | null
  short_description: string | null
  sediu_localitate_nume: string | null
  sediu_judet_nume: string | null
  sediu_judet_slug: string | null
  anre_authorization_no: string | null
  anre_category: string | null
  rating_avg: number | null
  rating_count: number | null
  plan: string | null
}

export function FirmaHero({ firm }: { firm: Firm }) {
  const plan = String(firm.plan || "free").toLowerCase()
  const planBadge = plan === "premium" ? "PREMIUM" : plan === "plus" ? "PLUS" : plan === "start" ? "START" : null
  const locText = [firm.sediu_localitate_nume, firm.sediu_judet_nume].filter(Boolean).join(", ")

  return (
    <section className="firmaHero">
      <div className="firmaHero__cover">
        {firm.cover_url ? (
          <img src={firm.cover_url} alt={`Imagine ${firm.name}`} className="firmaHero__coverImg" />
        ) : (
          <div className="firmaHero__coverPlaceholder" aria-hidden="true" />
        )}
        {planBadge && <span className={`firmaHero__badge firmaHero__badge--${plan}`}>{planBadge}</span>}
      </div>

      <div className="firmaHero__body">
        <div className="firmaHero__logoWrap">
          <FirmLogo logoUrl={firm.logo_url} firmName={firm.name} size={120} className="firmaHero__logo" alt={`Logo ${firm.name}`} />
        </div>

        <div className="firmaHero__titleBlock">
          <h1 className="firmaHero__title">{firm.name}</h1>
          {firm.legal_name && firm.legal_name !== firm.name && (
            <div className="firmaHero__sub">{firm.legal_name}</div>
          )}
          {firm.cui && (
            <div className="firmaHero__meta">CUI: <strong>{firm.cui}</strong></div>
          )}
          {locText && (
            <div className="firmaHero__loc">
              📍 {firm.sediu_localitate_nume && <>{firm.sediu_localitate_nume}, </>}
              {firm.sediu_judet_slug ? (
                <Link href={`/servicii-gaze/${firm.sediu_judet_slug}`}>județul {firm.sediu_judet_nume}</Link>
              ) : (
                <>județul {firm.sediu_judet_nume}</>
              )}
            </div>
          )}
          {firm.anre_authorization_no && (
            <div className="firmaHero__anreBadge">
              ✓ Aut. ANRE <strong>{firm.anre_authorization_no}</strong>
              {firm.anre_category && <> · {firm.anre_category}</>}
            </div>
          )}
          {firm.rating_avg != null && firm.rating_avg > 0 && (
            <div className="firmaHero__rating">
              ★ <strong>{firm.rating_avg.toFixed(1)}</strong>
              {firm.rating_count != null && firm.rating_count > 0 && (
                <span> ({firm.rating_count} recenzii)</span>
              )}
            </div>
          )}
        </div>

        <div className="firmaHero__actions">
          <Link href={`/programare?firma=${encodeURIComponent(firm.slug)}`} className="firmaHero__cta firmaHero__cta--primary">
            Programează online →
          </Link>
        </div>
      </div>

      <nav className="firmaTabs" aria-label="Secțiuni firmă">
        <a href="#prezentare" className="firmaTab">Prezentare</a>
        <a href="#servicii" className="firmaTab">Servicii</a>
        <a href="#contact" className="firmaTab">Contact</a>
      </nav>
    </section>
  )
}
