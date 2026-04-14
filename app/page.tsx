// app/page.tsx
// Homepage verificari-gaze.ro — premium hero + value props + categorii + județe + CTA.
import type { Metadata } from "next"
import Link from "next/link"
import { DOMAIN } from "@/lib/config/domain"
import { CATEGORY_PAGES } from "@/lib/servicii-gaze/links"

export const metadata: Metadata = {
  title: DOMAIN.metaTitleDefault,
  description: DOMAIN.metaDescription,
  alternates: { canonical: "/" },
}

const JUDETE_T1 = [
  { slug: "bucuresti", nume: "București" },
  { slug: "cluj", nume: "Cluj" },
  { slug: "iasi", nume: "Iași" },
  { slug: "timis", nume: "Timiș" },
  { slug: "constanta", nume: "Constanța" },
  { slug: "dolj", nume: "Dolj" },
  { slug: "brasov", nume: "Brașov" },
  { slug: "galati", nume: "Galați" },
  { slug: "prahova", nume: "Prahova" },
  { slug: "bihor", nume: "Bihor" },
  { slug: "sibiu", nume: "Sibiu" },
  { slug: "bacau", nume: "Bacău" },
]

const CATEGORY_ICONS: Record<string, string> = {
  "verificare-instalatie": "🔍",
  "revizie-instalatie": "🔧",
  "montaj-detector": "📡",
  "service-detector": "⚙️",
  "reparatii-instalatie": "🔨",
  "verificare-centrala": "🔥",
  "revizie-centrala": "🛠️",
}

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="vg-hero">
        <div className="vg-hero__inner">
          <span className="vg-hero__eyebrow">ANRE Ord. 179/2015 · firme validate</span>
          <h1 className="vg-hero__title">
            Instalația ta de gaze, <em>la zi și în siguranță</em>
          </h1>
          <p className="vg-hero__sub">
            Firme autorizate ANRE pentru verificări la 2 ani, revizii la 10 ani,
            montaj detectoare și service centrală termică. Programează rapid, primești
            certificat digital.
          </p>

          <form method="get" action="/cauta" className="vg-search" role="search">
            <input
              className="vg-search__input"
              name="q"
              placeholder="Caută firmă, oraș sau serviciu..."
              autoComplete="off"
              aria-label="Caută pe verificari-gaze.ro"
            />
            <button type="submit" className="vg-search__btn">Caută</button>
          </form>

          <div className="vg-hero__ctas">
            <Link href="/servicii-gaze" className="vg-btn vg-btn--primary vg-btn--lg">
              Vezi firme pe județ →
            </Link>
            <Link href="/programare" className="vg-btn vg-btn--outline vg-btn--lg">
              Programează online
            </Link>
          </div>

          <div className="vg-badges">
            <span className="vg-badge"><span className="vg-badge__dot" /> Autorizare ANRE validată</span>
            <span className="vg-badge"><span className="vg-badge__dot" /> Certificat digital cu QR</span>
            <span className="vg-badge"><span className="vg-badge__dot" /> Reminder automat scadențe</span>
            <span className="vg-badge"><span className="vg-badge__dot" /> 42 județe · 13.854 localități</span>
          </div>
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="vg-section">
        <div className="container">
          <div className="vg-section__head">
            <p className="vg-section__kicker">De ce verificari-gaze.ro</p>
            <h2 className="vg-section__title">Totul într-un singur loc, fără drumuri</h2>
            <p className="vg-section__sub">
              Transparent, rapid, conform cu normele ANRE. Poți compara firme, programa online
              și primi documente digitale fără formulare pe hârtie.
            </p>
          </div>

          <div className="vg-values">
            <div className="vg-value">
              <div className="vg-value__icon">✓</div>
              <h3 className="vg-value__title">Firme validate ANRE</h3>
              <p className="vg-value__desc">Fiecare autorizație e verificată manual de echipa noastră.</p>
            </div>
            <div className="vg-value">
              <div className="vg-value__icon">⚡</div>
              <h3 className="vg-value__title">Programare rapidă</h3>
              <p className="vg-value__desc">Alegi ziua, firma te contactează în 24h pentru confirmare.</p>
            </div>
            <div className="vg-value">
              <div className="vg-value__icon">📄</div>
              <h3 className="vg-value__title">Certificat digital</h3>
              <p className="vg-value__desc">PDF cu hash SHA-256 și QR pentru verificare publică.</p>
            </div>
            <div className="vg-value">
              <div className="vg-value__icon">🔔</div>
              <h3 className="vg-value__title">Reminder automat</h3>
              <p className="vg-value__desc">SMS + email cu 30 zile înainte să expire scadența.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORII SERVICII */}
      <section className="vg-section" style={{ background: "var(--surface-2)" }}>
        <div className="container">
          <div className="vg-section__head">
            <p className="vg-section__kicker">Servicii disponibile</p>
            <h2 className="vg-section__title">Ce poți programa</h2>
            <p className="vg-section__sub">
              De la verificarea obligatorie la 2 ani până la montajul detectorului de gaze —
              toate intervențiile necesare pentru siguranța locuinței tale.
            </p>
          </div>

          <ul className="vg-cats">
            {CATEGORY_PAGES.map((c) => (
              <li key={c.slug}>
                <Link href={c.href} className="vg-cat">
                  <div className="vg-cat__icon">{CATEGORY_ICONS[c.slug] ?? "⚡"}</div>
                  <h3 className="vg-cat__title">{c.label}</h3>
                  {c.description && <p className="vg-cat__desc">{c.description}</p>}
                  <span className="vg-cat__link">Vezi firme →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* JUDEȚE TOP */}
      <section className="vg-section">
        <div className="container">
          <div className="vg-section__head">
            <p className="vg-section__kicker">Acoperire națională</p>
            <h2 className="vg-section__title">Firme autorizate în orașele mari</h2>
            <p className="vg-section__sub">
              Listing firme pentru fiecare județ din România. Click pe oraș ca să vezi ofertele locale.
            </p>
          </div>

          <ul className="vg-judete">
            {JUDETE_T1.map((j) => (
              <li key={j.slug}>
                <Link href={`/servicii-gaze/${j.slug}`} className="vg-judet">
                  {j.nume}
                </Link>
              </li>
            ))}
          </ul>
          <div style={{ textAlign: "center", marginTop: 24 }}>
            <Link href="/servicii-gaze" className="vg-btn vg-btn--outline">
              Vezi toate cele 42 de județe →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA BAND — MAGAZIN */}
      <section className="vg-section">
        <div className="container">
          <div className="vg-cta-band">
            <h2>Detectoare de gaze certificate EN50194</h2>
            <p>Protejează-ți familia cu detector cu electrovalvă automată. Livrare rapidă în toată țara.</p>
            <Link href="/magazin" className="vg-btn-lg">Vezi produsele →</Link>
          </div>
        </div>
      </section>

      {/* UTILE */}
      <section className="vg-section" style={{ background: "var(--surface-2)" }}>
        <div className="container">
          <div className="vg-section__head">
            <p className="vg-section__kicker">Ghiduri utile</p>
            <h2 className="vg-section__title">Tot ce trebuie să știi</h2>
            <p className="vg-section__sub">
              20 articole explicate simplu: prețuri, proceduri, sancțiuni, cum alegi firma potrivită.
            </p>
          </div>

          <ul className="vg-cats" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            <li>
              <Link href="/utile/cat-costa-verificarea-instalatiei-de-gaze-2026" className="vg-cat">
                <div className="vg-cat__icon">💰</div>
                <h3 className="vg-cat__title">Cât costă verificarea în 2026</h3>
                <p className="vg-cat__desc">80-250 lei apartament, 150-400 lei casă. Ce influențează costul.</p>
                <span className="vg-cat__link">Citește →</span>
              </Link>
            </li>
            <li>
              <Link href="/utile/amenzi-verificare-gaze-neefectuata" className="vg-cat">
                <div className="vg-cat__icon">⚠️</div>
                <h3 className="vg-cat__title">Amenzi dacă întârzii verificarea</h3>
                <p className="vg-cat__desc">Până la 5.000 lei + suspendare furnizare gaz de la Distrigaz/Delgaz.</p>
                <span className="vg-cat__link">Citește →</span>
              </Link>
            </li>
            <li>
              <Link href="/utile/diferenta-verificare-vs-revizie-gaze" className="vg-cat">
                <div className="vg-cat__icon">📋</div>
                <h3 className="vg-cat__title">Verificare vs revizie — diferența</h3>
                <p className="vg-cat__desc">Verificarea la 2 ani vs revizia la 10 ani. Tabel comparativ.</p>
                <span className="vg-cat__link">Citește →</span>
              </Link>
            </li>
          </ul>
          <div style={{ textAlign: "center", marginTop: 24 }}>
            <Link href="/utile" className="vg-btn vg-btn--outline">
              Vezi toate cele 20 de ghiduri →
            </Link>
          </div>
        </div>
      </section>

      {/* B2B CTA */}
      <section className="vg-section">
        <div className="container">
          <div className="vg-cta-band vg-cta-band--gold">
            <h2>Ești firmă autorizată ANRE?</h2>
            <p>
              Listează-te gratuit și primești programări de la clienți din județul tău.
              Fără Google Ads, fără comisioane pe intervenție.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/inregistrare?firm=1" className="vg-btn-lg">Înscrie firma →</Link>
              <Link href="/abonamente" className="vg-btn-lg" style={{ background: "rgba(255,255,255,.2)", color: "#fff" }}>
                Vezi planurile
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
