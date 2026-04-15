// app/contact/page.tsx
import type { Metadata } from "next"
import Link from "next/link"
import { DOMAIN } from "@/lib/config/domain"

export const metadata: Metadata = {
  title: "Contact verificari-gaze.ro — suport, parteneriate, înregistrare firmă",
  description:
    "Scrie-ne pentru suport utilizator, probleme cu programări, parteneriate sau înregistrare firmă autorizată ANRE. Răspundem în 24h lucrătoare. Urgențe gaz: Distrigaz 0 800 877 778.",
  alternates: { canonical: "/contact" },
}

export default function Page() {
  return (
    <>
      {/* HERO */}
      <section className="vg-hero">
        <div className="vg-hero__inner">
          <span className="vg-hero__eyebrow">Suport & contact</span>
          <h1 className="vg-hero__title">Cum te putem ajuta?</h1>
          <p className="vg-hero__sub">
            Suntem o echipă mică și răspundem personal fiecărui mesaj. Timp mediu de răspuns: sub 24h lucrătoare.
            Pentru urgențe reale cu gaz, sună direct distribuitorul.
          </p>
        </div>
      </section>

      {/* URGENȚĂ */}
      <section className="vg-section" style={{ padding: "32px 0" }}>
        <div className="container" style={{ maxWidth: 900 }}>
          <div style={{ padding: 24, background: "#fef2f2", border: "2px solid #dc2626", borderRadius: 14 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#991b1b", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 28 }}>🚨</span> URGENȚĂ GAZ — scurgere, miros puternic, explozie
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-800)", margin: "0 0 14px" }}>
              <strong>NU</strong> folosi verificari-gaze.ro pentru urgențe active. Imediat:
            </p>
            <ol style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-800)", margin: "0 0 14px", paddingLeft: 20 }}>
              <li>Închide <strong>robinetul general</strong> de gaz al apartamentului/casei</li>
              <li>Deschide ferestrele — aerisește spațiul</li>
              <li>Nu aprinde lumina, nu folosi întrerupătoare, nu suna înăuntru</li>
              <li>Ieși din clădire și sună din afară la:</li>
            </ol>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <a href="tel:0800877778" style={{ display: "block", padding: 16, background: "#fff", borderRadius: 10, textDecoration: "none", border: "1px solid #dc2626" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#991b1b", letterSpacing: 0.5 }}>DISTRIGAZ SUD</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#991b1b", marginTop: 4 }}>0 800 877 778</div>
                <div style={{ fontSize: 11, color: "var(--text-500)", marginTop: 2 }}>Gratuit · 24/7</div>
              </a>
              <a href="tel:0800800928" style={{ display: "block", padding: 16, background: "#fff", borderRadius: 10, textDecoration: "none", border: "1px solid #dc2626" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#991b1b", letterSpacing: 0.5 }}>DELGAZ GRID</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#991b1b", marginTop: 4 }}>0 800 800 928</div>
                <div style={{ fontSize: 11, color: "var(--text-500)", marginTop: 2 }}>Gratuit · 24/7</div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT CHANNELS */}
      <section className="vg-section">
        <div className="container" style={{ maxWidth: 900 }}>
          <div className="vg-section__head">
            <p className="vg-section__kicker">Cum să ne contactezi</p>
            <h2 className="vg-section__title">Canale de suport</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            <div style={{ padding: 24, background: "#fff", border: "1px solid var(--border)", borderRadius: 12 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>✉️</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px", color: "var(--text-900)" }}>Email suport</h3>
              <p style={{ fontSize: 14, color: "var(--text-600)", margin: "0 0 10px", lineHeight: 1.5 }}>
                Pentru orice întrebare, problemă cu programare sau parteneriate.
              </p>
              <a href={`mailto:${DOMAIN.contactEmail}`} className="vg-btn vg-btn--primary">
                {DOMAIN.contactEmail}
              </a>
            </div>

            <div style={{ padding: 24, background: "#fff", border: "1px solid var(--border)", borderRadius: 12 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>💼</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px", color: "var(--text-900)" }}>Firme ANRE</h3>
              <p style={{ fontSize: 14, color: "var(--text-600)", margin: "0 0 10px", lineHeight: 1.5 }}>
                Ești firmă autorizată ANRE? Listează-te gratuit și primești programări.
              </p>
              <Link href="/pentru-firme" className="vg-btn vg-btn--outline">
                Detalii firme →
              </Link>
            </div>

            <div style={{ padding: 24, background: "#fff", border: "1px solid var(--border)", borderRadius: 12 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🛒</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px", color: "var(--text-900)" }}>Magazin</h3>
              <p style={{ fontSize: 14, color: "var(--text-600)", margin: "0 0 10px", lineHeight: 1.5 }}>
                Întrebări despre detectoare, comenzi, livrare, garanție.
              </p>
              <Link href="/magazin" className="vg-btn vg-btn--outline">
                Vezi produse →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* COMMON PROBLEMS */}
      <section className="vg-section" style={{ background: "var(--surface-2)" }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <div className="vg-section__head">
            <p className="vg-section__kicker">Probleme frecvente</p>
            <h2 className="vg-section__title">Verifică dacă răspunsul e deja aici</h2>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {[
              { href: "/cum-functioneaza", t: "Cum funcționează platforma", d: "Ghid complet în 3 pași: caută, programează, primește certificat." },
              { href: "/pentru-firme", t: "Cum îmi înscriu firma", d: "4 pași: cont → profil → validare ANRE → primești programări." },
              { href: "/abonamente", t: "Ce include fiecare plan", d: "Comparație Free / Start / Plus / Premium, cu prețuri actualizate." },
              { href: "/confidentialitate", t: "Cum sunt protejate datele mele", d: "GDPR, ce colectăm, cât păstrăm, drepturi utilizator." },
              { href: "/utile/amenzi-verificare-gaze-neefectuata", t: "Ce amenzi risc dacă nu fac verificarea", d: "1.000-10.000 lei + suspendare gaz de la distribuitor." },
              { href: "/utile", t: "Toate ghidurile (20 articole)", d: "Prețuri, proceduri, sancțiuni, cum alegi firma potrivită." },
            ].map((p) => (
              <Link key={p.href} href={p.href} style={{ display: "block", padding: "14px 18px", background: "#fff", border: "1px solid var(--border)", borderRadius: 10, textDecoration: "none", transition: "transform .15s, border-color .15s" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-900)", marginBottom: 3 }}>{p.t} →</div>
                <div style={{ fontSize: 13, color: "var(--text-600)" }}>{p.d}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
