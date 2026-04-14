// app/page.tsx
// Homepage verigaz — hero + value props + CTA-uri către listing + magazin + pricing.
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
]

export default function HomePage() {
  return (
    <main className="home-page">
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="home-hero container">
        <div className="home-hero__inner">
          <h1 className="home-hero__title">{DOMAIN.heroTitle}</h1>
          <p className="home-hero__sub">{DOMAIN.heroSubtitle}</p>

          <form method="get" action="/cauta" className="home-search">
            <input
              className="home-search__input"
              name="q"
              placeholder="Caută firmă, oraș sau serviciu…"
              autoComplete="off"
              aria-label="Caută pe verigaz"
            />
            <button type="submit" className="home-search__btn">Caută</button>
          </form>

          <div className="home-hero__ctas">
            <Link href="/servicii-gaze" className="shop-btn shop-btn--primary">
              Vezi firme pe județ
            </Link>
            <Link href="/programare" className="shop-btn shop-btn--ghost">
              Programează o verificare
            </Link>
          </div>
        </div>
      </section>

      {/* ── VALUE PROPS ──────────────────────────────────────── */}
      <section className="home-values container">
        <div className="home-value">
          <h3>Firme autorizate ANRE</h3>
          <p>Validăm autorizația fiecărei firme înainte să apară în listing. Fără surprize.</p>
        </div>
        <div className="home-value">
          <h3>Programare online</h3>
          <p>Alegi ziua, firma te contactează pentru confirmare. Fără drumuri, fără așteptare la telefon.</p>
        </div>
        <div className="home-value">
          <h3>Certificat digital</h3>
          <p>După intervenție primești PDF cu semnătură, hash SHA-256 și QR pentru verificare online.</p>
        </div>
        <div className="home-value">
          <h3>Reminder automat</h3>
          <p>Îți trimitem SMS/email cu 30 zile înainte să expire verificarea (24 luni) sau revizia (120 luni).</p>
        </div>
      </section>

      {/* ── CATEGORII SERVICII ───────────────────────────────── */}
      <section className="home-cats container">
        <h2>Ce poți programa pe verigaz</h2>
        <ul className="sv-cat-grid">
          {CATEGORY_PAGES.map((c) => (
            <li key={c.slug}>
              <Link href={c.href} className="sv-cat">
                <span className="sv-cat__name">{c.label}</span>
                {c.description && <span className="sv-cat__desc">{c.description}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ── JUDEȚE TOP ───────────────────────────────────────── */}
      <section className="home-judete container">
        <h2>Județe cu firme autorizate</h2>
        <ul className="sv-judete-grid">
          {JUDETE_T1.map((j) => (
            <li key={j.slug}>
              <Link href={`/servicii-gaze/${j.slug}`} className="sv-judet">
                <span className="sv-judet__name">{j.nume}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p>
          <Link href="/servicii-gaze" className="home-link">Vezi toate cele 42 de județe →</Link>
        </p>
      </section>

      {/* ── MAGAZIN TEASER ───────────────────────────────────── */}
      <section className="home-shop container">
        <div className="home-shop__body">
          <h2>Magazin cu detectoare certificate</h2>
          <p>
            Detectoare gaze cu sigiliu EN50194, senzori CO, electrovalve și piese centrală
            termică. Livrare rapidă, produse testate.
          </p>
          <Link href="/magazin" className="shop-btn shop-btn--primary">
            Vezi produsele →
          </Link>
        </div>
      </section>

      {/* ── PENTRU FIRME (B2B CTA) ───────────────────────────── */}
      <section className="home-b2b container">
        <h2>Ești firmă autorizată ANRE?</h2>
        <p>
          Listează-ți firma pe verigaz și primești programări de la clienți din județul tău,
          cu profile complete și vizibilitate prioritară.
        </p>
        <div className="home-hero__ctas">
          <Link href="/inregistrare?firm=1" className="shop-btn shop-btn--primary">
            Înscrie firma gratuit
          </Link>
          <Link href="/abonamente" className="shop-btn shop-btn--ghost">
            Vezi abonamentele
          </Link>
        </div>
      </section>
    </main>
  )
}
