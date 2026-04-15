// app/cum-functioneaza/page.tsx
// Cum funcționează verificari-gaze.ro — user journey premium.
import type { Metadata } from "next"
import Link from "next/link"
import { JsonLdScript } from "@/components/seo/JsonLdScript"
import { faqJsonLd } from "@/lib/seo/jsonld"

export const metadata: Metadata = {
  title: "Cum funcționează — găsești firmă ANRE, programezi, primești certificat",
  description:
    "3 pași simpli: cauți firma autorizată ANRE pe județ, programezi online gratuit, primești certificat digital cu QR + reminder automat la următoarea scadență. 1.743 firme validate, 24h confirmare medie.",
  alternates: { canonical: "/cum-functioneaza" },
}

const FAQ = [
  {
    q: "Cât costă serviciul verificari-gaze.ro pentru utilizatori?",
    a: "Zero lei. Căutarea firmelor, programarea online, primirea referinței, verificarea certificatului cu QR, reminderele SMS și email — toate gratuite pentru proprietari și asociații. Plătești doar firma pentru intervenția propriu-zisă.",
  },
  {
    q: "Ce documente primesc după verificarea instalației?",
    a: "Certificatul ANRE în PDF cu hash SHA-256 și QR unic, valabil 2 ani pentru verificare / 10 ani pentru revizie. Documentul e acceptat de Distrigaz, Delgaz, asigurator și orice altă parte interesată. Poți descărca oricând din contul tău.",
  },
  {
    q: "Cum știu că firma aleasă e cu adevărat autorizată?",
    a: "Fiecare firmă are numărul autorizației ANRE afișat public pe profil (ex: EDIB-1234-2020, EDSB-5678-2019). Echipa noastră verifică manual autorizația în registrul oficial ANRE înainte de aprobare. Firmele cu autorizație expirată sunt suspendate automat.",
  },
  {
    q: "Ce e QR-ul de pe certificat?",
    a: "Un cod QR care duce la pagina publică verificari-gaze.ro/verifica-document/XXXX, unde oricine poate confirma că documentul e real, emis de firma menționată, cu hash SHA-256 care garantează ne-alterarea. Protecție împotriva certificatelor false.",
  },
  {
    q: "Cum funcționează reminderele automate?",
    a: "Cu 30 zile înainte să expire scadența (24 luni pentru verificare, 120 pentru revizie) primești: 1 SMS pe numărul tău + 1 email. Cu 7 zile înainte, al doilea SMS de urgență. Poți programa direct din link-ul din SMS, cu aceeași firmă sau alta.",
  },
  {
    q: "Certificatul e acceptat de Distrigaz / Delgaz?",
    a: "Da. E emis de firma ANRE în format conform ANRE Ord. 179/2015. PDF-ul poate fi trimis prin email direct operatorului (distrigaz.ro/ro/contact sau delgaz.ro/contact) sau prezentat fizic. Cod QR confirmă autenticitatea pe loc.",
  },
]

export default function Page() {
  return (
    <>
      <JsonLdScript data={[faqJsonLd(FAQ.map((f) => ({ question: f.q, answer: f.a })))]} />

      {/* HERO */}
      <section className="vg-hero">
        <div className="vg-hero__inner">
          <span className="vg-hero__eyebrow">Ghid utilizator · 100% gratuit</span>
          <h1 className="vg-hero__title">
            De la căutare la certificat, <em>în 3 pași clari</em>
          </h1>
          <p className="vg-hero__sub">
            Fără telefoane pe necunoscute, fără documente pe hârtie, fără să pierzi din nou scadența.
            Verificari-gaze.ro e platforma care face legătura între proprietari și firmele autorizate ANRE.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 20 }}>
            <Link href="/programare" className="vg-btn vg-btn--primary vg-btn--lg">
              Programează acum →
            </Link>
            <Link href="/servicii-gaze" className="vg-btn vg-btn--outline vg-btn--lg">
              Caută firmă pe județ
            </Link>
          </div>
        </div>
      </section>

      {/* 3 STEPS VISUAL */}
      <section className="vg-section">
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
            {[
              {
                num: "1",
                icon: "🔍",
                title: "Găsești firma potrivită",
                bullets: [
                  "Alegi județul + localitatea",
                  "Vezi doar firme cu autorizație ANRE validă",
                  "Filtrezi după categorie: verificare, revizie, montaj detector, reparații",
                  "Comparezi preț, rating, zonă deservită",
                ],
                foot: "Media: 2 minute · 42 județe · 13.854 localități",
              },
              {
                num: "2",
                icon: "📅",
                title: "Programezi online gratuit",
                bullets: [
                  'Apeși „Programează online" pe cardul firmei',
                  "Completezi adresa și data preferată",
                  "Primești referință unică VG-XXXX-XXXX",
                  "Firma te contactează în 24h pentru confirmare",
                ],
                foot: "Media: 2 minute · Zero telefoane",
              },
              {
                num: "3",
                icon: "📄",
                title: "Primești certificat digital",
                bullets: [
                  "Firma emite certificatul PDF în platformă",
                  "Hash SHA-256 + QR public de verificare",
                  "Acceptat la Distrigaz, Delgaz, asigurator",
                  "Reminder automat cu 30 zile înainte de următoarea scadență",
                ],
                foot: "PDF instant · Reminder 30 zile înainte",
              },
            ].map((s) => (
              <div key={s.num} style={{ padding: 28, background: "#fff", border: "2px solid var(--border)", borderRadius: 16, position: "relative" }}>
                <div style={{ position: "absolute", top: -20, left: 28, width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent-600), var(--accent-700))", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20, boxShadow: "0 4px 12px rgba(20, 132, 155, .2)" }}>{s.num}</div>
                <div style={{ fontSize: 40, marginTop: 8, marginBottom: 12 }}>{s.icon}</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 14px", color: "var(--text-900)" }}>{s.title}</h3>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 14px" }}>
                  {s.bullets.map((b, i) => (
                    <li key={i} style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-700)", paddingLeft: 22, position: "relative", marginBottom: 6 }}>
                      <span style={{ position: "absolute", left: 0, color: "var(--accent-600)", fontWeight: 700 }}>✓</span>
                      {b}
                    </li>
                  ))}
                </ul>
                <div style={{ fontSize: 12, color: "var(--text-500)", borderTop: "1px solid var(--border)", paddingTop: 10, fontStyle: "italic" }}>
                  {s.foot}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section className="vg-section" style={{ background: "var(--surface-2)" }}>
        <div className="container">
          <div className="vg-section__head">
            <p className="vg-section__kicker">De ce noi</p>
            <h2 className="vg-section__title">Ce face verificari-gaze.ro diferit</h2>
          </div>

          <div className="vg-values">
            <div className="vg-value">
              <div className="vg-value__icon">🔒</div>
              <h3 className="vg-value__title">Validare ANRE reală</h3>
              <p className="vg-value__desc">Nu copiem lista de pe alte site-uri — verificăm manual în registrul oficial ANRE.</p>
            </div>
            <div className="vg-value">
              <div className="vg-value__icon">⚡</div>
              <h3 className="vg-value__title">Fără intermedieri</h3>
              <p className="vg-value__desc">Plătești direct firma, fără comision pe intervenție. Noi nu luăm banii între.</p>
            </div>
            <div className="vg-value">
              <div className="vg-value__icon">📲</div>
              <h3 className="vg-value__title">Reminder care chiar funcționează</h3>
              <p className="vg-value__desc">SMS + email la 30 zile și 7 zile înainte — nu mai uiți de verificare.</p>
            </div>
            <div className="vg-value">
              <div className="vg-value__icon">🛡️</div>
              <h3 className="vg-value__title">Certificat verificabil public</h3>
              <p className="vg-value__desc">QR + hash SHA-256 — ai dovadă că documentul e real, nu falsificat.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="vg-section">
        <div className="container" style={{ maxWidth: 820 }}>
          <div className="vg-section__head">
            <p className="vg-section__kicker">Întrebări frecvente</p>
            <h2 className="vg-section__title">Răspunsuri directe</h2>
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

      {/* CTA BAND */}
      <section className="vg-section" style={{ background: "linear-gradient(135deg, var(--accent-700), var(--accent-600))", color: "#fff" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <h2 style={{ color: "#fff", fontSize: "clamp(22px, 3vw, 32px)", margin: "0 0 10px" }}>
            Gata să programezi verificarea?
          </h2>
          <p style={{ opacity: 0.9, fontSize: 16, margin: "0 0 24px", maxWidth: 600, marginInline: "auto" }}>
            Formular de 2 minute. O firmă autorizată ANRE te contactează în 24h pentru confirmare.
            Totul gratuit pentru tine.
          </p>
          <Link href="/programare" className="vg-btn vg-btn--lg" style={{ background: "#fff", color: "var(--accent-700)", fontWeight: 700, fontSize: 17 }}>
            Programează gratuit →
          </Link>
        </div>
      </section>
    </>
  )
}
