import { DOMAIN } from "@/lib/config/domain"

export default function HomePage() {
  return (
    <main style={{ padding: "3rem 1.25rem", maxWidth: 960, margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2.5rem", lineHeight: 1.15, margin: 0 }}>
          {DOMAIN.heroTitle}
        </h1>
        <p style={{ fontSize: "1.125rem", color: "#475569", marginTop: "0.75rem" }}>
          {DOMAIN.heroSubtitle}
        </p>
      </header>

      <section
        style={{
          border: "1px dashed #cbd5e1",
          padding: "1.5rem",
          borderRadius: 12,
          background: "#f8fafc",
        }}
      >
        <strong>Verigaz — schelet inițial.</strong>
        <p style={{ marginTop: "0.5rem", color: "#475569" }}>
          Acest landing va fi înlocuit cu UI-ul portat din ghidulfunerar (search,
          cards firme, CTA programare, magazin teaser) după scaffold. Momentan
          confirmă că build-ul Next.js pornește corect.
        </p>
      </section>
    </main>
  )
}
