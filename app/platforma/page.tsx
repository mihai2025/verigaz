// app/platforma/page.tsx
// Pagina de prezentare: Platforma de gestiune pentru firme ANRE.
// Fee lunar + SMS pay-per-use, configurat din admin.
export const revalidate = 300

import type { Metadata } from "next"
import Link from "next/link"
import { getGestiuneSettings, getSmsTariffCents } from "@/lib/settings/appSettings"
import { JsonLdScript } from "@/components/seo/JsonLdScript"
import { faqJsonLd } from "@/lib/seo/jsonld"

export const metadata: Metadata = {
  title: "Platformă de gestiune firme ANRE — clienți, contracte, programări, SMS, rapoarte",
  description:
    "Software complet de gestiune pentru firme autorizate ANRE: gestionare clienți & adrese, contracte de verificare, programare echipe de teren, certificate digitale PDF, notificări SMS automate, rapoarte lunare. Fee lunar accesibil + SMS pay-per-use.",
  alternates: { canonical: "/platforma" },
}

const MODULES = [
  {
    icon: "👥",
    title: "Gestiune clienți & adrese",
    desc: "Bază de date centralizată: proprietar / asociație, adresele de deservire, istoric intervenții pe fiecare adresă. Filtrare după județ, localitate, scadență.",
  },
  {
    icon: "📋",
    title: "Contracte & perioade",
    desc: "Creează contracte de verificare/revizie pe perioadă (2 ani / 10 ani). Tracking automat perioadă curentă, data scadenței, status (activ / expirat / reziliat).",
  },
  {
    icon: "📅",
    title: "Programări & confirmare",
    desc: "Calendar programări de la clienți (din site) sau create manual. Confirmare/respingere, atribuire tehnician, tracking status (pending → confirmed → completed / no-show).",
  },
  {
    icon: "👷",
    title: "Salariați & echipe de teren",
    desc: "Evidența tehnicienilor autorizați. Atribuire zone, fișe de lucru zilnice, raport intervenții per tehnician. Export foaie zilnică PDF.",
  },
  {
    icon: "⚙️",
    title: "Echipamente per locație",
    desc: "Catalog echipamente (centrală, detector, electrovalvă) pe fiecare adresă de client. Tracking brand, model, serie, data montaj, data ultimei verificări, scadență.",
  },
  {
    icon: "📄",
    title: "Certificate digitale PDF",
    desc: "Generare proces verbal ANRE direct din platformă. Hash SHA-256 + QR public de verificare. Acceptat la distribuitor (Distrigaz, Delgaz) și asigurator.",
  },
  {
    icon: "📲",
    title: "Notificări SMS automate",
    desc: "SMS la 30 de zile și 7 zile înainte de scadența verificării clientului. Link direct către firma ta pentru reprogramare. Template-uri personalizabile.",
  },
  {
    icon: "📊",
    title: "Rapoarte lunare",
    desc: "Verificări efectuate, revizii în termen, tehnicieni pe rute, clienți noi vs. reveniri. Export Excel + PDF. Dashboard KPI cu grafice.",
  },
  {
    icon: "🧾",
    title: "Fișe de lucru",
    desc: "Generare fișă zilnică per echipă: adrese de vizitat, echipamente de verificat, observații anterioare. Print-friendly sau pe telefon.",
  },
  {
    icon: "🛒",
    title: "Magazin online integrat",
    desc: "Vinde detectoare, electrovalve, piese direct din profil. Comandă cu livrare sau instalare. Stripe checkout integrat.",
  },
]

const FAQ = [
  {
    q: "Cât costă platforma de gestiune?",
    a: "Poți alege între plata lunară sau plata anuală (cu 2 luni reducere față de lunar). Prețul actualizat e afișat mai jos. În plus, SMS-urile suplimentare se facturează la tarif per segment — primele 50/lună sunt incluse. Fără contract pe perioadă minimă — poți anula oricând.",
  },
  {
    q: "Pot folosi platforma fără abonament de vizibilitate?",
    a: "Da. Platforma de gestiune e separată de planurile de vizibilitate (Free/Start/Plus/Premium). Poți avea listare gratuită + gestiune completă. Sau Premium + gestiune. Sunt independente.",
  },
  {
    q: "Ce se întâmplă cu datele mele dacă anulez?",
    a: "Datele rămân în cont 90 de zile. Poți exporta oricând (clienți, echipamente, contracte) în Excel. După 90 de zile, datele sunt șterse conform GDPR.",
  },
  {
    q: "Câți clienți/adrese pot avea?",
    a: "Nelimitat. Fee-ul lunar acoperă oricâți clienți, adrese, echipamente și contracte. Singurul consum variabil e SMS-ul.",
  },
  {
    q: "Cum funcționează SMS-urile automate?",
    a: "Configurezi template-ul (ex: 'Bună {nume}, verificarea gaze la {adresă} expiră pe {data}. Programează la {link}'). Platforma trimite automat la 30 zile și 7 zile înainte de scadență. Primele 50/lună incluse, restul la tarif per segment.",
  },
  {
    q: "Pot genera certificate ANRE din platformă?",
    a: "Da. După completarea intervenției, generezi certificatul PDF cu date pre-completate (client, adresă, echipamente, valori măsurate). PDF-ul are hash SHA-256 + QR public de verificare. Formatul respectă ANRE Ord. 179/2015.",
  },
  {
    q: "Funcționează pe telefon?",
    a: "Da. Dashboard-ul e responsive — tehnicianul poate confirma programări, completa fișa de lucru și genera certificatul direct de pe telefon, în teren. Nu e nevoie de aplicație separată.",
  },
  {
    q: "Cum import clienții existenți?",
    a: "Export din Excel/CSV → import direct în platformă. Suportăm: nume, telefon, adresă, echipamente, data ultimei verificări. Echipa noastră te ajută la prima configurare.",
  },
]

export default async function PlatformaPage() {
  const [gestiune, smsTariffCents] = await Promise.all([
    getGestiuneSettings(),
    getSmsTariffCents(),
  ])

  const smsTariffLei = (smsTariffCents / 100).toFixed(2)
  const monthsFromAnnual = gestiune.monthlyFee > 0
    ? +(gestiune.annualFee / gestiune.monthlyFee).toFixed(1)
    : 12
  const monthsSaved = Math.max(0, +(12 - monthsFromAnnual).toFixed(1))

  return (
    <>
      <JsonLdScript data={[faqJsonLd(FAQ.map((f) => ({ question: f.q, answer: f.a })))]} />

      {/* HERO */}
      <section className="vg-hero">
        <div className="vg-hero__inner">
          <span className="vg-hero__eyebrow">Software de gestiune · pentru firme ANRE</span>
          <h1 className="vg-hero__title">
            Platforma completă de gestiune <em>pentru firme de gaze</em>
          </h1>
          <p className="vg-hero__sub">
            Clienți, contracte, programări, echipe de teren, certificate digitale, notificări SMS
            automate la scadență, rapoarte lunare. Tot ce ai nevoie ca firmă ANRE pentru a fi
            organizat, conform și profitabil — într-un singur dashboard.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 20 }}>
            <Link href="/inregistrare?firm=1" className="vg-btn vg-btn--primary vg-btn--lg">
              Începe acum — 14 zile gratuit →
            </Link>
            <a href="#pret" className="vg-btn vg-btn--outline vg-btn--lg">
              Vezi prețul
            </a>
          </div>
          <p style={{ marginTop: 16, fontSize: 14, color: "var(--text-600)" }}>
            ✓ Fără contract minim · ✓ Clienți nelimitați · ✓ 50 SMS/lună incluse · ✓ Funcționează pe telefon
          </p>
        </div>
      </section>

      {/* STATS */}
      <section className="vg-section" style={{ padding: "36px 0", background: "linear-gradient(135deg, var(--accent-50), #fff)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 20, textAlign: "center" }}>
            <div>
              <div style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, color: "var(--accent-700)", lineHeight: 1 }}>10</div>
              <div style={{ fontSize: 13, color: "var(--text-600)", marginTop: 6, fontWeight: 500 }}>Module operaționale</div>
            </div>
            <div>
              <div style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, color: "var(--accent-700)", lineHeight: 1 }}>∞</div>
              <div style={{ fontSize: 13, color: "var(--text-600)", marginTop: 6, fontWeight: 500 }}>Clienți & adrese</div>
            </div>
            <div>
              <div style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, color: "var(--accent-700)", lineHeight: 1 }}>PDF</div>
              <div style={{ fontSize: 13, color: "var(--text-600)", marginTop: 6, fontWeight: 500 }}>Certificate SHA-256 + QR</div>
            </div>
            <div>
              <div style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, color: "var(--accent-700)", lineHeight: 1 }}>SMS</div>
              <div style={{ fontSize: 13, color: "var(--text-600)", marginTop: 6, fontWeight: 500 }}>Reminder-e automate scadențe</div>
            </div>
          </div>
        </div>
      </section>

      {/* MODULES — 10 feature cards */}
      <section className="vg-section">
        <div className="container">
          <div className="vg-section__head">
            <p className="vg-section__kicker">Ce include platforma</p>
            <h2 className="vg-section__title">10 module pentru operațiunile zilnice</h2>
            <p className="vg-section__sub">
              Fiecare modul e construit specific pentru firme autorizate ANRE — nu e un CRM generic adaptat.
              Terminologia, fluxurile și documentele respectă legislația românească (Ord. 179/2015).
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {MODULES.map((m, i) => (
              <div key={i} style={{ padding: 24, background: "#fff", border: "1px solid var(--border)", borderRadius: 14, transition: "transform .15s, box-shadow .15s" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{m.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 10px", color: "var(--text-900)" }}>{m.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-600)", margin: 0 }}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING CARD */}
      <section className="vg-section" style={{ background: "var(--surface-2)" }} id="pret">
        <div className="container" style={{ maxWidth: 900 }}>
          <div className="vg-section__head">
            <p className="vg-section__kicker">Preț simplu, fără surprize</p>
            <h2 className="vg-section__title">Fee lunar + SMS pay-per-use</h2>
            <p className="vg-section__sub">
              Un singur abonament lunar care acoperă tot — clienți nelimitați, module complete, suport inclus.
              Plătești extra doar SMS-urile peste pachetul inclus.
            </p>
          </div>

          <div style={{ maxWidth: 560, margin: "0 auto" }}>
            <div style={{
              background: "linear-gradient(135deg, #fff, var(--accent-50))",
              border: "2px solid var(--accent-400)",
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 12px 40px rgba(20, 132, 155, .12)",
            }}>
              {/* Header */}
              <div style={{ padding: "24px 28px 16px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-700)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Platformă de gestiune
                    </div>
                    <div style={{ fontSize: 14, color: "var(--text-600)", marginTop: 4 }}>
                      Tot ce ai nevoie ca firmă ANRE
                    </div>
                  </div>
                  <div style={{ padding: "4px 12px", borderRadius: 999, background: "var(--accent-600)", color: "#fff", fontSize: 11, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase" }}>
                    Recomandat
                  </div>
                </div>
              </div>

              {/* Price — lunar vs anual */}
              <div style={{ padding: "24px 28px 16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 10 }}>
                  <div style={{ padding: 16, background: "#fff", border: "1px solid var(--border)", borderRadius: 10, textAlign: "center" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--text-600)", letterSpacing: 0.5 }}>Lunar</div>
                    <div style={{ fontSize: "clamp(28px, 4vw, 38px)", fontWeight: 800, color: "var(--accent-700)", lineHeight: 1, marginTop: 6 }}>
                      {gestiune.monthlyFee}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-600)", marginTop: 2 }}>lei / lună</div>
                  </div>
                  <div style={{ padding: 16, background: "linear-gradient(135deg, var(--accent-50), #fff)", border: "2px solid var(--accent-400)", borderRadius: 10, textAlign: "center", position: "relative" }}>
                    {monthsSaved > 0 && (
                      <span style={{ position: "absolute", top: -10, right: 10, padding: "3px 9px", borderRadius: 999, background: "#1e6b34", color: "#fff", fontSize: 10, fontWeight: 800, letterSpacing: 0.3 }}>
                        -{monthsSaved} luni
                      </span>
                    )}
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--text-600)", letterSpacing: 0.5 }}>Anual</div>
                    <div style={{ fontSize: "clamp(28px, 4vw, 38px)", fontWeight: 800, color: "var(--accent-700)", lineHeight: 1, marginTop: 6 }}>
                      {gestiune.annualFee}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-600)", marginTop: 2 }}>lei / an</div>
                  </div>
                </div>
                <div style={{ fontSize: 14, color: "var(--text-500)", textAlign: "center", marginTop: 12 }}>
                  + <strong>{smsTariffLei} lei/segment SMS</strong> suplimentar
                </div>
                <div style={{ fontSize: 13, color: "var(--accent-700)", fontWeight: 600, marginTop: 4, textAlign: "center" }}>
                  {gestiune.smsIncluded} SMS/lună incluse în abonament
                </div>
              </div>

              {/* Features */}
              <div style={{ padding: "0 28px 24px" }}>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
                  {[
                    "Clienți & adrese nelimitate",
                    "Contracte cu tracking perioadă + scadență",
                    "Programări: calendar + confirmare + atribuire",
                    "Salariați: evidență + fișe de lucru + rapoarte",
                    "Echipamente per locație (brand, serie, scadență)",
                    "Certificate PDF cu SHA-256 + QR public",
                    `${gestiune.smsIncluded} SMS/lună incluse (reminder automat)`,
                    "Rapoarte lunare: verificări, revizii, tehnicieni",
                    "Dashboard KPI + analytics",
                    "Magazin online integrat (opțional)",
                    "Funcționează pe telefon (responsive)",
                    "Fără contract minim — anulezi oricând",
                  ].map((f, i) => (
                    <li key={i} style={{ display: "flex", gap: 10, fontSize: 14, color: "var(--text-700)", lineHeight: 1.5 }}>
                      <span style={{ color: "var(--accent-600)", fontWeight: 700, flexShrink: 0 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div style={{ padding: "0 28px 28px" }}>
                <Link
                  href="/inregistrare?firm=1"
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "14px 20px",
                    borderRadius: 12,
                    background: "linear-gradient(135deg, var(--accent-600), var(--accent-700))",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: 16,
                    textDecoration: "none",
                    transition: "transform .15s, box-shadow .15s",
                  }}
                >
                  Începe gratuit 14 zile →
                </Link>
                <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-500)", marginTop: 10 }}>
                  Nu e nevoie de card bancar pentru trial. Plata prin transfer sau Stripe.
                </p>
              </div>
            </div>
          </div>

          {/* Comparison note */}
          <div style={{ marginTop: 28, textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "var(--text-600)", marginBottom: 12 }}>
              <strong>Platformă de gestiune</strong> e independentă de <strong>planurile de vizibilitate</strong> (Free/Start/Plus/Premium).
              Poți combina orice plan de vizibilitate cu platforma de gestiune.
            </p>
            <Link href="/abonamente" className="vg-btn vg-btn--outline">
              Vezi planurile de vizibilitate →
            </Link>
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="vg-section">
        <div className="container">
          <div className="vg-section__head">
            <p className="vg-section__kicker">Cui se adresează</p>
            <h2 className="vg-section__title">Construit pentru firme de gaze, nu adaptat din altceva</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {[
              {
                icon: "🔧",
                title: "Firme mici (1-3 tehnicieni)",
                desc: "Renunți la Excel și la caietul cu adrese. Totul centralizat, cu reminder-e care aduc clienții înapoi singuri la 2 ani.",
              },
              {
                icon: "🏢",
                title: "Firme medii (4-15 tehnicieni)",
                desc: "Fișe de lucru per echipă, rapoarte per tehnician, programare inteligentă pe zone geografice. Scaleazi fără haos.",
              },
              {
                icon: "📊",
                title: "Asociații de proprietari",
                desc: "Firm-ul tău gestionează sute de apartamente? Tracking per bloc, per scară, per apartament. Raport lunar pentru administrator.",
              },
            ].map((c, i) => (
              <div key={i} style={{ padding: 24, background: "#fff", border: "1px solid var(--border)", borderRadius: 14 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{c.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 10px", color: "var(--text-900)" }}>{c.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-600)", margin: 0 }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="vg-section" style={{ background: "var(--surface-2)" }}>
        <div className="container" style={{ maxWidth: 820 }}>
          <div className="vg-section__head">
            <p className="vg-section__kicker">Întrebări frecvente</p>
            <h2 className="vg-section__title">Răspunsuri despre platforma de gestiune</h2>
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
            Organizează-ți firma în 2026 — digital, conform, profitabil
          </h2>
          <p style={{ opacity: 0.9, fontSize: 16, margin: "0 0 24px", maxWidth: 600, marginInline: "auto" }}>
            14 zile gratuit, fără card bancar. {gestiune.monthlyFee} lei/lună sau {gestiune.annualFee} lei/an{monthsSaved > 0 ? ` (economisești ${monthsSaved} luni)` : ""}. Anulezi oricând.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/inregistrare?firm=1" className="vg-btn vg-btn--lg" style={{ background: "#fff", color: "var(--accent-700)", fontWeight: 700 }}>
              Începe gratuit →
            </Link>
            <Link href="/contact" className="vg-btn vg-btn--lg" style={{ background: "rgba(255,255,255,.2)", color: "#fff", border: "1px solid rgba(255,255,255,.3)" }}>
              Cere o demonstrație
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
