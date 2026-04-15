// app/pentru-firme/page.tsx
// B2B landing page — firme autorizate ANRE care vor programări fără Google Ads.
import type { Metadata } from "next"
import Link from "next/link"
import { JsonLdScript } from "@/components/seo/JsonLdScript"
import { faqJsonLd } from "@/lib/seo/jsonld"

export const metadata: Metadata = {
  title: "Pentru firme autorizate ANRE — listare gratuită + programări din județul tău",
  description:
    "Firmă autorizată ANRE? Listează-te gratuit pe verificari-gaze.ro și primești programări pentru verificări, revizii, montaj detector. SEO programatic pentru județul tău, fără Google Ads, fără comision pe intervenție. Dashboard, certificate PDF, reminder SMS.",
  alternates: { canonical: "/pentru-firme" },
}

const B2B_FAQ = [
  {
    q: "Cât costă listarea pe verificari-gaze.ro?",
    a: "Listarea e gratuită pe planul Free — profil de bază + primiri de programări. Planurile plătite (Start 490 lei/an, Plus 890 lei/an, Premium 1.490 lei/an) adaugă vizibilitate prioritară, magazin, featured placement și exclusivitate locală.",
  },
  {
    q: "Cine validează autorizația ANRE?",
    a: "Echipa noastră verifică manual fiecare autorizație în registrul oficial ANRE înainte de aprobare. Durează 1-2 zile lucrătoare. Afișăm numărul autorizației + categoria (EDIB, EDSB, IS) pe profilul public pentru încredere.",
  },
  {
    q: "Cum ajung clienții la firma mea?",
    a: "Apari în rezultatele de căutare Google pentru „verificare gaze {oraș}" și „revizie instalație gaze {localitate}" — SEO programatic acoperă 42 de județe × 7 categorii × 13.854 localități. Clienții completează formularul de programare direct pe cardul firmei tale.",
  },
  {
    q: "Cum primesc banii de la clienți?",
    a: "Pentru servicii tehnice, încasarea e direct între tine și client — verificari-gaze.ro e doar platforma de descoperire și programare. Pentru produse din magazin, Stripe face settlement-ul în contul tău bancar, cu raportare lunară.",
  },
  {
    q: "Pot personaliza template-urile de SMS?",
    a: "Da, pe planul Start și superior poți edita template-urile SMS pentru: confirmare programare, reminder 30 zile înainte de scadență, certificat emis. Dashboard-ul admin îți permite să folosești variabile (nume client, adresă, data).",
  },
  {
    q: "Ce se întâmplă dacă îmi pierd autorizația ANRE?",
    a: "Dacă autorizația expiră sau e revocată, firma e suspendată automat din listing până la reînnoire. Clienții nu pot programa la firme cu autorizație expirată. Te anunțăm cu 30 zile înainte de expirare ca să ai timp să reînnoiești.",
  },
  {
    q: "Pot vedea lead-urile pierdute / neconfirmate?",
    a: "Da. Dashboard-ul arată toate programările: pending (în așteptare confirmare), confirmed, completed, no-show. Vezi rata ta de conversie pe judeţ și identifici clienții care nu s-au prezentat.",
  },
  {
    q: "Câte programări primesc în medie?",
    a: "Depinde de plan + concurență în județul tău. Firmele pe planul Premium (exclusivitate locală) primesc în medie 8-15 cereri / lună per localitate populată. Pe Start, estimativ 3-8 / lună. Volumul crește pe măsură ce rank-ul Google se consolidează.",
  },
]

export default function Page() {
  return (
    <>
      <JsonLdScript data={[faqJsonLd(B2B_FAQ.map((f) => ({ question: f.q, answer: f.a })))]} />

      {/* HERO */}
      <section className="vg-hero">
        <div className="vg-hero__inner">
          <span className="vg-hero__eyebrow">Pentru firme autorizate ANRE + ISCIR</span>
          <h1 className="vg-hero__title">
            Clienți pentru verificări gaze, <em>fără Google Ads</em>
          </h1>
          <p className="vg-hero__sub">
            Listare gratuită în directorul național, SEO programatic pe 42 de județe, dashboard cu programări + certificate PDF + reminder SMS automat la scadență. Zero comision pe intervenție.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 20 }}>
            <Link href="/inregistrare?firm=1" className="vg-btn vg-btn--primary vg-btn--lg">
              Înscrie firma gratuit →
            </Link>
            <Link href="/abonamente" className="vg-btn vg-btn--outline vg-btn--lg">
              Vezi planurile + prețuri
            </Link>
          </div>
          <p style={{ marginTop: 16, fontSize: 14, color: "var(--text-600)" }}>
            ✓ 2 minute · ✓ Aprobare în 1-2 zile · ✓ Zero costuri fixe pe Free
          </p>
        </div>
      </section>

      {/* PAIN POINTS — ce rezolvăm */}
      <section className="vg-section">
        <div className="container">
          <div className="vg-section__head">
            <p className="vg-section__kicker">Problema pe care o rezolvăm</p>
            <h2 className="vg-section__title">Firmele mici pierd clienți pentru că nu au prezență online</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
            {[
              { icon: "❌", t: "Google Ads e scump", d: "10-30 lei / click pentru „verificare gaze Cluj". 90% bounce rate. Nu e sustenabil." },
              { icon: "❌", t: "Site web izolat", d: "Chiar dacă ai site, nu apari pe căutări locale fără SEO complex + backlinks." },
              { icon: "❌", t: "Recomandări din gură", d: "Lent, limitat la zona geografică proprie, nu scalabil." },
              { icon: "❌", t: "Facebook / WhatsApp ad-hoc", d: "Documentele circulă în fotografii, clienții pierd scadențele — și tu pierzi repeat business." },
            ].map((p, i) => (
              <div key={i} style={{ padding: 20, background: "#fff", border: "1px solid var(--border)", borderRadius: 12 }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{p.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px", color: "var(--text-900)" }}>{p.t}</h3>
                <p style={{ fontSize: 13, lineHeight: 1.55, color: "var(--text-600)", margin: 0 }}>{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUTION — ce oferim */}
      <section className="vg-section" style={{ background: "var(--surface-2)" }}>
        <div className="container">
          <div className="vg-section__head">
            <p className="vg-section__kicker">Ce primești</p>
            <h2 className="vg-section__title">Un canal predictibil de achiziție clienți</h2>
            <p className="vg-section__sub">
              Platformă completă pentru firmele tehnice de gaze și centrale termice — vizibilitate, operațiuni, retenție, toate într-un singur dashboard.
            </p>
          </div>

          <div className="vg-values">
            <div className="vg-value">
              <div className="vg-value__icon">🎯</div>
              <h3 className="vg-value__title">SEO programatic</h3>
              <p className="vg-value__desc">Pagină optimizată pentru „verificare gaze + oraș tău" — apari pe Google fără ads.</p>
            </div>
            <div className="vg-value">
              <div className="vg-value__icon">📋</div>
              <h3 className="vg-value__title">Dashboard programări</h3>
              <p className="vg-value__desc">Confirmi / respingi cereri, planifici intervenții, urmărești no-show-uri.</p>
            </div>
            <div className="vg-value">
              <div className="vg-value__icon">📄</div>
              <h3 className="vg-value__title">Certificate PDF</h3>
              <p className="vg-value__desc">Generezi certificatul ANRE direct în platformă — hash SHA-256 + QR public.</p>
            </div>
            <div className="vg-value">
              <div className="vg-value__icon">🔔</div>
              <h3 className="vg-value__title">Reminder automat</h3>
              <p className="vg-value__desc">SMS la clienți cu 30 zile înainte de scadență — te cheamă automat înapoi.</p>
            </div>
            <div className="vg-value">
              <div className="vg-value__icon">👥</div>
              <h3 className="vg-value__title">Gestiune salariați + clienți</h3>
              <p className="vg-value__desc">Tehnicieni, echipamente, proprietăți clienți — totul centralizat, filtrabil.</p>
            </div>
            <div className="vg-value">
              <div className="vg-value__icon">📊</div>
              <h3 className="vg-value__title">Rapoarte lunare</h3>
              <p className="vg-value__desc">Verificări făcute, venit estimat, top zone. Export Excel + PDF.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CUM TE ÎNSCRII — 4 pași */}
      <section className="vg-section">
        <div className="container">
          <div className="vg-section__head">
            <p className="vg-section__kicker">Cum te înscrii</p>
            <h2 className="vg-section__title">4 pași simpli — aprobat în 1-2 zile</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, maxWidth: 1100, margin: "0 auto" }}>
            {[
              { num: "1", t: "Creezi cont", d: "Email + parolă. 30 secunde.", href: "/inregistrare?firm=1" },
              { num: "2", t: "Completezi profilul", d: "Denumire, CUI, autorizație ANRE, servicii, zone operare.", href: null },
              { num: "3", t: "Validăm autorizația", d: "Echipa noastră verifică ANRE Registru. 1-2 zile.", href: null },
              { num: "4", t: "Primești programări", d: "Apari în listing-urile din localitățile tale.", href: null },
            ].map((s) => (
              <div key={s.num} style={{ padding: 24, background: "#fff", border: "1px solid var(--border)", borderRadius: 14, position: "relative", minHeight: 160 }}>
                <div style={{ position: "absolute", top: -18, left: 24, width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent-600), var(--accent-700))", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18 }}>{s.num}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "14px 0 8px", color: "var(--text-900)" }}>{s.t}</h3>
                <p style={{ fontSize: 13, lineHeight: 1.55, color: "var(--text-600)", margin: 0 }}>{s.d}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 28 }}>
            <Link href="/inregistrare?firm=1" className="vg-btn vg-btn--primary vg-btn--lg">
              Începe acum — gratuit →
            </Link>
          </div>
        </div>
      </section>

      {/* PLANS PREVIEW */}
      <section className="vg-section" style={{ background: "var(--surface-2)" }}>
        <div className="container" style={{ maxWidth: 960 }}>
          <div className="vg-section__head">
            <p className="vg-section__kicker">Planuri</p>
            <h2 className="vg-section__title">Pornește gratuit, scalează când vrei</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
            {[
              { name: "Gratuit", price: "0 lei", desc: "Listare + primești programări", href: "/inregistrare?firm=1" },
              { name: "Start", price: "490 lei/an", desc: "Profil complet + template SMS personalizat", href: "/abonamente" },
              { name: "Plus", price: "890 lei/an", desc: "Featured + magazin + analytics", href: "/abonamente" },
              { name: "Premium", price: "1490 lei/an", desc: "Exclusivitate pe o localitate", href: "/abonamente" },
            ].map((p) => (
              <Link key={p.name} href={p.href} style={{ display: "block", padding: 20, background: "#fff", border: "1px solid var(--border)", borderRadius: 12, textDecoration: "none", transition: "transform .15s, box-shadow .15s" }}>
                <div style={{ fontSize: 13, color: "var(--text-500)", fontWeight: 600, marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--accent-700)", marginBottom: 10 }}>{p.price}</div>
                <div style={{ fontSize: 13, color: "var(--text-600)", lineHeight: 1.5 }}>{p.desc}</div>
              </Link>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 24 }}>
            <Link href="/abonamente" className="vg-btn vg-btn--outline">
              Vezi comparația completă →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="vg-section">
        <div className="container" style={{ maxWidth: 820 }}>
          <div className="vg-section__head">
            <p className="vg-section__kicker">Întrebări frecvente</p>
            <h2 className="vg-section__title">Răspunsuri pentru firme ANRE</h2>
          </div>

          <div className="vg-faq">
            {B2B_FAQ.map((item, i) => (
              <details key={i} className="vg-faq__item" open={i === 0}>
                <summary className="vg-faq__q">{item.q}</summary>
                <div className="vg-faq__a">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="vg-section">
        <div className="container">
          <div className="vg-cta-band vg-cta-band--gold">
            <h2>Începe astăzi — 0 lei, fără angajament</h2>
            <p>
              Creezi cont în 2 minute. Echipa noastră validează autorizația în 1-2 zile. Primești prima programare în primele 1-2 săptămâni.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/inregistrare?firm=1" className="vg-btn-lg">Înscrie firma gratuit →</Link>
              <Link href="/contact" className="vg-btn-lg" style={{ background: "rgba(255,255,255,.2)", color: "#fff" }}>
                Întreabă-ne
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
