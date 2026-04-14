// app/servicii/page.tsx
// Hub pentru toate categoriile de servicii.
import type { Metadata } from "next"
import Link from "next/link"
import { CATEGORY_PAGES } from "@/lib/servicii-gaze/links"

export const metadata: Metadata = {
  title: "Toate serviciile pentru instalații gaze și centrale termice",
  description:
    "Verificare și revizie instalații gaze, montaj detector, service detector, reparații, VTP și revizie centrală termică.",
  alternates: { canonical: "/servicii" },
}

export default function Page() {
  return (
    <div className="sv-page container">
      <header className="sv-hero">
        <h1 className="sv-title">Servicii pentru instalații gaze și centrale termice</h1>
        <p className="sv-lead">
          Alege categoria de serviciu pentru a vedea firmele autorizate disponibile și pentru a
          filtra pe județ/localitate.
        </p>
      </header>

      <ul className="sv-cat-grid">
        {CATEGORY_PAGES.map((c) => (
          <li key={c.slug}>
            <Link href={`/servicii/${c.slug}`} className="sv-cat">
              <span className="sv-cat__name">{c.label}</span>
              {c.description && <span className="sv-cat__desc">{c.description}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
