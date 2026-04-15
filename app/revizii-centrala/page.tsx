// app/revizii-centrala/page.tsx
// Hub național premium — revizie centrală termică.
export const revalidate = 3600

import type { Metadata } from "next"
import Link from "next/link"
import { getPublicServerSupabase } from "@/lib/supabase/server"
import { slugifyRO } from "@/lib/utils/slugify"
import { JsonLdScript } from "@/components/seo/JsonLdScript"
import { breadcrumbJsonLd, serviceJsonLd, faqJsonLd } from "@/lib/seo/jsonld"
import { DOMAIN } from "@/lib/config/domain"

export const metadata: Metadata = {
  title: "Revizie centrală termică 2026 — firme autorizate în România",
  description:
    "Revizie anuală centrală termică: curățare schimbător principal + secundar, verificare arzător, presiune, vas expansiune. Firme autorizate ANRE + ISCIR în toate cele 42 județe. Programare online, preț 200-400 lei.",
  alternates: { canonical: "/revizii-centrala" },
}

const FAQ = [
  {
    q: "Cât costă revizia centralei termice?",
    a: "Între 200 și 400 lei pentru revizia anuală standard (fără piese înlocuite). Mai mult dacă schimbătorul e blocat cu calcar sau arzătorul are depuneri mari. Include curățare, verificare, reglaj ardere + raport scris.",
  },
  {
    q: "De ce e importantă revizia anuală?",
    a: "Pentru păstrarea garanției la producător (Viessmann, Vaillant, Bosch, Ariston) — majoritatea o cer. În plus, revizia reduce consumul de gaz cu 10-15%, detectează defecte înainte să defecteze complet, și asigură funcționare sigură pe tot sezonul rece.",
  },
  {
    q: "Ce include revizia completă?",
    a: "Curățare schimbător principal + secundar (depuneri calcar, funingine), verificare arzător și electrozi, test ardere cu analizator CO/CO₂, verificare presiune circuit, vas expansiune, pompă circulație, supape siguranță + test funcțional general.",
  },
  {
    q: "Când e cel mai bun moment pentru revizie?",
    a: "Toamna, septembrie-octombrie, înainte de pornirea sezonului rece. Firmele sunt mai puțin încărcate, ai timp să repari eventuale probleme descoperite, și eviti avarii când centrala lucrează la maxim în ianuarie-februarie.",
  },
  {
    q: "Revizia e obligatorie legal?",
    a: "Nu e obligatorie prin lege (spre deosebire de verificarea instalației de gaze). Dar e obligatorie pentru păstrarea garanției la producător și puternic recomandată pentru siguranță. Contractele de asigurare pot cere revizie la zi.",
  },
]

export default async function Page() {
  const supabase = getPublicServerSupabase()
  const { data: judete } = await supabase
    .from("judete")
    .select("id, nume, slug")
    .order("nume")

  const list = (judete ?? []) as unknown as { id: number; nume: string; slug: string }[]

  const breadcrumbs = [
    { label: "Acasă", href: "/" },
    { label: "Revizie centrală termică" },
  ]

  return (
    <>
      <JsonLdScript data={[
        breadcrumbJsonLd(breadcrumbs),
        serviceJsonLd({
          name: "Revizie centrală termică",
          description: "Revizie anuală completă pentru centrala termică pe gaz — curățare, verificare, reglaj ardere. Firme autorizate ANRE + ISCIR.",
          url: `${DOMAIN.baseUrl}/revizii-centrala`,
          areaServed: "Romania",
        }),
        faqJsonLd(FAQ.map((f) => ({ question: f.q, answer: f.a }))),
      ]} />

      {/* HERO */}
      <section className="vg-hero">
        <div className="vg-hero__inner">
          <span className="vg-hero__eyebrow">
            <span style={{ marginRight: 6, fontSize: 20 }}>♻️</span>
            ANRE + ISCIR · garanție producător
          </span>
          <h1 className="vg-hero__title">
            Revizie centrală termică, <em>înainte de iarnă</em>
          </h1>
          <p className="vg-hero__sub">
            Curățare schimbător, verificare arzător, reglaj ardere, test presiune. Firme autorizate
            ANRE și ISCIR în toate cele 42 de județe. Programare online, preț 200-400 lei pentru revizie standard.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginTop: 20 }}>
            <Link href="/programare" className="vg-btn vg-btn--primary vg-btn--lg">
              Programează revizia →
            </Link>
            <Link href="#judete" className="vg-btn vg-btn--ghost vg-btn--lg">
              Vezi firme pe județ
            </Link>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="vg-section">
        <div className="container">
          <div className="vg-section__head">
            <p className="vg-section__kicker">De ce contează</p>
            <h2 className="vg-section__title">Ce primești cu o revizie anuală</h2>
          </div>
          <div className="vg-values">
            <div className="vg-value">
              <div className="vg-value__icon">🛡️</div>
              <h3 className="vg-value__title">Garanție păstrată</h3>
              <p className="vg-value__desc">Producătorii (Viessmann, Vaillant, Bosch) cer revizia anuală pentru validarea garanției.</p>
            </div>
            <div className="vg-value">
              <div className="vg-value__icon">💰</div>
              <h3 className="vg-value__title">Consum redus 10-15%</h3>
              <p className="vg-value__desc">Ardere reglată + schimbător curat = mai puțin gaz pentru aceeași temperatură.</p>
            </div>
            <div className="vg-value">
              <div className="vg-value__icon">🔧</div>
              <h3 className="vg-value__title">Defecte depistate</h3>
              <p className="vg-value__desc">Mici probleme reparate acum, înainte să devină avarii costisitoare la -10°C.</p>
            </div>
            <div className="vg-value">
              <div className="vg-value__icon">📄</div>
              <h3 className="vg-value__title">Raport scris</h3>
              <p className="vg-value__desc">Valori măsurate (CO/CO₂, presiune, temperatură), componente verificate, recomandări.</p>
            </div>
          </div>
        </div>
      </section>

      {/* JUDETE */}
      <section className="vg-section" style={{ background: "var(--surface-2)" }} id="judete">
        <div className="container">
          <div className="vg-section__head">
            <p className="vg-section__kicker">Firme pe județ</p>
            <h2 className="vg-section__title">Alege județul tău</h2>
            <p className="vg-section__sub">
              Toate firmele au autorizație ANRE (instalație gaze) și ISCIR (echipament sub presiune). Programarea e gratuită.
            </p>
          </div>

          <div className="vg-judete">
            {list.map((j) => (
              <Link key={j.id} href={`/revizii-centrala/${slugifyRO(j.nume)}`} className="vg-judet-card">
                <div className="vg-judet-card__name">{j.nume}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="vg-section">
        <div className="container" style={{ maxWidth: 820 }}>
          <div className="vg-section__head">
            <p className="vg-section__kicker">Întrebări frecvente</p>
            <h2 className="vg-section__title">Ce să știi despre revizia centralei</h2>
          </div>
          <div className="vg-faq">
            {FAQ.map((item, i) => (
              <details key={i} className="vg-faq__item" open={i === 0}>
                <summary className="vg-faq__q">{item.q}</summary>
                <div className="vg-faq__a">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CROSS-SELL */}
      <section className="vg-section" style={{ background: "var(--surface-2)" }}>
        <div className="container">
          <div className="vg-section__head">
            <p className="vg-section__kicker">Servicii complementare</p>
            <h2 className="vg-section__title">Dacă ai centrală, ai nevoie și de</h2>
          </div>
          <ul className="vg-cats" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            <li>
              <Link href="/verificari-centrala" className="vg-cat">
                <div className="vg-cat__icon">🔥</div>
                <h3 className="vg-cat__title">Verificare tehnică periodică (VTP)</h3>
                <p className="vg-cat__desc">Obligatorie anual pentru garanție. Raport cu valori CO/CO₂.</p>
                <span className="vg-cat__link">Vezi firme →</span>
              </Link>
            </li>
            <li>
              <Link href="/servicii-gaze" className="vg-cat">
                <div className="vg-cat__icon">🔍</div>
                <h3 className="vg-cat__title">Verificare instalație gaze</h3>
                <p className="vg-cat__desc">Obligatorie legal la 2 ani. Include traseul gaz până la centrală.</p>
                <span className="vg-cat__link">Vezi firme →</span>
              </Link>
            </li>
            <li>
              <Link href="/magazin" className="vg-cat">
                <div className="vg-cat__icon">📡</div>
                <h3 className="vg-cat__title">Detector gaze + CO</h3>
                <p className="vg-cat__desc">Protecție suplimentară — detectează scurgeri în sub 30 secunde.</p>
                <span className="vg-cat__link">Vezi produse →</span>
              </Link>
            </li>
          </ul>
        </div>
      </section>

      {/* CTA BAND */}
      <section className="vg-section" style={{ background: "linear-gradient(135deg, var(--accent-700), var(--accent-600))", color: "#fff" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <h2 style={{ color: "#fff", fontSize: "clamp(22px, 3vw, 30px)", margin: "0 0 10px" }}>
            Programează revizia înainte de iarnă
          </h2>
          <p style={{ opacity: 0.9, fontSize: 16, margin: "0 0 20px" }}>
            Formular 2 minute. O firmă ANRE + ISCIR te contactează în 24h.
          </p>
          <Link href="/programare" className="vg-btn vg-btn--lg" style={{ background: "#fff", color: "var(--accent-700)", fontWeight: 700 }}>
            Programează gratuit →
          </Link>
        </div>
      </section>
    </>
  )
}
