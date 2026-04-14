// app/servicii-gaze/page.tsx
// Hub național premium — verificări și revizii gaze ANRE. SEO + lead gen.
import type { Metadata } from "next"
import Link from "next/link"
import { getPublicServerSupabase } from "@/lib/supabase/server"
import { CATEGORY_PAGES } from "@/lib/servicii-gaze/links"
import { slugifyRO } from "@/lib/utils/slugify"
import { JsonLdScript } from "@/components/seo/JsonLdScript"
import { breadcrumbJsonLd, faqJsonLd, serviceJsonLd } from "@/lib/seo/jsonld"
import { DOMAIN } from "@/lib/config/domain"

export const metadata: Metadata = {
  title: "Verificări și revizii gaze România — firme autorizate ANRE 2026",
  description:
    "Peste 1.700 firme autorizate ANRE pentru verificare gaze la 2 ani, revizie la 10 ani, montaj detector. Programare rapidă online, prețuri de la 80 lei. Toate județele.",
  keywords: [
    "verificare gaze", "revizie gaze", "ANRE Ord 179 2015", "firme autorizate ANRE",
    "verificare instalatie gaz", "revizie la 10 ani", "montaj detector gaze",
    "servicii gaze Romania", "verificare gaze bucuresti", "verificare gaze cluj",
  ],
  alternates: { canonical: "/servicii-gaze" },
  openGraph: {
    title: "Verificări și revizii gaze — firme autorizate ANRE",
    description: "Peste 1.700 firme verificate, toate județele. Programare online rapidă.",
    url: `${DOMAIN.baseUrl}/servicii-gaze`,
    images: [{ url: `/og?title=${encodeURIComponent("Verificări gaze România")}&subtitle=${encodeURIComponent("1.700+ firme ANRE · toate județele")}&badge=${encodeURIComponent("ANRE · 2026")}&type=serviciu`, width: 1200, height: 630 }],
  },
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

const FAQS = [
  {
    q: "Când e obligatorie verificarea instalației de gaze?",
    a: "Conform ANRE Ord. 179/2015, verificarea tehnică e obligatorie la maxim 24 luni (2 ani), iar revizia completă la maxim 120 luni (10 ani). Obligația se aplică tuturor consumatorilor de gaze naturale — persoane fizice, asociații, firme.",
  },
  {
    q: "Cât costă verificarea în 2026?",
    a: "Între 80 și 250 lei pentru apartamente. Casele între 150 și 400 lei. Asociațiile de proprietari beneficiază de tarife de grup (50-80 lei/apartament). Prețul variază pe oraș, complexitate și firma aleasă.",
  },
  {
    q: "Ce se întâmplă dacă nu fac verificarea la timp?",
    a: "Amenzi de la 1.000 la 5.000 lei pentru persoane fizice, până la 15.000 lei pentru asociații. Distrigaz/Delgaz poate suspenda furnizarea gazului. În caz de incident, asigurarea nu plătește daunele fără raport valabil.",
  },
  {
    q: "Cum verific că firma e autorizată ANRE?",
    a: "Pe verificari-gaze.ro toate firmele listate sunt validate manual în registrul oficial ANRE. Pe card vezi numărul autorizației și categoria (EDIB, EDSB, IS). Poți verifica și tu pe site-ul ANRE.",
  },
  {
    q: "Cât durează programarea?",
    a: "Formularul online durează 2 minute. Firma te contactează pentru confirmare de obicei în 24h. Intervenția propriu-zisă durează 30-60 min pentru apartament, 1-2 ore pentru casă.",
  },
  {
    q: "Primesc documente oficiale?",
    a: "Da. După verificare, firma emite procesul-verbal oficial conform ANRE + declarația de conformitate. Pe verificari-gaze.ro primești și certificat PDF digital cu QR code pentru verificare online — valabil 2 ani.",
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
            { label: "Firme & servicii gaze" },
          ]),
          serviceJsonLd({
            serviceName: "Verificare și revizie instalație gaze naturale",
            description:
              "Servicii autorizate ANRE pentru verificarea periodică (24 luni) și revizia completă (120 luni) a instalațiilor de gaze naturale din România.",
            url: `${DOMAIN.baseUrl}/servicii-gaze`,
            priceRange: "80-800 RON",
          }),
          faqJsonLd(FAQS.map((f) => ({ question: f.q, answer: f.a }))),
        ]}
      />

      {/* HERO */}
      <section className="vg-hero">
        <div className="vg-hero__inner">
          <span className="vg-hero__eyebrow">ANRE · 1.700+ firme · toate județele</span>
          <h1 className="vg-hero__title">
            Firme autorizate ANRE pentru <em>verificări și revizii gaze</em>
          </h1>
          <p className="vg-hero__sub">
            Peste 1.700 de firme cu autorizație ANRE validată manual. Verificare la 2 ani,
            revizie la 10 ani, montaj detector, reparații. <strong>Programare online în 2 minute</strong>,
            prețuri transparente de la 80 lei.
          </p>

          <form method="get" action="/cauta" className="vg-search">
            <input
              className="vg-search__input"
              name="q"
              placeholder="Caută firmă sau oraș..."
              aria-label="Caută firmă"
              autoComplete="off"
            />
            <button type="submit" className="vg-search__btn">Caută</button>
          </form>

          <div className="vg-hero__ctas">
            <Link href="/programare" className="vg-btn vg-btn--primary vg-btn--lg">
              Programează verificarea →
            </Link>
            <Link href="#judete" className="vg-btn vg-btn--outline vg-btn--lg">
              Vezi firme pe județ
            </Link>
          </div>

          <div className="vg-badges">
            <span className="vg-badge"><span className="vg-badge__dot" /> Autorizație ANRE validată</span>
            <span className="vg-badge"><span className="vg-badge__dot" /> Certificat digital cu QR</span>
            <span className="vg-badge"><span className="vg-badge__dot" /> Reminder SMS scadență</span>
            <span className="vg-badge"><span className="vg-badge__dot" /> 42 județe · 13.854 localități</span>
          </div>
        </div>
      </section>

      {/* URGENCY BLOCK */}
      <section className="vg-section" style={{ paddingTop: 40, paddingBottom: 40 }}>
        <div className="container">
          <div className="vg-cta-band" style={{ background: "linear-gradient(135deg, #991b1b, #dc2626)" }}>
            <h2>Ai verificat instalația în ultimii 2 ani?</h2>
            <p>
              <strong>1 din 3 proprietari</strong> au termenul expirat. Riști amendă până la 5.000 lei,
              suspendarea furnizării de gaz, pierderea asigurării. Nu amâna — programează astăzi.
            </p>
            <Link href="/programare" className="vg-btn-lg">
              Programează urgent →
            </Link>
          </div>
        </div>
      </section>

      {/* CATEGORII */}
      <section className="vg-section" style={{ background: "var(--surface-2)" }}>
        <div className="container">
          <div className="vg-section__head">
            <p className="vg-section__kicker">Servicii disponibile</p>
            <h2 className="vg-section__title">7 tipuri de intervenții pe instalație gaze</h2>
            <p className="vg-section__sub">
              De la verificarea obligatorie la 2 ani până la montaj detector și reparații urgente.
              Alege serviciul de care ai nevoie — te ducem direct la firmele potrivite.
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

      {/* HOW IT WORKS */}
      <section className="vg-section">
        <div className="container">
          <div className="vg-section__head">
            <p className="vg-section__kicker">Cum funcționează</p>
            <h2 className="vg-section__title">3 pași până la certificat digital</h2>
            <p className="vg-section__sub">
              Zero drumuri la sediu, zero telefoane pierdute. Tot se întâmplă online, rapid.
            </p>
          </div>

          <div className="vg-values">
            <div className="vg-value">
              <div className="vg-value__icon" style={{ background: "var(--accent-600)", color: "#fff" }}>1</div>
              <h3 className="vg-value__title">Alege județul & localitatea</h3>
              <p className="vg-value__desc">Listing firme ANRE în zona ta, cu preț, recenzii și autorizare vizibile.</p>
            </div>
            <div className="vg-value">
              <div className="vg-value__icon" style={{ background: "var(--accent-600)", color: "#fff" }}>2</div>
              <h3 className="vg-value__title">Programează online</h3>
              <p className="vg-value__desc">Formular de 2 minute. Primești referință unică. Firma te contactează în 24h.</p>
            </div>
            <div className="vg-value">
              <div className="vg-value__icon" style={{ background: "var(--accent-600)", color: "#fff" }}>3</div>
              <h3 className="vg-value__title">Primești certificat digital</h3>
              <p className="vg-value__desc">PDF cu hash SHA-256 + QR de verificare publică. Plus reminder la scadența următoare.</p>
            </div>
          </div>
        </div>
      </section>

      {/* JUDEȚE */}
      <section id="judete" className="vg-section" style={{ background: "var(--surface-2)" }}>
        <div className="container">
          <div className="vg-section__head">
            <p className="vg-section__kicker">Acoperire națională</p>
            <h2 className="vg-section__title">Firme în toate cele 42 de județe</h2>
            <p className="vg-section__sub">
              Click pe județul tău pentru a vedea firmele autorizate ANRE din zona ta, cu prețuri orientative și recenzii.
            </p>
          </div>

          <ul className="vg-judete">
            {list.map((j) => (
              <li key={j.id}>
                <Link href={`/servicii-gaze/${slugifyRO(j.nume as string)}`} className="vg-judet">
                  {j.nume}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* VALUE PROPS — DE CE VERIGAZ */}
      <section className="vg-section">
        <div className="container">
          <div className="vg-section__head">
            <p className="vg-section__kicker">De ce verificari-gaze.ro</p>
            <h2 className="vg-section__title">Avantaje reale față de căutare pe Google</h2>
          </div>

          <div className="vg-values">
            <div className="vg-value">
              <div className="vg-value__icon">✓</div>
              <h3 className="vg-value__title">Autorizație ANRE validată</h3>
              <p className="vg-value__desc">Fiecare firmă e verificată manual. Pe Google riști firme neautorizate sau cu autorizație expirată.</p>
            </div>
            <div className="vg-value">
              <div className="vg-value__icon">⚡</div>
              <h3 className="vg-value__title">Prețuri vizibile</h3>
              <p className="vg-value__desc">Compari preț+zonă+recenzii într-un singur loc. Fără ofertele „prețul la telefon".</p>
            </div>
            <div className="vg-value">
              <div className="vg-value__icon">📄</div>
              <h3 className="vg-value__title">Documente digitale</h3>
              <p className="vg-value__desc">PDF cu QR de verificare publică + arhivare cloud. Nu mai pierzi procesul-verbal.</p>
            </div>
            <div className="vg-value">
              <div className="vg-value__icon">🔔</div>
              <h3 className="vg-value__title">Reminder automat</h3>
              <p className="vg-value__desc">La 30 zile înainte de scadență primești SMS + email. Nu mai riști amendă.</p>
            </div>
            <div className="vg-value">
              <div className="vg-value__icon">💬</div>
              <h3 className="vg-value__title">Recenzii verificate</h3>
              <p className="vg-value__desc">Doar de la clienți reali (cu booking prin platformă). Nu fake reviews.</p>
            </div>
            <div className="vg-value">
              <div className="vg-value__icon">💸</div>
              <h3 className="vg-value__title">Zero comision client</h3>
              <p className="vg-value__desc">Plătești firma direct, la tariful normal. Nu adăugăm comision pe intervenție.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING OVERVIEW */}
      <section className="vg-section" style={{ background: "var(--surface-2)" }}>
        <div className="container">
          <div className="vg-section__head">
            <p className="vg-section__kicker">Prețuri orientative 2026</p>
            <h2 className="vg-section__title">Cât costă serviciile gaze</h2>
            <p className="vg-section__sub">
              Tarife actualizate din ofertele firmelor listate. Prețul final depinde de firma aleasă,
              complexitate și oraș.
            </p>
          </div>

          <div className="vg-cats" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            <div className="vg-cat">
              <div className="vg-cat__icon">🔍</div>
              <h3 className="vg-cat__title">Verificare la 2 ani</h3>
              <p className="vg-cat__desc">
                <strong>80-150 lei</strong> apartament · <strong>150-300 lei</strong> casă · <strong>50-80 lei/ap</strong> asociație
              </p>
            </div>
            <div className="vg-cat">
              <div className="vg-cat__icon">🔧</div>
              <h3 className="vg-cat__title">Revizie la 10 ani</h3>
              <p className="vg-cat__desc">
                <strong>300-500 lei</strong> apartament · <strong>400-700 lei</strong> casă · include curățare + calibrare
              </p>
            </div>
            <div className="vg-cat">
              <div className="vg-cat__icon">📡</div>
              <h3 className="vg-cat__title">Montaj detector</h3>
              <p className="vg-cat__desc">
                <strong>250-450 lei</strong> simplu · <strong>400-700 lei</strong> cu electrovalvă automată
              </p>
            </div>
            <div className="vg-cat">
              <div className="vg-cat__icon">🔨</div>
              <h3 className="vg-cat__title">Reparații</h3>
              <p className="vg-cat__desc">
                Robineți <strong>80-150 lei/buc</strong> · etanșeitate <strong>100-300 lei</strong> · conducte de la <strong>50 lei/m</strong>
              </p>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 24 }}>
            <Link href="/utile/preturi-orientative-servicii-gaze-2026" className="vg-btn vg-btn--outline">
              Vezi toate prețurile detaliate →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="vg-section">
        <div className="container container--narrow">
          <div className="vg-section__head">
            <p className="vg-section__kicker">Întrebări frecvente</p>
            <h2 className="vg-section__title">Răspunsuri pentru proprietari</h2>
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

      {/* GHIDURI UTILE */}
      <section className="vg-section" style={{ background: "var(--surface-2)" }}>
        <div className="container">
          <div className="vg-section__head">
            <p className="vg-section__kicker">Ghiduri utile</p>
            <h2 className="vg-section__title">Tot ce trebuie să știi despre verificarea gazelor</h2>
            <p className="vg-section__sub">
              20 articole gratuite scrise pentru proprietari, nu pentru tehnicieni. Actualizate 2026.
            </p>
          </div>

          <div className="vg-cats" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            <Link href="/utile/cat-costa-verificarea-instalatiei-de-gaze-2026" className="vg-cat">
              <div className="vg-cat__icon">💰</div>
              <h3 className="vg-cat__title">Cât costă verificarea în 2026</h3>
              <p className="vg-cat__desc">Prețuri reale defalcate pe tip locuință. Ce influențează costul.</p>
              <span className="vg-cat__link">Citește →</span>
            </Link>
            <Link href="/utile/amenzi-verificare-gaze-neefectuata" className="vg-cat">
              <div className="vg-cat__icon">⚠️</div>
              <h3 className="vg-cat__title">Amenzi pentru întârziere</h3>
              <p className="vg-cat__desc">Până la 5.000 lei + suspendare furnizare. Cadru legal complet.</p>
              <span className="vg-cat__link">Citește →</span>
            </Link>
            <Link href="/utile/cum-aleg-firma-autorizata-anre" className="vg-cat">
              <div className="vg-cat__icon">🔎</div>
              <h3 className="vg-cat__title">Cum aleg firma potrivită</h3>
              <p className="vg-cat__desc">7 criterii pentru a evita firmele neserioase sau neautorizate.</p>
              <span className="vg-cat__link">Citește →</span>
            </Link>
            <Link href="/utile/documente-necesare-verificare-gaze" className="vg-cat">
              <div className="vg-cat__icon">📋</div>
              <h3 className="vg-cat__title">Documente necesare</h3>
              <p className="vg-cat__desc">Ce să ai la îndemână pentru verificare rapidă.</p>
              <span className="vg-cat__link">Citește →</span>
            </Link>
            <Link href="/utile/diferenta-verificare-vs-revizie-gaze" className="vg-cat">
              <div className="vg-cat__icon">📊</div>
              <h3 className="vg-cat__title">Verificare vs Revizie</h3>
              <p className="vg-cat__desc">Diferența dintre cele 2 ani vs 10 ani. Tabel comparativ.</p>
              <span className="vg-cat__link">Citește →</span>
            </Link>
            <Link href="/utile/siguranta-instalatie-gaze-acasa-ghid-complet" className="vg-cat">
              <div className="vg-cat__icon">🛡️</div>
              <h3 className="vg-cat__title">Siguranța gazelor acasă</h3>
              <p className="vg-cat__desc">Semne de scurgere, prevenție, ce faci în caz de urgență.</p>
              <span className="vg-cat__link">Citește →</span>
            </Link>
          </div>

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
              Listează-te gratuit. Primești programări direct de la clienți din județul tău,
              fără să plătești Google Ads. Zero comision pe intervenții.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/inregistrare?firm=1" className="vg-btn-lg">Înscrie firma gratuit →</Link>
              <Link href="/abonamente" className="vg-btn-lg" style={{ background: "rgba(255,255,255,.2)", color: "#fff" }}>
                Vezi abonamentele
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL URGENCY */}
      <section className="vg-section">
        <div className="container">
          <div className="vg-cta-band">
            <h2>Verificarea durează 30 minute. Amenda durează 3 ani</h2>
            <p>Programează astăzi cu firme care răspund în 24h. 0 comision, 0 stres, 0 riscuri.</p>
            <Link href="/programare" className="vg-btn-lg">Programează verificarea acum →</Link>
          </div>
        </div>
      </section>
    </>
  )
}
