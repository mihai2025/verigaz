// app/cauta/page.tsx
import type { Metadata } from "next"
import Link from "next/link"
import { searchAll, type SearchFirm } from "@/lib/search/searchAll"
import { slugifyRO } from "@/lib/utils/slugify"
import { CautaTracker } from "./CautaTracker"

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}): Promise<Metadata> {
  const params = await searchParams
  const q = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim() ?? ""

  if (!q) {
    return {
      title: "Căutare servicii gaze",
      description: "Caută firme autorizate ANRE, localități și informații despre verificări, revizii și detectoare de gaze.",
      robots: { index: false, follow: true },
    }
  }
  return {
    title: `${q} – Căutare verigaz`,
    description: `Rezultate pentru „${q}": firme autorizate ANRE, localități și servicii de gaze.`,
    robots: { index: false, follow: true },
  }
}

function pickString(v: string | string[] | undefined): string {
  if (!v) return ""
  return Array.isArray(v) ? (v[0] ?? "") : v
}

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

function FirmSearchCard({ f, index }: { f: SearchFirm; index: number }) {
  const plan = (f.plan || "free").toLowerCase()
  const isPremium = plan === "premium"
  const isPaid = plan !== "free"

  const cardPlanClass =
    isPremium ? "sv-firmPremium" : plan === "plus" ? "sv-firmPlus" : plan === "start" ? "sv-firmStart" : "sv-firmFree"

  const locText = [f.localitate_nume, f.judet_nume].filter(Boolean).join(", ") || "—"

  const coverSrc = f.cover_url || "/imagini/noimage.webp"
  const logoSrc  = f.logo_url  || "/imagini/noimage.webp"

  const tel  = isPaid ? telLink(f.phone || f.whatsapp) : null
  const wa   = isPaid ? waLink(f.whatsapp || f.phone)  : null
  const site = isPaid ? f.website                      : null

  const profileHref = `/firme/${encodeURIComponent(f.slug)}`

  return (
    <article className={`sv-firm sv-firm--3col ${cardPlanClass}`}>
      <Link href={profileHref} className="sv-media sv-media--left" aria-label={`Imagine ${f.name}`} tabIndex={-1}>
        <img
          className="sv-mediaImg"
          src={coverSrc}
          alt={`Imagine reprezentativă: ${f.name}`}
          width={720}
          height={420}
          decoding="async"
          loading={index === 0 ? "eager" : "lazy"}
        />
      </Link>

      <div className="sv-main sv-main--flex">
        <div className="sv-top">
          <div className="sv-nameRow">
            <span className="sv-plan" title={plan.toUpperCase()} aria-label={plan}>
              {isPremium ? "★" : isPaid ? "●" : "○"}
            </span>
            <Link href={profileHref} className="sv-name" style={{ textDecoration: "none", color: "inherit" }}>
              {f.name}
            </Link>
          </div>
        </div>

        <div className="sv-loc" title={locText}>
          <svg className="sv-locIcon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />
          </svg>
          <span className="sv-locText">{locText}</span>
        </div>

        <div className="sv-desc">
          {f.short_description || "Firmă autorizată ANRE pentru verificări, revizii și servicii instalații gaze."}
        </div>
      </div>

      <div className="sv-side">
        <div className="sv-logo">
          <img className="sv-logoImg" src={logoSrc} alt={`Logo ${f.name}`} width={96} height={96} decoding="async" loading="lazy" />
        </div>

        <div className="sv-actions sv-actions--stack">
          {tel
            ? <a href={tel} className="sv-chip sv-chipCall">Sună</a>
            : <span className="sv-chip sv-chipCall sv-disabled" aria-disabled="true">Sună</span>}
          {wa
            ? <a href={wa} target="_blank" rel="noreferrer" className="sv-chip sv-chipWa">WhatsApp</a>
            : <span className="sv-chip sv-chipWa sv-disabled" aria-disabled="true">WhatsApp</span>}
          {site
            ? <a href={site} target="_blank" rel="noreferrer" className="sv-chip sv-chipSite">Site</a>
            : <span className="sv-chip sv-chipSite sv-disabled" aria-disabled="true">Site</span>}
          <Link href={profileHref} className="sv-chip sv-chipProfile">Profilul firmei →</Link>
        </div>
      </div>
    </article>
  )
}

export default async function CautaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const q = pickString(params.q).trim()

  const { firms, pages, localities } = q.length >= 1
    ? await searchAll(q)
    : { firms: [], pages: [], localities: [] }

  const hasResults = firms.length > 0 || pages.length > 0 || localities.length > 0
  const didSearch  = q.length >= 1
  const firmIds    = firms.map((f) => f.id)

  return (
    <div className="cauta-page container">
      {firmIds.length > 0 && <CautaTracker firmIds={firmIds} />}

      <div className="cauta-hero">
        <h1 className="cauta-hero__title">
          {q
            ? <>Rezultate pentru <span className="cauta-hero__q">{"\u201e"}{q}{"\u201d"}</span></>
            : "Căutare"}
        </h1>
        <form method="get" action="/cauta" className="cauta-form">
          <input
            className="cauta-form__input"
            name="q"
            defaultValue={q}
            placeholder="Caută firmă, serviciu, oraș…"
            autoComplete="off"
            autoFocus={!q}
          />
          <button className="cauta-form__btn" type="submit" aria-label="Caută">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M10.5 3.75a6.75 6.75 0 1 0 4.19 12.04l4.42 4.42a.9.9 0 1 0 1.27-1.27l-4.42-4.42A6.75 6.75 0 0 0 10.5 3.75Zm0 1.8a4.95 4.95 0 1 1 0 9.9 4.95 4.95 0 0 1 0-9.9Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </form>
      </div>

      {!didSearch && (
        <div className="cauta-hint">Introdu un termen de căutare (firmă, serviciu, oraș).</div>
      )}

      {didSearch && !hasResults && (
        <div className="cauta-noresults">
          <p>Niciun rezultat pentru <strong>{"\u201e"}{q}{"\u201d"}</strong>.</p>
          <p>Încearcă alt termen sau <Link href="/servicii-gaze">vezi toate serviciile</Link>.</p>
        </div>
      )}

      {didSearch && (
        <section className="cauta-section">
          <div className="cauta-section__hd">
            <h2 className="cauta-section__title">
              Firme autorizate ANRE
              <span className="cauta-section__count">{firms.length}</span>
            </h2>
            <Link href={`/servicii-gaze?q=${encodeURIComponent(q)}`} className="cauta-section__more">
              Toate rezultatele →
            </Link>
          </div>

          {firms.length > 0 ? (
            <div className="sv-firms">
              {firms.map((f, i) => <FirmSearchCard key={f.id} f={f} index={i} />)}
            </div>
          ) : (
            <p className="cauta-empty">Nicio firmă găsită.</p>
          )}
        </section>
      )}

      {didSearch && localities.length > 0 && (
        <section className="cauta-section">
          <div className="cauta-section__hd">
            <h2 className="cauta-section__title">
              Servicii gaze pe localități
              <span className="cauta-section__count">{localities.length}</span>
            </h2>
          </div>
          <div className="cauta-localities">
            {localities.map((loc) => (
              <Link
                key={loc.id}
                href={`/servicii-gaze/${slugifyRO(loc.judet_nume)}/${slugifyRO(loc.nume)}`}
                className="cauta-locality"
              >
                <div className="cauta-locality__icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />
                  </svg>
                </div>
                <div className="cauta-locality__body">
                  <div className="cauta-locality__name">Servicii gaze {loc.nume}</div>
                  <div className="cauta-locality__county">Județul {loc.judet_nume}</div>
                </div>
                <div className="cauta-article__arrow" aria-hidden="true">→</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {didSearch && pages.length > 0 && (
        <section className="cauta-section">
          <div className="cauta-section__hd">
            <h2 className="cauta-section__title">
              Pagini publice
              <span className="cauta-section__count">{pages.length}</span>
            </h2>
          </div>
          <div className="cauta-articles">
            {pages.map((p) => (
              <Link key={p.href} href={p.href} className="cauta-article">
                <div className="cauta-article__img cauta-article__img--guide" aria-hidden="true">
                  <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="currentColor" d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6Zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2Zm0 14H8V4h12v12Z"/>
                  </svg>
                </div>
                <div className="cauta-article__body">
                  <div className="cauta-article__meta">
                    <span className="cauta-article__tag">{p.tag ?? "pagină"}</span>
                  </div>
                  <div className="cauta-article__title">{p.label}</div>
                  {p.description && <div className="cauta-article__excerpt">{p.description}</div>}
                </div>
                <div className="cauta-article__arrow" aria-hidden="true">→</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
