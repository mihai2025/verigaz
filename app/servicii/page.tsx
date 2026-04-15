// app/servicii/page.tsx
// Hub pentru toate categoriile de servicii — landing premium cu CTAs.
import type { Metadata } from "next"
import Link from "next/link"
import { CATEGORY_PAGES } from "@/lib/servicii-gaze/links"

export const metadata: Metadata = {
  title: "Servicii instalații gaze și centrale termice — 7 categorii cu firme ANRE",
  description:
    "Toate serviciile pentru instalații gaze naturale și centrale termice: verificare obligatorie la 2 ani, revizie la 10 ani, montaj detector, service detector, reparații, VTP și revizie centrală termică. Firme autorizate ANRE în 42 județe.",
  alternates: { canonical: "/servicii" },
}

const CATEGORY_ICONS: Record<string, string> = {
  "verificare-instalatie": "🔍",
  "revizie-instalatie": "🔧",
  "montaj-detector": "📡",
  "service-detector": "⚙️",
  "reparatii-instalatie": "🔨",
  "verificare-centrala": "🔥",
  "revizie-centrala": "🛠️",
}

const CATEGORY_FREQUENCY: Record<string, string> = {
  "verificare-instalatie": "Obligatorie la 2 ani",
  "revizie-instalatie": "Obligatorie la 10 ani",
  "montaj-detector": "Recomandat — o singură dată",
  "service-detector": "Anual",
  "reparatii-instalatie": "La nevoie (scurgeri, defecte)",
  "verificare-centrala": "Anual — pentru garanție",
  "revizie-centrala": "Anual — înainte de iarnă",
}

const CATEGORY_PRICE: Record<string, string> = {
  "verificare-instalatie": "150-350 lei",
  "revizie-instalatie": "300-700 lei",
  "montaj-detector": "250-500 lei",
  "service-detector": "80-150 lei",
  "reparatii-instalatie": "100-500 lei",
  "verificare-centrala": "150-300 lei",
  "revizie-centrala": "200-400 lei",
}

export default function Page() {
  return (
    <>
      {/* HERO */}
      <section className="vg-hero">
        <div className="vg-hero__inner">
          <span className="vg-hero__eyebrow">7 categorii · firme ANRE autorizate</span>
          <h1 className="vg-hero__title">
            Servicii pentru instalații gaze și centrale termice
          </h1>
          <p className="vg-hero__sub">
            De la verificarea obligatorie la 2 ani până la montajul detectorului și service-ul
            centralei — alege categoria și vezi imediat firmele autorizate ANRE din județul tău.
            Prețuri transparente, programare online gratuită.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginTop: 20 }}>
            <Link href="/programare" className="vg-btn vg-btn--primary vg-btn--lg">
              Programează acum →
            </Link>
            <Link href="/servicii-gaze" className="vg-btn vg-btn--outline vg-btn--lg">
              Caută firmă pe județ
            </Link>
          </div>
        </div>
      </section>

      {/* CATEGORIES GRID */}
      <section className="vg-section">
        <div className="container">
          <div className="vg-section__head">
            <p className="vg-section__kicker">Alege serviciul</p>
            <h2 className="vg-section__title">Toate intervențiile autorizate</h2>
            <p className="vg-section__sub">
              Firme autorizate ANRE (instalații gaze) și ISCIR (centrale termice).
              Preț orientativ + frecvență legală afișate pe fiecare card.
            </p>
          </div>

          <ul className="vg-cats" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {CATEGORY_PAGES.map((c) => (
              <li key={c.slug}>
                <Link href={`/servicii/${c.slug}`} className="vg-cat">
                  <div className="vg-cat__icon">{CATEGORY_ICONS[c.slug] ?? "⚡"}</div>
                  <h3 className="vg-cat__title">{c.label}</h3>
                  {c.description && <p className="vg-cat__desc">{c.description}</p>}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, padding: "10px 0 0", borderTop: "1px solid var(--border)", fontSize: 12 }}>
                    <span style={{ color: "var(--text-500)" }}>{CATEGORY_FREQUENCY[c.slug]}</span>
                    <span style={{ color: "var(--accent-700)", fontWeight: 700 }}>{CATEGORY_PRICE[c.slug]}</span>
                  </div>
                  <span className="vg-cat__link" style={{ marginTop: 10 }}>Vezi firme →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* LEGAL CONTEXT */}
      <section className="vg-section" style={{ background: "var(--surface-2)" }}>
        <div className="container" style={{ maxWidth: 900 }}>
          <div className="vg-section__head">
            <p className="vg-section__kicker">Context legal</p>
            <h2 className="vg-section__title">Ce obligații ai conform ANRE Ord. 179/2015</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            <div style={{ padding: 20, background: "#fff", border: "1px solid var(--border)", borderRadius: 12 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 10px", color: "var(--text-900)" }}>Verificare la 2 ani</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-600)", margin: 0 }}>
                Obligatorie pentru orice instalație de gaze naturale. Firma ANRE emite proces verbal
                valabil 24 luni, acceptat de distribuitor și asigurator.
              </p>
            </div>
            <div style={{ padding: 20, background: "#fff", border: "1px solid var(--border)", borderRadius: 12 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🔧</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 10px", color: "var(--text-900)" }}>Revizie la 10 ani</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-600)", margin: 0 }}>
                Revizie tehnică completă la maxim 10 ani sau după modificare majoră. Include
                verificarea tuturor componentelor + înlocuirea celor uzate.
              </p>
            </div>
            <div style={{ padding: 20, background: "#fff", border: "1px solid var(--border)", borderRadius: 12 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 10px", color: "var(--text-900)" }}>Amenzi neefectuare</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-600)", margin: 0 }}>
                1.000-10.000 lei + suspendarea furnizării gazului de la Distrigaz / Delgaz până la
                prezentarea documentului valid.
              </p>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 24 }}>
            <Link href="/utile/anre-ord-179-2015-explicat-pe-intelesul-tuturor" className="vg-btn vg-btn--outline">
              Citește ANRE Ord. 179/2015 explicat →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <section className="vg-section" style={{ background: "linear-gradient(135deg, var(--accent-700), var(--accent-600))", color: "#fff" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <h2 style={{ color: "#fff", fontSize: "clamp(22px, 3vw, 32px)", margin: "0 0 10px" }}>
            Nu ești sigur ce serviciu îți trebuie?
          </h2>
          <p style={{ opacity: 0.9, fontSize: 16, margin: "0 0 24px", maxWidth: 600, marginInline: "auto" }}>
            Completează formularul de programare — firma aleasă verifică documentele tale și îți
            recomandă intervenția potrivită (verificare de rutină, revizie completă sau reparație).
          </p>
          <Link href="/programare" className="vg-btn vg-btn--lg" style={{ background: "#fff", color: "var(--accent-700)", fontWeight: 700, fontSize: 17 }}>
            Programează consultanță gratuită →
          </Link>
        </div>
      </section>
    </>
  )
}
