// app/despre/page.tsx
// Despre verificari-gaze.ro — E-E-A-T (Experience, Expertise, Authority, Trust) pentru SEO.
import type { Metadata } from "next"
import Link from "next/link"
import { DOMAIN } from "@/lib/config/domain"

export const metadata: Metadata = {
  title: "Despre verificari-gaze.ro — platforma națională pentru siguranța gazelor",
  description:
    "Verificari-gaze.ro e platforma națională care conectează proprietarii din România cu firme autorizate ANRE pentru verificare, revizie, montaj detector gaze și service centrală termică. Director validat manual, certificate digitale, reminder automat.",
  alternates: { canonical: "/despre" },
}

export default function Page() {
  return (
    <>
      {/* HERO */}
      <section className="vg-hero">
        <div className="vg-hero__inner">
          <span className="vg-hero__eyebrow">Misiunea noastră</span>
          <h1 className="vg-hero__title">
            Siguranța gazelor, <em>accesibilă oricui din România</em>
          </h1>
          <p className="vg-hero__sub">
            Verificari-gaze.ro e platforma națională care conectează proprietarii și asociațiile
            de proprietari cu firmele autorizate ANRE pentru toate intervențiile la instalații de gaze
            naturale și centrale termice — verificări obligatorii, revizii, montaj detector și service.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 20 }}>
            <Link href="/programare" className="vg-btn vg-btn--primary vg-btn--lg">
              Programează verificarea →
            </Link>
            <Link href="/contact" className="vg-btn vg-btn--outline vg-btn--lg">
              Contactează-ne
            </Link>
          </div>
        </div>
      </section>

      {/* THE PROBLEM */}
      <section className="vg-section">
        <div className="container" style={{ maxWidth: 900 }}>
          <div className="vg-section__head">
            <p className="vg-section__kicker">De ce am construit platforma</p>
            <h2 className="vg-section__title">Problema verificărilor pierdute și a firmelor invisibile</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
            <p style={{ fontSize: 16, lineHeight: 1.75, color: "var(--text-700)" }}>
              Conform <strong>ANRE Ord. 179/2015</strong>, fiecare instalație de gaze naturale din
              România trebuie verificată la maxim 2 ani și revizuită la maxim 10 ani. În realitate,
              <strong> peste 1 din 3 proprietari</strong> pierd scadența și riscă:
            </p>

            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
              {[
                "Amenzi între 1.000 și 10.000 lei aplicate de ANRE",
                "Suspendarea furnizării gazelor de către distribuitor (Distrigaz, Delgaz)",
                "Anularea asigurării locuinței în caz de incident cu gaz",
                "Accidente evitabile — scurgeri, intoxicații CO, explozii",
              ].map((item, i) => (
                <li key={i} style={{ padding: "12px 16px", background: "#fef2f2", borderLeft: "4px solid #dc2626", borderRadius: "0 8px 8px 0", fontSize: 15, color: "var(--text-800)" }}>
                  <strong>⚠️</strong> {item}
                </li>
              ))}
            </ul>

            <p style={{ fontSize: 16, lineHeight: 1.75, color: "var(--text-700)" }}>
              Problema nu e reaua-voință — e <strong>lipsa de infrastructură digitală</strong>:
              nu există un registru public al firmelor autorizate pe județe, firmele mici nu au
              prezență online, documentele circulă în poze WhatsApp, și nimeni nu te avertizează
              când expiră verificarea.
            </p>
          </div>
        </div>
      </section>

      {/* WHAT WE OFFER */}
      <section className="vg-section" style={{ background: "var(--surface-2)" }}>
        <div className="container">
          <div className="vg-section__head">
            <p className="vg-section__kicker">Soluția</p>
            <h2 className="vg-section__title">Ce oferim — infrastructură digitală pentru siguranța gazelor</h2>
          </div>

          <div className="vg-values">
            <div className="vg-value">
              <div className="vg-value__icon">📚</div>
              <h3 className="vg-value__title">Director național validat</h3>
              <p className="vg-value__desc">1.743 firme autorizate ANRE, filtrabile pe județ / localitate / serviciu. Fiecare autorizație verificată manual în registrul oficial ANRE.</p>
            </div>
            <div className="vg-value">
              <div className="vg-value__icon">✅</div>
              <h3 className="vg-value__title">Validare reală, nu web-scraping</h3>
              <p className="vg-value__desc">Echipa noastră confirmă numărul autorizației, categoria (EDIB, EDSB, IS) și valabilitatea — înainte de listare și periodic după.</p>
            </div>
            <div className="vg-value">
              <div className="vg-value__icon">📅</div>
              <h3 className="vg-value__title">Programare online gratuită</h3>
              <p className="vg-value__desc">Formular de 2 minute → referință unică → firma te contactează în 24h. Zero costuri pentru utilizator.</p>
            </div>
            <div className="vg-value">
              <div className="vg-value__icon">📄</div>
              <h3 className="vg-value__title">Certificate digitale verificabile</h3>
              <p className="vg-value__desc">PDF cu hash SHA-256 + QR public. Acceptat la Distrigaz, Delgaz, asigurator. Imposibil de falsificat.</p>
            </div>
            <div className="vg-value">
              <div className="vg-value__icon">🔔</div>
              <h3 className="vg-value__title">Reminder automat</h3>
              <p className="vg-value__desc">SMS + email cu 30 zile înainte de scadență. Al doilea SMS cu 7 zile înainte. Nu mai plătești amenzi.</p>
            </div>
            <div className="vg-value">
              <div className="vg-value__icon">🛒</div>
              <h3 className="vg-value__title">Magazin certificat</h3>
              <p className="vg-value__desc">Detectoare EN 50194 + EN 50291, senzori CO, electrovalve — livrate rapid, instalabile cu firmă ANRE.</p>
            </div>
          </div>
        </div>
      </section>

      {/* BUSINESS MODEL */}
      <section className="vg-section">
        <div className="container" style={{ maxWidth: 800 }}>
          <div className="vg-section__head">
            <p className="vg-section__kicker">Model de business transparent</p>
            <h2 className="vg-section__title">Cum ne susținem — fără să-ți cerem bani ție</h2>
          </div>

          <p style={{ fontSize: 16, lineHeight: 1.75, color: "var(--text-700)", marginBottom: 20 }}>
            Căutarea, programarea, certificatul digital și reminderele sunt <strong>gratuite</strong>
            pentru proprietari și asociații de proprietari. Ne susținem din:
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ padding: 20, background: "#fff", border: "1px solid var(--border)", borderRadius: 12 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>💼</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px", color: "var(--text-900)" }}>Abonamente firme ANRE</h3>
              <p style={{ fontSize: 13, lineHeight: 1.55, color: "var(--text-600)", margin: 0 }}>
                Firmele plătesc abonament dacă vor vizibilitate prioritară (<Link href="/abonamente" style={{ color: "var(--accent-700)" }}>vezi planurile</Link>). Firmele pe planul Free sunt listate complet.
              </p>
            </div>
            <div style={{ padding: 20, background: "#fff", border: "1px solid var(--border)", borderRadius: 12 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🛒</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px", color: "var(--text-900)" }}>Comisioane magazin</h3>
              <p style={{ fontSize: 13, lineHeight: 1.55, color: "var(--text-600)", margin: 0 }}>
                Comision mic pe tranzacțiile din <Link href="/magazin" style={{ color: "var(--accent-700)" }}>magazinul nostru</Link> (detectoare, senzori, electrovalve).
              </p>
            </div>
          </div>

          <p style={{ fontSize: 14, lineHeight: 1.75, color: "var(--text-500)", marginTop: 24, textAlign: "center", fontStyle: "italic" }}>
            Nu percepem comision pe intervențiile tehnice — banii rămân între tine și firmă.
          </p>
        </div>
      </section>

      {/* CONTACT */}
      <section className="vg-section" style={{ background: "linear-gradient(135deg, var(--accent-700), var(--accent-600))", color: "#fff" }}>
        <div className="container" style={{ maxWidth: 700, textAlign: "center" }}>
          <h2 style={{ color: "#fff", fontSize: "clamp(22px, 3vw, 32px)", margin: "0 0 10px" }}>
            Ai o întrebare? Scrie-ne
          </h2>
          <p style={{ opacity: 0.9, fontSize: 16, margin: "0 0 24px" }}>
            Echipa verificari-gaze.ro răspunde în 24h lucrătoare. Pentru urgențe gaz sună direct
            <br />
            <strong style={{ color: "#fff" }}>Distrigaz 0 800 877 778 · Delgaz 0 800 800 928</strong>
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href={`mailto:${DOMAIN.contactEmail}`} className="vg-btn vg-btn--lg" style={{ background: "#fff", color: "var(--accent-700)", fontWeight: 700 }}>
              ✉ {DOMAIN.contactEmail}
            </a>
            <Link href="/contact" className="vg-btn vg-btn--lg" style={{ background: "rgba(255,255,255,.2)", color: "#fff", border: "1px solid rgba(255,255,255,.3)" }}>
              Formular contact
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
