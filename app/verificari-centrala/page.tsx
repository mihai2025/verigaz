// app/verificari-centrala/page.tsx
// Hub național — VTP centrală termică ISCIR. Premium, cu CTA.
import type { Metadata } from "next"
import Link from "next/link"
import { getPublicServerSupabase } from "@/lib/supabase/server"
import { slugifyRO } from "@/lib/utils/slugify"
import { JsonLdScript } from "@/components/seo/JsonLdScript"
import { breadcrumbJsonLd, faqJsonLd, serviceJsonLd } from "@/lib/seo/jsonld"
import { DOMAIN } from "@/lib/config/domain"

export const metadata: Metadata = {
  title: "Verificare centrală termică (VTP) — firme autorizate ISCIR 2026",
  description:
    "Verificarea tehnică periodică (VTP) ISCIR a centralei termice. Firme autorizate în toată țara, programare rapidă, preț de la 150 lei. Menține garanția producătorului.",
  keywords: [
    "verificare centrala termica", "VTP centrala", "ISCIR centrala termica",
    "verificare anuala centrala", "service centrala termica",
  ],
  alternates: { canonical: "/verificari-centrala" },
  openGraph: {
    title: "Verificare VTP centrală termică — ISCIR",
    description: "Firme autorizate ISCIR pentru verificarea anuală a centralei.",
    url: `${DOMAIN.baseUrl}/verificari-centrala`,
    images: [{ url: `/og?title=${encodeURIComponent("Verificare centrală termică")}&subtitle=${encodeURIComponent("Firme autorizate ISCIR")}&badge=VTP&type=serviciu`, width: 1200, height: 630 }],
  },
}

const FAQS = [
  {
    q: "Ce înseamnă VTP centrală termică?",
    a: "Verificarea Tehnică Periodică (VTP) e controlul tehnic obligatoriu ISCIR al centralei termice pe gaz. Verifică arzător, senzori, etanșeitate, emisii CO și tiraj. Pentru centrale rezidențiale sub 30 kW nu e obligatorie legal, dar e recomandată anual de toți producătorii pentru menținerea garanției.",
  },
  {
    q: "Cât costă o VTP în 2026?",
    a: "Între 150 și 300 lei pentru o verificare standard. Revizia completă cu curățare schimbător de căldură și înlocuire filtre ajunge la 250-500 lei. Prețul depinde de marcă (Ariston, Motan, Vaillant etc.), vechime și numărul de aparate.",
  },
  {
    q: "Ce documente primesc după VTP?",
    a: "Raport tehnic VTP cu toate măsurătorile (presiune, tiraj, emisii), etichetă pe centrală cu următoarea scadență, factură fiscală. Pe verificari-gaze.ro primești automat și PDF digital cu QR de verificare online — valabil 12 luni.",
  },
  {
    q: "Cât durează verificarea?",
    a: "Verificare standard: 1-2 ore. Revizie completă cu curățare: 3-4 ore. Centrala e oprită în timpul intervenției, programează o zi când nu ai nevoie de apă caldă sau încălzire.",
  },
  {
    q: "De ce e important să fac VTP anual?",
    a: "Producătorii condiționează garanția de verificarea anuală documentată. Fără raport VTP, poți pierde garanția la defecte sub 10 ani. În plus, centralele necalibrate pot emite monoxid de carbon — risc vital pentru familie.",
  },
]

export default async function Page() {
  const supabase = getPublicServerSupabase()
  const { data: judete } = await supabase
    .from("judete")
    .select("id, nume, slug")
    .order("nume")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const list = (judete ?? []) as any[]

  return (
    <>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { label: "Acasă", href: "/" },
            { label: "Verificare centrală termică" },
          ]),
          serviceJsonLd({
            serviceName: "Verificare tehnică periodică centrală termică (VTP ISCIR)",
            description:
              "Verificare anuală centrală termică pe gaz de la firme autorizate ISCIR. Emisii CO, tiraj, presiune, arzător — conform normativelor.",
            url: `${DOMAIN.baseUrl}/verificari-centrala`,
            priceRange: "150-500 RON",
          }),
          faqJsonLd(FAQS.map((f) => ({ question: f.q, answer: f.a }))),
        ]}
      />

      {/* HERO */}
      <section className="vg-hero">
        <div className="vg-hero__inner">
          <span className="vg-hero__eyebrow">ISCIR · recomandată anual</span>
          <h1 className="vg-hero__title">
            Verificare centrală termică <em>la timp, în siguranță</em>
          </h1>
          <p className="vg-hero__sub">
            Firme autorizate ISCIR pentru VTP (Verificare Tehnică Periodică) a centralei termice.
            Programare rapidă, raport tehnic digital, menținere garanție producător.
            De la <strong>150 lei</strong>.
          </p>
          <div className="vg-hero__ctas">
            <Link href="/programare?serviciu=verificare-centrala" className="vg-btn vg-btn--primary vg-btn--lg">
              Programează VTP →
            </Link>
            <Link href="#judete" className="vg-btn vg-btn--outline vg-btn--lg">
              Vezi firme pe județ
            </Link>
          </div>

          <div className="vg-badges">
            <span className="vg-badge"><span className="vg-badge__dot" /> Autorizație ISCIR validată</span>
            <span className="vg-badge"><span className="vg-badge__dot" /> Raport tehnic digital</span>
            <span className="vg-badge"><span className="vg-badge__dot" /> Menține garanția centralei</span>
            <span className="vg-badge"><span className="vg-badge__dot" /> Intervenție în 1-2 ore</span>
          </div>
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="vg-section">
        <div className="container">
          <div className="vg-section__head">
            <p className="vg-section__kicker">De ce e importantă VTP</p>
            <h2 className="vg-section__title">Centrala curată e centrala sigură</h2>
            <p className="vg-section__sub">
              O verificare anuală costă 150-300 lei. O centrală defectă care emite CO
              sau o garanție pierdută te costă de 100× mai mult.
            </p>
          </div>

          <div className="vg-values">
            <div className="vg-value">
              <div className="vg-value__icon">🛡️</div>
              <h3 className="vg-value__title">Garanție protejată</h3>
              <p className="vg-value__desc">Producătorii cer VTP anuală documentată. Fără ea, garanția e nulă.</p>
            </div>
            <div className="vg-value">
              <div className="vg-value__icon">⚠️</div>
              <h3 className="vg-value__title">Prevenție CO</h3>
              <p className="vg-value__desc">Monoxidul de carbon e inodor și mortal. Doar calibrarea anuală îl previne.</p>
            </div>
            <div className="vg-value">
              <div className="vg-value__icon">💰</div>
              <h3 className="vg-value__title">Consum optim</h3>
              <p className="vg-value__desc">Centrală curată consumă cu 5-15% mai puțin gaz. Se amortizează rapid.</p>
            </div>
            <div className="vg-value">
              <div className="vg-value__icon">⚙️</div>
              <h3 className="vg-value__title">Viață utilă +</h3>
              <p className="vg-value__desc">Cu VTP anuală centrala durează 15-20 ani. Fără ea, 8-10 ani.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CE INCLUDE VERIFICAREA */}
      <section className="vg-section" style={{ background: "var(--surface-2)" }}>
        <div className="container">
          <div className="vg-section__head">
            <p className="vg-section__kicker">Ce conține o VTP</p>
            <h2 className="vg-section__title">8 verificări tehnice standard</h2>
            <p className="vg-section__sub">
              Tehnicianul autorizat ISCIR parcurge un check-list complet — nu e doar o privire rapidă.
            </p>
          </div>

          <div className="vg-cats">
            <div className="vg-cat"><div className="vg-cat__icon">🔥</div><h3 className="vg-cat__title">Arzător</h3><p className="vg-cat__desc">Curățare duze, calibrare flacără, verificare aprindere.</p></div>
            <div className="vg-cat"><div className="vg-cat__icon">🌡️</div><h3 className="vg-cat__title">Schimbător căldură</h3><p className="vg-cat__desc">Test eficiență transfer termic, depunere calcar.</p></div>
            <div className="vg-cat"><div className="vg-cat__icon">💨</div><h3 className="vg-cat__title">Presiune + vas expansiune</h3><p className="vg-cat__desc">Verificare presiune circuit + umplere vas.</p></div>
            <div className="vg-cat"><div className="vg-cat__icon">🔧</div><h3 className="vg-cat__title">Filtre apă</h3><p className="vg-cat__desc">Curățare filtre circulație, verificare fluxuri.</p></div>
            <div className="vg-cat"><div className="vg-cat__icon">📊</div><h3 className="vg-cat__title">Senzori + presostat</h3><p className="vg-cat__desc">Calibrare senzori temperatură, test protecții.</p></div>
            <div className="vg-cat"><div className="vg-cat__icon">🌬️</div><h3 className="vg-cat__title">Sistem evacuare</h3><p className="vg-cat__desc">Test tiraj, etanșeitate coș, evacuare gaze arse.</p></div>
            <div className="vg-cat"><div className="vg-cat__icon">🧪</div><h3 className="vg-cat__title">Emisii CO + O₂</h3><p className="vg-cat__desc">Măsurare cu analizor combustie certificat.</p></div>
            <div className="vg-cat"><div className="vg-cat__icon">⚡</div><h3 className="vg-cat__title">Anozi (la boilere)</h3><p className="vg-cat__desc">Verificare stare, înlocuire preventivă.</p></div>
          </div>
        </div>
      </section>

      {/* CTA BAND MIJLOC */}
      <section className="vg-section">
        <div className="container">
          <div className="vg-cta-band">
            <h2>Programează VTP online în 2 minute</h2>
            <p>Firma te contactează în 24h pentru confirmare. Primești raport PDF cu QR după intervenție.</p>
            <Link href="/programare?serviciu=verificare-centrala" className="vg-btn-lg">
              Programează acum →
            </Link>
          </div>
        </div>
      </section>

      {/* JUDEȚE */}
      <section id="judete" className="vg-section" style={{ background: "var(--surface-2)" }}>
        <div className="container">
          <div className="vg-section__head">
            <p className="vg-section__kicker">Acoperire națională</p>
            <h2 className="vg-section__title">Alege județul tău</h2>
            <p className="vg-section__sub">
              Firme autorizate ISCIR în toate cele 42 de județe din România.
              Click pe județ pentru listing local.
            </p>
          </div>

          <ul className="vg-judete">
            {list.map((j) => (
              <li key={j.id}>
                <Link href={`/verificari-centrala/${slugifyRO(j.nume as string)}`} className="vg-judet">
                  {j.nume}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="vg-section">
        <div className="container container--narrow">
          <div className="vg-section__head">
            <p className="vg-section__kicker">Întrebări frecvente</p>
            <h2 className="vg-section__title">Răspunsuri rapide</h2>
          </div>

          <div className="pricing-faq">
            {FAQS.map((f, i) => (
              <details key={i} className="pricing-faq__item" open={i === 0}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CROSS-SELL */}
      <section className="vg-section" style={{ background: "var(--surface-2)" }}>
        <div className="container">
          <div className="vg-section__head">
            <p className="vg-section__kicker">Mai mult ca VTP</p>
            <h2 className="vg-section__title">Alte servicii pentru centrală</h2>
          </div>

          <div className="vg-cats" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            <Link href="/revizii-centrala" className="vg-cat">
              <div className="vg-cat__icon">🛠️</div>
              <h3 className="vg-cat__title">Revizie completă centrală</h3>
              <p className="vg-cat__desc">Curățare schimbător, înlocuire vas expansiune, calibrare completă.</p>
              <span className="vg-cat__link">Vezi firme →</span>
            </Link>
            <Link href="/servicii-gaze" className="vg-cat">
              <div className="vg-cat__icon">🔍</div>
              <h3 className="vg-cat__title">Verificare instalație gaze</h3>
              <p className="vg-cat__desc">Verificarea ANRE obligatorie la 2 ani pentru traseul de gaze.</p>
              <span className="vg-cat__link">Vezi firme →</span>
            </Link>
            <Link href="/utile/verificare-vtp-centrala-termica-iscir" className="vg-cat">
              <div className="vg-cat__icon">📖</div>
              <h3 className="vg-cat__title">Ghid complet VTP</h3>
              <p className="vg-cat__desc">Tot ce trebuie să știi despre VTP centrală: proceduri, prețuri, documente.</p>
              <span className="vg-cat__link">Citește →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="vg-section">
        <div className="container">
          <div className="vg-cta-band vg-cta-band--gold">
            <h2>Nu amâna VTP — programează astăzi</h2>
            <p>Costă 150-300 lei, durează 1-2 ore, te scutește de riscuri de mii de lei.</p>
            <Link href="/programare?serviciu=verificare-centrala" className="vg-btn-lg">
              Programează VTP centrala →
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
