// app/abonamente/page.tsx
// Pagina publică de pricing — fiecare plan cu highlights + CTA.
import type { Metadata } from "next"
import Link from "next/link"
import { PLANS, PLAN_ORDER } from "@/lib/plans/plans"
import { DOMAIN } from "@/lib/config/domain"

export const metadata: Metadata = {
  title: `Abonamente pentru firme autorizate ANRE — ${DOMAIN.brandName}`,
  description:
    "Alege planul potrivit firmei tale: Start (490 lei/an), Plus (890 lei/an) sau Premium (1490 lei/an, cu exclusivitate locală).",
  alternates: { canonical: "/abonamente" },
}

export default function Page() {
  return (
    <div className="pricing-page container">
      <header className="pricing-hero">
        <h1 className="pricing-title">Abonamente pentru firme autorizate ANRE</h1>
        <p className="pricing-lead">
          Profilul Free te listează. Planurile plătite îți aduc conversie:
          vizibilitate prioritară, magazin activ, exclusivitate locală.
        </p>
      </header>

      <div className="pricing-grid">
        {PLAN_ORDER.map((key) => {
          const p = PLANS[key]
          const isPremium = key === "premium"
          const isFree = key === "free"
          return (
            <section key={key} className={`pricing-card pricing-card--${key}${isPremium ? " pricing-card--highlight" : ""}`}>
              <h2 className="pricing-card__name">{p.nume}</h2>
              <p className="pricing-card__tagline">{p.tagline}</p>
              <div className="pricing-card__price">
                {isFree ? (
                  <strong>0 lei</strong>
                ) : (
                  <>
                    <strong>{p.priceYearly} lei</strong>
                    <span className="pricing-card__period"> / an</span>
                  </>
                )}
              </div>
              <ul className="pricing-card__list">
                {p.highlights.map((h) => <li key={h}>{h}</li>)}
              </ul>
              <div className="pricing-card__cta">
                {isFree ? (
                  <Link href="/inregistrare?firm=1" className="shop-btn shop-btn--ghost">
                    Înregistrează gratuit
                  </Link>
                ) : (
                  <Link
                    href={`/dashboard/abonament?upgrade=${key}`}
                    className="shop-btn shop-btn--primary"
                  >
                    Alege {p.nume}
                  </Link>
                )}
              </div>
            </section>
          )
        })}
      </div>

      <section className="pricing-faq">
        <h2>Întrebări frecvente</h2>
        <dl className="pricing-dl">
          <dt>Ce înseamnă „exclusivitate locală"?</dt>
          <dd>
            Pe planul Premium, firmele concurente din aceeași localitate nu apar în listing.
            Doar tu ești afișat — maximizează conversia pe zona ta.
          </dd>
          <dt>Cum mă dezabonez?</dt>
          <dd>
            Din dashboard, buton „Anulează abonamentul". Plata se oprește la sfârșitul
            perioadei curente, fără termen limită.
          </dd>
          <dt>Pot schimba planul oricând?</dt>
          <dd>
            Da. Upgrade e imediat, downgrade se activează la reînnoire.
          </dd>
          <dt>Ce se întâmplă dacă nu plătesc la timp?</dt>
          <dd>
            După 3 retry-uri Stripe, firma revine pe planul Free. Profilul rămâne activ,
            doar că pierde features-urile premium.
          </dd>
        </dl>
      </section>
    </div>
  )
}
