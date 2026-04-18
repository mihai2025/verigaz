// app/page.tsx
// Homepage verificari-gaze.ro — hero + stats + cum funcționează + value props + categorii + județe + FAQ + B2B CTA.
export const revalidate = 3600 // ISR 1h — counts dinamice din DB

import type { Metadata } from "next"
import Link from "next/link"
import { DOMAIN } from "@/lib/config/domain"
import { CATEGORY_PAGES } from "@/lib/servicii-gaze/links"
import { JsonLdScript } from "@/components/seo/JsonLdScript"
import { faqJsonLd } from "@/lib/seo/jsonld"
import { getServiceRoleSupabase } from "@/lib/supabase/server"

async function getFirmCount(): Promise<number> {
  try {
    const admin = getServiceRoleSupabase()
    const { count } = await admin
      .from("gas_firms")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .eq("verification_status", "approved")
    return count ?? 1700
  } catch {
    return 1700
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const n = await getFirmCount()
  return {
    title: "Verificare instalație gaze 2026 — firme autorizate ANRE pe județe",
    description:
      `Găsește firme autorizate ANRE pentru verificare instalație gaze (la 2 ani), revizie (la 10 ani), montaj detector și service centrală termică. Programare online gratuită, certificat digital cu QR, reminder SMS automat la scadență. ${n.toLocaleString("ro-RO")} firme EDIB în 42 județe.`,
    alternates: { canonical: "/" },
  }
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

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "Cât de des trebuie verificată instalația de gaze?",
    a: "Conform ANRE Ord. 179/2015, verificarea tehnică e obligatorie la maxim 2 ani pentru apartamente și case cu instalație de gaz metan. Revizia completă se face la maxim 10 ani. Fără documentele la zi, distribuitorul (Distrigaz / Delgaz) poate suspenda furnizarea.",
  },
  {
    q: "Cât costă verificarea instalației de gaze în 2026?",
    a: "Între 150 și 350 lei pentru un apartament standard (2-3 puncte de consum), 250-500 lei pentru casă. Prețul final apare în cardul firmei înainte să programezi — nu există costuri ascunse. Revizia completă la 10 ani e 300-700 lei.",
  },
  {
    q: "Ce amenzi risc dacă nu fac verificarea la timp?",
    a: "Amenzile pentru neefectuarea verificării pornesc de la 1.000 lei pentru persoane fizice și pot ajunge la 10.000 lei pentru asociații de proprietari. În plus, distribuitorul oprește furnizarea gazului până când prezinți certificat valid.",
  },
  {
    q: "Firmele de pe verificari-gaze.ro sunt verificate?",
    a: "Da. Fiecare firmă are autorizație ANRE validată manual de echipa noastră în registrul oficial. Afișăm numărul autorizației, categoria (EDIB, EDSB, IS etc.) și valabilitatea direct pe profilul public.",
  },
  {
    q: "Primesc certificat valabil la distribuitor după intervenție?",
    a: "Da. Firma emite certificatul ANRE în platformă — PDF cu hash SHA-256 și QR unic de verificare. Poți trimite documentul către Distrigaz sau Delgaz direct sau îl arăți pe telefon. Asiguratorul îl acceptă, de asemenea.",
  },
  {
    q: "Cât durează o verificare tehnică?",
    a: "Verificarea durează 45-90 minute pentru apartament, 1.5-3 ore pentru casă. Revizia completă poate ajunge la o zi întreagă. Firma te contactează în 24h de la programare pentru confirmare dată și oră.",
  },
  {
    q: "Ce se întâmplă dacă firma descoperă probleme?",
    a: "Firma îți prezintă defectele găsite și oferta de remediere. Dacă problema e gravă (scurgere activă), instalația se oprește imediat și trebuie reparată înainte de reluare. Pentru probleme minore, primești termen de remediere până la următoarea verificare.",
  },
  {
    q: "E nevoie să fiu acasă în timpul verificării?",
    a: "Da, e obligatoriu — firma trebuie să aibă acces la toate punctele de consum (aragaz, centrală, robineți). Dacă ești în chirie, proprietarul sau reprezentantul său trebuie să fie prezent și să semneze procesul verbal.",
  },
]

export default async function HomePage() {
  const firmCount = await getFirmCount()
  const firmCountFmt = firmCount.toLocaleString("ro-RO")
  return (
    <>
      <JsonLdScript data={[faqJsonLd(FAQ.map((f) => ({ question: f.q, answer: f.a })))]} />

      {/* HERO */}
      <section className="vg-hero">
        <div className="vg-hero__inner">
          <span className="vg-hero__eyebrow">ANRE Ord. 179/2015 · firme validate ANRE + ISCIR</span>
          <h1 className="vg-hero__title">
            Verificare instalație gaze <em>— firme autorizate ANRE</em> în toată România
          </h1>
          <p className="vg-hero__sub">
            Găsește firmă ANRE pentru <strong>verificare instalație gaze la 2 ani</strong>,{" "}
            <strong>revizie la 10 ani</strong>, montaj detectoare sau service centrală termică.
            {" "}{firmCountFmt} firme active în 42 județe. Programare online gratuită + certificat digital cu QR.
          </p>

          <form method="get" action="/cauta" className="vg-search" role="search">
            <input
              className="vg-search__input"
              name="q"
              placeholder="Caută firmă, oraș sau serviciu (ex: verificare gaze Cluj)…"
              autoComplete="off"
              aria-label="Caută pe verificari-gaze.ro"
            />
            <button type="submit" className="vg-search__btn">Caută</button>
          </form>

          <div className="vg-hero__ctas">
            <Link href="/programare" className="vg-btn vg-btn--primary vg-btn--lg">
              Programează verificarea →
            </Link>
            <Link href="/servicii-gaze" className="vg-btn vg-btn--outline vg-btn--lg">
              Vezi firme pe județ
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

      {/* STATS STRIP */}
      <section className="vg-section" style={{ padding: "40px 0", background: "linear-gradient(135deg, var(--accent-50), #fff)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 24, textAlign: "center" }}>
            <div>
              <div style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: "var(--accent-700)", lineHeight: 1 }}>{firmCountFmt}</div>
              <div style={{ fontSize: 14, color: "var(--text-600)", marginTop: 6, fontWeight: 500 }}>Firme ANRE active</div>
            </div>
            <div>
              <div style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: "var(--accent-700)", lineHeight: 1 }}>42</div>
              <div style={{ fontSize: 14, color: "var(--text-600)", marginTop: 6, fontWeight: 500 }}>Județe acoperite</div>
            </div>
            <div>
              <div style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: "var(--accent-700)", lineHeight: 1 }}>24h</div>
              <div style={{ fontSize: 14, color: "var(--text-600)", marginTop: 6, fontWeight: 500 }}>Timp mediu confirmare</div>
            </div>
            <div>
              <div style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: "var(--accent-700)", lineHeight: 1 }}>0 lei</div>
              <div style={{ fontSize: 14, color: "var(--text-600)", marginTop: 6, fontWeight: 500 }}>Cost căutare + programare</div>
            </div>
          </div>
        </div>
      </section>

      {/* CUM FUNCȚIONEAZĂ — 3 PAȘI */}
      <section className="vg-section">
        <div className="container">
          <div className="vg-section__head">
            <p className="vg-section__kicker">Cum funcționează</p>
            <h2 className="vg-section__title">Verificare instalație gaze în 3 pași — de la căutare la certificat</h2>
            <p className="vg-section__sub">
              Fără telefoane pe necunoscute, fără documente pe hârtie, fără să pierzi din nou scadența.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {[
              {
                num: "1",
                title: "Găsești firma potrivită",
                desc: "Alegi județul + localitatea. Vezi firmele autorizate ANRE cu profil complet: autorizație, recenzii, telefon, adresă. Filtrezi pe categorie de serviciu.",
                cta: "Caută firmă →",
                href: "/servicii-gaze",
              },
              {
                num: "2",
                title: "Programezi online",
                desc: "Formular de 2 minute. Alegi data preferată, confirmi adresa. Primești referință unică (VG-XXXX-XXXX) pe loc. Firma te contactează în 24h pentru confirmare.",
                cta: "Programează →",
                href: "/programare",
              },
              {
                num: "3",
                title: "Primești certificat + reminder",
                desc: "După intervenție, firma emite certificatul ANRE în platformă — PDF cu hash SHA-256 + QR public. Cu 30 zile înainte de următoarea scadență primești SMS automat.",
                cta: "Vezi ghid complet →",
                href: "/cum-functioneaza",
              },
            ].map((step) => (
              <div key={step.num} style={{ padding: 24, background: "#fff", border: "1px solid var(--border)", borderRadius: 14, position: "relative" }}>
                <div style={{ position: "absolute", top: -16, left: 24, width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent-600), var(--accent-700))", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18 }}>{step.num}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: "12px 0 10px", color: "var(--text-900)" }}>{step.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-600)", margin: "0 0 14px" }}>{step.desc}</p>
                <Link href={step.href} style={{ color: "var(--accent-700)", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
                  {step.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="vg-section" style={{ background: "var(--surface-2)" }}>
        <div className="container">
          <div className="vg-section__head">
            <p className="vg-section__kicker">De ce verificari-gaze.ro</p>
            <h2 className="vg-section__title">Singurul director cu firme autorizate ANRE + programare online</h2>
            <p className="vg-section__sub">
              Transparent, rapid, conform cu normele ANRE. Compari firme, programezi online și primești
              documente digitale fără formulare pe hârtie.
            </p>
          </div>

          <div className="vg-values">
            <div className="vg-value">
              <div className="vg-value__icon">✓</div>
              <h3 className="vg-value__title">Firme validate ANRE</h3>
              <p className="vg-value__desc">Fiecare autorizație e verificată manual în registrul ANRE. Afișăm numărul autorizației + categoria.</p>
            </div>
            <div className="vg-value">
              <div className="vg-value__icon">⚡</div>
              <h3 className="vg-value__title">Programare rapidă</h3>
              <p className="vg-value__desc">Alegi ziua, firma te contactează în 24h pentru confirmare — nu mai bați la uși.</p>
            </div>
            <div className="vg-value">
              <div className="vg-value__icon">📄</div>
              <h3 className="vg-value__title">Certificat digital</h3>
              <p className="vg-value__desc">PDF cu hash SHA-256 și QR public — acceptat la Distrigaz, Delgaz, asigurator.</p>
            </div>
            <div className="vg-value">
              <div className="vg-value__icon">🔔</div>
              <h3 className="vg-value__title">Reminder automat</h3>
              <p className="vg-value__desc">SMS + email cu 30 zile înainte de scadență — nu mai plătești amenzi.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORII SERVICII */}
      <section className="vg-section">
        <div className="container">
          <div className="vg-section__head">
            <p className="vg-section__kicker">Servicii disponibile</p>
            <h2 className="vg-section__title">Servicii gaze: verificare, revizie, montaj detectoare, service centrală</h2>
            <p className="vg-section__sub">
              De la verificarea obligatorie la 2 ani până la montajul detectorului de gaze —
              toate intervențiile pentru instalații și centrale termice, cu firme autorizate ANRE și ISCIR.
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
      <section className="vg-section" style={{ background: "var(--surface-2)" }}>
        <div className="container">
          <div className="vg-section__head">
            <p className="vg-section__kicker">Acoperire națională</p>
            <h2 className="vg-section__title">Firme verificare gaze pe județ — toată România</h2>
            <p className="vg-section__sub">
              Directorul oficial al firmelor autorizate ANRE. Click pe județul tău ca să vezi ofertele locale.
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

      {/* FAQ — SEO-focused */}
      <section className="vg-section">
        <div className="container" style={{ maxWidth: 860 }}>
          <div className="vg-section__head">
            <p className="vg-section__kicker">Întrebări frecvente</p>
            <h2 className="vg-section__title">Verificare instalație gaze 2026 — răspunsuri la întrebările tale</h2>
            <p className="vg-section__sub">
              Răspunsuri directe pentru proprietari, asociații și firme. Dacă nu găsești ce cauți,{" "}
              <Link href="/contact" style={{ color: "var(--accent-700)", fontWeight: 600 }}>scrie-ne</Link>.
            </p>
          </div>

          <div className="vg-faq">
            {FAQ.map((item, i) => (
              <details key={i} className="vg-faq__item" open={i === 0}>
                <summary className="vg-faq__q">{item.q}</summary>
                <div className="vg-faq__a">{item.a}</div>
              </details>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 28 }}>
            <Link href="/utile" className="vg-btn vg-btn--outline">
              Vezi toate cele 20 de ghiduri utile →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA BAND — MAGAZIN */}
      <section className="vg-section" style={{ background: "var(--surface-2)" }}>
        <div className="container">
          <div className="vg-cta-band">
            <h2>Detectoare de gaze certificate EN 50194 + EN 50291</h2>
            <p>Protejează-ți familia cu detector de gaz metan + CO cu electrovalvă automată de închidere. Livrare rapidă în toată România, instalare cu firmă ANRE.</p>
            <Link href="/magazin" className="vg-btn-lg">Vezi produsele →</Link>
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
              Fără Google Ads, fără comisioane pe intervenție. {firmCountFmt} firme sunt deja pe platformă.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/inregistrare?firm=1" className="vg-btn-lg">Înscrie firma gratuit →</Link>
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
