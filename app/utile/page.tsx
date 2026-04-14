// app/utile/page.tsx
// Hub pentru cele 20 ghiduri utile — index pentru SEO + UX.
import type { Metadata } from "next"
import Link from "next/link"
import { ARTICLES } from "@/lib/utile/articles"
import { DOMAIN } from "@/lib/config/domain"
import { JsonLdScript } from "@/components/seo/JsonLdScript"
import { breadcrumbJsonLd } from "@/lib/seo/jsonld"

export const metadata: Metadata = {
  title: "Ghiduri utile despre verificări gaze — verificari-gaze.ro",
  description:
    "20 ghiduri practice: prețuri 2026, proceduri ANRE, sancțiuni, alegere instalator, siguranță, centrale termice, detectoare gaz. Tot ce trebuie să știi.",
  keywords: ["ghid verificare gaze", "ANRE Ord 179 2015", "preturi servicii gaze 2026", "siguranta gaze acasa"],
  alternates: { canonical: "/utile" },
  openGraph: {
    title: "Ghiduri utile despre verificări gaze",
    description: "20 articole esențiale pentru proprietari + asociații.",
    url: `${DOMAIN.baseUrl}/utile`,
    images: [{ url: `/og?title=${encodeURIComponent("Ghiduri utile gaze")}&subtitle=${encodeURIComponent("20 articole esențiale")}&badge=GHIDURI&type=articol`, width: 1200, height: 630 }],
  },
}

const CATEGORY_LABELS: Record<string, string> = {
  "ghid-verificare": "Verificări",
  "ghid-revizie": "Revizii",
  "centrala-termica": "Centrală termică",
  "detector": "Detectoare",
  "legal": "Legal & ANRE",
  "siguranta": "Siguranță",
  "preturi": "Prețuri",
  "asociatii": "Asociații proprietari",
}

export default function Page() {
  // Grupează articolele pe categorie pentru navigare clară
  const grouped = new Map<string, typeof ARTICLES>()
  for (const a of ARTICLES) {
    if (!grouped.has(a.category)) grouped.set(a.category, [])
    grouped.get(a.category)!.push(a)
  }

  return (
    <div className="utile-hub container">
      <JsonLdScript
        data={breadcrumbJsonLd([
          { label: "Acasă", href: "/" },
          { label: "Ghiduri utile" },
        ])}
      />

      <header className="utile-hero">
        <h1>Ghiduri utile despre verificări gaze</h1>
        <p className="utile-lead">
          20 articole esențiale despre verificarea instalațiilor de gaze, revizia la 10 ani,
          centrala termică, detectoare și obligațiile legale ANRE. Scrise pentru proprietari,
          actualizate pentru 2026.
        </p>
      </header>

      {[...grouped.entries()].map(([cat, items]) => (
        <section key={cat} className="utile-cat">
          <h2 className="utile-cat__title">{CATEGORY_LABELS[cat] ?? cat}</h2>
          <ul className="utile-grid">
            {items.map((a) => (
              <li key={a.slug} className="utile-card">
                <Link href={`/utile/${a.slug}`} className="utile-card__link">
                  <h3 className="utile-card__title">{a.title}</h3>
                  <p className="utile-card__excerpt">{a.intro.slice(0, 160)}…</p>
                  <span className="utile-card__cta">Citește articolul →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="utile-cta">
        <h2>Ești pregătit să programezi verificarea?</h2>
        <p>Firmele autorizate ANRE din zona ta răspund în 24h.</p>
        <div className="dash-actions-row">
          <Link href="/programare" className="shop-btn shop-btn--primary">
            Programează acum
          </Link>
          <Link href="/servicii-gaze" className="shop-btn shop-btn--ghost">
            Vezi firmele din județul tău
          </Link>
        </div>
      </section>
    </div>
  )
}
