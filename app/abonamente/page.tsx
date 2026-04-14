// app/abonamente/page.tsx
// Pricing page premium pentru firme autorizate ANRE.
export const revalidate = 300

import type { Metadata } from "next"
import Link from "next/link"
import { PLANS, PLAN_ORDER } from "@/lib/plans/plans"
import { DOMAIN } from "@/lib/config/domain"
import { getPlanPrices } from "@/lib/settings/appSettings"

export const metadata: Metadata = {
  title: `Abonamente pentru firme autorizate ANRE — ${DOMAIN.brandName}`,
  description:
    "Listare gratuită. Planuri plătite: Start 490 lei/an, Plus 890 lei/an, Premium 1.490 lei/an cu exclusivitate locală. Fără comision pe intervenții.",
  alternates: { canonical: "/abonamente" },
}

type Feature = { label: string; free: boolean; start: boolean; plus: boolean; premium: boolean }

const FEATURES: Feature[] = [
  { label: "Listare în directorul național", free: true, start: true, plus: true, premium: true },
  { label: "Telefon + email vizibile public", free: true, start: true, plus: true, premium: true },
  { label: "Primire programări prin platformă", free: true, start: true, plus: true, premium: true },
  { label: "Profil complet cu galerie foto + descriere lungă", free: false, start: true, plus: true, premium: true },
  { label: "Template-uri SMS personalizate firmei", free: false, start: true, plus: true, premium: true },
  { label: "Locații operare extinse (nu doar sediul)", free: false, start: true, plus: true, premium: true },
  { label: "Dashboard analytics complet", free: false, start: true, plus: true, premium: true },
  { label: "Badge Recomandat pe card", free: false, start: false, plus: true, premium: true },
  { label: "Featured placement (top 3 rezultate)", free: false, start: false, plus: true, premium: true },
  { label: "Magazin cu produse nelimitate", free: false, start: false, plus: true, premium: true },
  { label: "Exclusivitate locală (unic firmă listată)", free: false, start: false, plus: false, premium: true },
  { label: "Locații operare nelimitate", free: false, start: false, plus: false, premium: true },
  { label: "Support prioritar (răspuns 24h)", free: false, start: false, plus: false, premium: true },
  { label: "Onboarding dedicat", free: false, start: false, plus: false, premium: true },
]

export default async function Page() {
  const prices = await getPlanPrices()
  const priceOf = (key: string): number => {
    if (key === "free") return 0
    return (prices as Record<string, number>)[key] ?? PLANS[key as keyof typeof PLANS].priceYearly
  }
  return (
    <>
      <section className="vg-hero">
        <div className="vg-hero__inner">
          <span className="vg-hero__eyebrow">Pentru firme ANRE</span>
          <h1 className="vg-hero__title">
            Abonamente <em>pentru creștere</em>
          </h1>
          <p className="vg-hero__sub">
            Listare gratuită în directorul național. Planuri plătite pentru vizibilitate prioritară,
            exclusivitate locală și magazin online. Fără comision pe intervenții.
          </p>
        </div>
      </section>

      <section className="vg-section">
        <div className="container">
          <div className="pricing-grid pricing-grid--4">
            {PLAN_ORDER.map((key) => {
              const p = PLANS[key]
              const isPremium = key === "premium"
              const isPlus = key === "plus"
              const isFree = key === "free"
              return (
                <div key={key} className={`pricing-plan pricing-plan--${key} ${isPremium ? "pricing-plan--featured" : ""}`}>
                  {isPremium && <div className="pricing-plan__ribbon">Cea mai populară</div>}
                  {isPlus && <div className="pricing-plan__ribbon pricing-plan__ribbon--plus">Cel mai bun raport</div>}
                  <h3 className="pricing-plan__name">{p.nume}</h3>
                  <p className="pricing-plan__tagline">{p.tagline}</p>
                  <div className="pricing-plan__price">
                    {isFree ? (
                      <><strong>0</strong><span>lei</span></>
                    ) : (
                      <>
                        <strong>{priceOf(key)}</strong>
                        <span>lei / an</span>
                      </>
                    )}
                  </div>
                  {!isFree && (
                    <div className="pricing-plan__per-month">
                      ~{Math.round(priceOf(key) / 12)} lei / lună
                    </div>
                  )}
                  <ul className="pricing-plan__list">
                    {p.highlights.map((h) => (
                      <li key={h}>
                        <span className="pricing-plan__check">✓</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="pricing-plan__cta">
                    {isFree ? (
                      <Link href="/inregistrare?firm=1" className="vg-btn vg-btn--outline vg-btn--lg">
                        Înregistrează gratuit
                      </Link>
                    ) : (
                      <Link
                        href={`/dashboard/abonament?upgrade=${key}`}
                        className={`vg-btn vg-btn--lg ${isPremium ? "vg-btn--gold" : "vg-btn--primary"}`}
                      >
                        Alege {p.nume}
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="vg-section" style={{ background: "var(--surface-2)" }}>
        <div className="container">
          <div className="vg-section__head">
            <p className="vg-section__kicker">Comparație detaliată</p>
            <h2 className="vg-section__title">Ce primești pe fiecare plan</h2>
          </div>

          <div className="pricing-table-wrap">
            <table className="pricing-table">
              <thead>
                <tr>
                  <th>Funcționalitate</th>
                  <th>Free</th>
                  <th>Start<br /><span>{priceOf("start")} lei/an</span></th>
                  <th>Plus<br /><span>{priceOf("plus")} lei/an</span></th>
                  <th className="pricing-table__premium">Premium<br /><span>{priceOf("premium")} lei/an</span></th>
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((f) => (
                  <tr key={f.label}>
                    <td>{f.label}</td>
                    <td>{f.free ? <span className="pricing-check">✓</span> : <span className="pricing-dash">—</span>}</td>
                    <td>{f.start ? <span className="pricing-check">✓</span> : <span className="pricing-dash">—</span>}</td>
                    <td>{f.plus ? <span className="pricing-check">✓</span> : <span className="pricing-dash">—</span>}</td>
                    <td className="pricing-table__premium">{f.premium ? <span className="pricing-check">✓</span> : <span className="pricing-dash">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="vg-section">
        <div className="container container--narrow">
          <div className="vg-section__head">
            <p className="vg-section__kicker">Întrebări frecvente</p>
            <h2 className="vg-section__title">Răspunsuri la ce ne întrebă firmele</h2>
          </div>

          <div className="pricing-faq">
            <details className="pricing-faq__item" open>
              <summary>Ce înseamnă exclusivitate locală?</summary>
              <p>
                Pe planul Premium, firmele concurente din aceeași localitate nu apar în listing.
                Doar tu ești afișat pe pagina localității tale — maximizează conversia pe zona ta.
              </p>
            </details>
            <details className="pricing-faq__item">
              <summary>Cum mă dezabonez?</summary>
              <p>
                Din dashboard, buton Anulează abonamentul. Plata se oprește la sfârșitul
                perioadei curente — beneficiile rămân până atunci. Nu există termen minim.
              </p>
            </details>
            <details className="pricing-faq__item">
              <summary>Pot schimba planul oricând?</summary>
              <p>
                Da. Upgrade e imediat (plătești diferența prorata). Downgrade se activează
                la reînnoire (păstrezi features-urile actuale până expiră).
              </p>
            </details>
            <details className="pricing-faq__item">
              <summary>Ce se întâmplă dacă nu plătesc la timp?</summary>
              <p>
                Stripe încearcă 3 retry-uri automat. După ultimul eșec, firma revine pe
                planul Free. Profilul rămâne activ, doar că pierzi features-urile premium.
              </p>
            </details>
            <details className="pricing-faq__item">
              <summary>Cum se face plata?</summary>
              <p>
                Securizată prin Stripe. Card personal sau business. Primești factură
                automată pe email. Posibilitate factură pe CUI dacă specifici.
              </p>
            </details>
            <details className="pricing-faq__item">
              <summary>Există comisioane pe intervenții?</summary>
              <p>
                <strong>Nu.</strong> Abonamentul acoperă totul — nu plătești procent pe
                programări. Clientul plătește firma direct, fără intermediere.
              </p>
            </details>
          </div>
        </div>
      </section>

      <section className="vg-section">
        <div className="container">
          <div className="vg-cta-band vg-cta-band--gold">
            <h2>Pregătit să începi?</h2>
            <p>Listare gratuită în 2 minute. Validarea ANRE durează 1-2 zile.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/inregistrare?firm=1" className="vg-btn-lg">Înscrie firma gratuit →</Link>
              <Link href="/contact" className="vg-btn-lg" style={{ background: "rgba(255,255,255,.2)", color: "#fff" }}>
                Ai întrebări? Contactează-ne
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
